import { useState, useEffect, useCallback } from 'react'
import { db } from './firebase.js'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore'
import { INITIAL_EVENTS, CATEGORIES, DAY_LABELS } from './events.js'
import EventModal from './components/EventModal.jsx'
import TeamModal from './components/TeamModal.jsx'
import PersonsModal from './components/PersonsModal.jsx'
import BriefingModal from './components/BriefingModal.jsx'
import PinLock from './components/PinLock.jsx'
import ProfileModal from './components/ProfileModal.jsx'
import ProfileView from './components/ProfileView.jsx'
import { googleCalendarUrl, outlookCalendarUrl, downloadIcs } from './components/calendarExport.js'

const CAT_COLORS = {
  MVS:          '#007aff',
  Talk:         '#c9953a',
  Seminar:      '#34c759',
  Vernissage:   '#af52de',
  Vortrag:      '#ff9500',
  Show:         '#ff3b30',
  Bilderflut:   '#5856d6',
  Ausstellung:  '#00c7be',
  Veranstaltung:'#8e8e93',
  Festival:     '#c9953a',
}

const DEFAULT_PERSONS = [
  { key:'H', name:'Holger', color:'#ff6b35' },
  { key:'D', name:'David',  color:'#007aff' },
  { key:'I', name:'Ilayda', color:'#ff3b30' },
]

function isPast(date, time) {
  return new Date(`${date}T${time}:00`) < new Date()
}

function mapsUrl(location) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
}

function hasBriefingData(b) {
  if (!b) return false
  return !!(b.notes || b.deadline || Object.values(b.tasks || {}).some(t => t))
}

export default function App() {
  const [events, setEvents]             = useState([])
  const [persons, setPersons]           = useState(DEFAULT_PERSONS)
  const [loading, setLoading]           = useState(true)
  const [seeded, setSeeded]             = useState(false)
  const [now, setNow]                   = useState(new Date())
  const [editModal, setEditModal]       = useState(null)
  const [teamModal, setTeamModal]       = useState(null)
  const [personsModal, setPersonsModal] = useState(false)
  const [briefingModal, setBriefingModal] = useState(null)
  const [exportMenu, setExportMenu]     = useState(null)
  const [profiles, setProfiles]         = useState({})
  const [profileView, setProfileView]   = useState(null) // person key
  const [profileEdit, setProfileEdit]   = useState(null) // person key
  const [toast, setToast]               = useState(null)
  const [pushPerson, setPushPerson]     = useState(null)

  // Minute ticker for past-event fading
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  // Toast helper
  const showToast = useCallback((msg, type = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // Seed
  useEffect(() => {
    const seed = async () => {
      const { getDoc } = await import('firebase/firestore')
      const sentinelRef = doc(db, '_meta', 'seeded')
      const sentinel = await getDoc(sentinelRef)
      if (!sentinel.exists()) {
        const { setDoc } = await import('firebase/firestore')
        const batch = writeBatch(db)
        INITIAL_EVENTS.forEach(e => {
          const ref = doc(collection(db, 'events'))
          batch.set(ref, { ...e, team: [], assignments: {}, briefing: {} })
        })
        batch.set(sentinelRef, { at: new Date().toISOString() })
        await batch.commit()
      }
      setSeeded(true)
    }
    seed()
  }, [])

  // Persons listener
  useEffect(() => {
    const unsub = onSnapshot(doc(db, '_meta', 'persons'), snap => {
      if (snap.exists()) setPersons(snap.data().list)
    })
    return unsub
  }, [])

  // Profiles listener
  useEffect(() => {
    const unsub = onSnapshot(doc(db, '_meta', 'profiles'), snap => {
      if (snap.exists()) setProfiles(snap.data())
    })
    return unsub
  }, [])

  // Events listener
  useEffect(() => {
    if (!seeded) return
    const unsub = onSnapshot(collection(db, 'events'), snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      data.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      setEvents(data)
      setLoading(false)
    })
    return unsub
  }, [seeded])

  // CRUD handlers
  const handleSaveEvent = async (formData) => {
    const { id, ...data } = formData
    if (id) await updateDoc(doc(db, 'events', id), data)
    else await addDoc(collection(db, 'events'), { ...data, team: [], assignments: {}, briefing: {} })
    setEditModal(null)
    showToast('Termin gespeichert', 'success')
  }

  const handleDeleteEvent = async (id) => {
    if (!confirm('Termin wirklich löschen?')) return
    await deleteDoc(doc(db, 'events', id))
    setEditModal(null)
    showToast('Termin gelöscht')
  }

  const handleSaveTeam = async ({ assignments, team }) => {
    await updateDoc(doc(db, 'events', teamModal.id), { assignments, team })
    setTeamModal(null)
    showToast('Team gespeichert', 'success')
  }

  const handleSaveBriefing = async (briefingData) => {
    await updateDoc(doc(db, 'events', briefingModal.id), { briefing: briefingData })
    setBriefingModal(null)
    showToast('Briefing gespeichert', 'success')
  }

  const handleSavePersons = async (newPersons) => {
    const { setDoc } = await import('firebase/firestore')
    await setDoc(doc(db, '_meta', 'persons'), { list: newPersons })
    setPersonsModal(false)
    showToast('Team aktualisiert', 'success')
  }

  // Push notification setup
  const handleEnablePush = async (personKey) => {
    if (!('Notification' in window)) {
      showToast('Dein Browser unterstützt keine Push-Benachrichtigungen')
      return
    }
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        showToast('Benachrichtigungen wurden abgelehnt')
        return
      }
      const { getMessaging, getToken } = await import('firebase/messaging')
      const messaging = getMessaging()
      // Note: VAPID key needs to be set in Firebase Console → Project Settings → Cloud Messaging
      // Then replace the placeholder below
      const token = await getToken(messaging, {
        vapidKey: 'BK5p8Q_REPLACE_WITH_VAPID_KEY_FROM_FIREBASE_CONSOLE'
      })
      if (token) {
        const { setDoc, getDoc } = await import('firebase/firestore')
        const ref = doc(db, '_meta', 'pushTokens')
        const snap = await getDoc(ref)
        const existing = snap.exists() ? snap.data() : {}
        await setDoc(ref, { ...existing, [personKey]: token })
        showToast('Push-Benachrichtigungen aktiviert ✓', 'success')
        setPushPerson(personKey)
      }
    } catch (err) {
      console.error(err)
      showToast('Fehler beim Aktivieren der Benachrichtigungen')
    }
  }

  const handleSaveProfile = async (personKey, profileData) => {
    const { setDoc } = await import('firebase/firestore')
    await setDoc(doc(db, '_meta', 'profiles'), { ...profiles, [personKey]: profileData })
    setProfileEdit(null)
    setProfileView(null)
    showToast('Profil gespeichert', 'success')
  }

  const days = [...new Set(events.map(e => e.date))]
  const counts = {}
  persons.forEach(p => { counts[p.key] = 0 })
  events.forEach(e => (e.team||[]).forEach(p => { if (counts[p] !== undefined) counts[p]++ }))
  const totalBriefings = events.filter(e => hasBriefingData(e.briefing)).length

  return (
    <PinLock>
      <div style={{ minHeight:'100vh', background:'#f2f2f7', paddingBottom:100 }}>

        {/* ── HEADER ── */}
        <div style={{
          background:'#ffffff',
          paddingTop:'env(safe-area-inset-top, 0px)',
          borderBottom:'1px solid #e5e5ea',
          position:'sticky', top:0, zIndex:200,
          boxShadow:'0 1px 12px rgba(0,0,0,0.06)'
        }}>
          <div style={{ maxWidth:680, margin:'0 auto', padding:'16px 20px 0' }}>

            {/* Title row */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div>
                <div style={{ fontSize:11, color:'#8e8e93', letterSpacing:0.3, marginBottom:2 }}>
                  29. Mai – 7. Juni 2026
                </div>
                <div style={{ fontSize:26, fontWeight:800, color:'#1c1c1e', letterSpacing:-0.8, lineHeight:1 }}>
                  Horizonte Zingst
                </div>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <button
                  onClick={() => setPersonsModal(true)}
                  style={{ width:38, height:38, borderRadius:19, background:'#f2f2f7', border:'1px solid #e5e5ea', fontSize:17, display:'flex', alignItems:'center', justifyContent:'center' }}
                  title="Team verwalten"
                >👥</button>
                <button
                  onClick={() => setEditModal('new')}
                  style={{ width:38, height:38, borderRadius:19, background:'#c9953a', border:'none', color:'white', fontSize:24, fontWeight:300, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 10px rgba(201,149,58,0.4)' }}
                >+</button>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
              <div style={{ fontSize:12, color:'#8e8e93', background:'#f2f2f7', padding:'4px 10px', borderRadius:8, border:'1px solid #e5e5ea' }}>
                {events.length} Termine
              </div>
              {totalBriefings > 0 && (
                <div style={{ fontSize:12, color:'#34c759', background:'#34c75910', padding:'4px 10px', borderRadius:8, border:'1px solid #34c75930' }}>
                  {totalBriefings} Briefings
                </div>
              )}
            </div>

            {/* Team strip — tappable for profile */}
            <div className="scroll-x" style={{ paddingBottom:14, gap:8 }}>
              {persons.map(p => (
                <button key={p.key}
                  onClick={() => setProfileView(p.key)}
                  style={{
                    display:'flex', alignItems:'center', gap:7,
                    padding:'7px 14px', borderRadius:20,
                    background:`${p.color}12`,
                    border:`1.5px solid ${p.color}35`,
                    whiteSpace:'nowrap', flexShrink:0,
                    cursor:'pointer'
                  }}>
                  {profiles[p.key]?.photo
                    ? <img src={profiles[p.key].photo} alt="" style={{ width:20, height:20, borderRadius:10, objectFit:'cover' }} />
                    : <div style={{ width:9, height:9, borderRadius:'50%', background:p.color }} />
                  }
                  <span style={{ fontSize:13, fontWeight:700, color:p.color }}>{p.name}</span>
                  <span style={{ fontSize:12, color:'#8e8e93', fontWeight:500 }}>{counts[p.key] || 0}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── EVENTS ── */}
        <main style={{ maxWidth:680, margin:'0 auto', padding:'20px 16px' }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:80, color:'#8e8e93' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>⏳</div>
              <div style={{ fontSize:16 }}>Wird geladen…</div>
            </div>
          ) : days.map(date => {
            const dayEvs = events.filter(e => e.date === date)
            if (!dayEvs.length) return null
            const [dn, dd] = DAY_LABELS[date] || [date, date]
            const allPast = dayEvs.every(e => isPast(e.date, e.time))

            return (
              <div key={date} className="fade-in" style={{ marginBottom:28 }}>

                {/* Day header */}
                <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:10, paddingLeft:4 }}>
                  <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
                    <span style={{ fontSize:20, fontWeight:800, color: allPast ? '#c7c7cc' : '#1c1c1e', letterSpacing:-0.3 }}>{dn}</span>
                    <span style={{ fontSize:13, color:'#8e8e93' }}>{dd}</span>
                  </div>
                  <span style={{ fontSize:12, color:'#8e8e93', background:'#f2f2f7', padding:'3px 9px', borderRadius:8, border:'1px solid #e5e5ea' }}>
                    {dayEvs.length}
                  </span>
                </div>

                {/* Cards container */}
                <div style={{ background:'#ffffff', borderRadius:18, overflow:'hidden', boxShadow:'0 2px 16px rgba(0,0,0,0.07)', border:'1px solid rgba(0,0,0,0.04)' }}>
                  {dayEvs.map((e, idx) => {
                    const team = e.team || []
                    const assignments = e.assignments || {}
                    const catColor = CAT_COLORS[e.cat] || '#8e8e93'
                    const hasTeam = team.length > 0
                    const hasBriefing = hasBriefingData(e.briefing)
                    const isLast = idx === dayEvs.length - 1
                    const past = isPast(e.date, e.time)

                    return (
                      <div key={e.id} style={{ opacity: past ? 0.42 : 1, transition:'opacity 0.4s' }}>
                        <div style={{ padding:'14px 16px' }}>

                          {/* Card layout: big time left, content right */}
                          <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>

                            {/* Time block */}
                            <div style={{
                              flexShrink:0, minWidth:72, width:72,
                              display:'flex', alignItems:'flex-start',
                              paddingTop:2
                            }}>
                              <span style={{
                                fontSize:'clamp(20px, 4vw, 24px)', fontWeight:800, lineHeight:1,
                                color: past ? '#c7c7cc' : catColor,
                                letterSpacing:-0.5, fontVariantNumeric:'tabular-nums',
                                whiteSpace:'nowrap'
                              }}>{e.time}</span>
                            </div>

                            {/* Content block */}
                            <div style={{ flex:1, minWidth:0 }}>

                              {/* Cat + badges row */}
                              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6, flexWrap:'wrap' }}>
                                <span style={{
                                  fontSize:10, fontWeight:700, letterSpacing:0.8,
                                  textTransform:'uppercase', color:catColor,
                                  background:`${catColor}12`, padding:'3px 8px',
                                  borderRadius:6, border:`1px solid ${catColor}25`
                                }}>{e.cat}</span>
                                {past && <span style={{ fontSize:10, color:'#8e8e93', background:'#f2f2f7', padding:'2px 7px', borderRadius:6 }}>Vergangen</span>}
                                {hasBriefing && <span style={{ fontSize:10, color:'#34c759', background:'#34c75912', padding:'2px 7px', borderRadius:6, border:'1px solid #34c75930' }}>📋</span>}
                                {hasTeam && (
                                  <div style={{ marginLeft:'auto', display:'flex' }}>
                                    {persons.filter(p => team.includes(p.key)).map((p, i) => (
                                      <div key={p.key} style={{ width:20, height:20, borderRadius:10, background:p.color, border:'2px solid white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:800, color:'white', marginLeft: i > 0 ? -5 : 0 }}>{p.key}</div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Title */}
                              <div
                                onClick={() => setEditModal(e)}
                                style={{ fontSize:15, fontWeight:600, color: past ? '#8e8e93' : '#1c1c1e', lineHeight:1.4, cursor:'pointer', marginBottom: e.location ? 5 : 0 }}
                              >{e.title}</div>

                              {/* Location → Maps link */}
                              {e.location && (
                                <a href={mapsUrl(e.location)} target="_blank" rel="noopener noreferrer"
                                  style={{ fontSize:13, color:'#007aff', display:'inline-flex', alignItems:'center', gap:4, textDecoration:'none', marginBottom:2 }}
                                  onClick={ev => ev.stopPropagation()}
                                >
                                  <span>📍</span>
                                  <span style={{ borderBottom:'1px solid rgba(0,122,255,0.25)' }}>{e.location}</span>
                                </a>
                              )}

                            </div>{/* end content block */}
                          </div>{/* end card layout */}

                          {/* Team badges */}
                          {hasTeam && (
                            <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap' }}>
                              {persons.filter(p => team.includes(p.key)).map(p => {
                                const roles = assignments[p.key] || []
                                return (
                                  <div key={p.key} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:20, background:`${p.color}10`, border:`1px solid ${p.color}28` }}>
                                    <div style={{ width:6, height:6, borderRadius:3, background:p.color, flexShrink:0 }} />
                                    <span style={{ fontSize:13, fontWeight:700, color:p.color }}>{p.name}</span>
                                    {roles.length > 0 && <span style={{ fontSize:12, color:'#8e8e93' }}>{roles.join(', ')}</span>}
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {/* Action buttons */}
                          <div style={{ display:'flex', gap:8, marginTop:12 }}>
                            <button onClick={() => setTeamModal(e)} style={{ flex:1, padding:'9px 0', borderRadius:10, background: hasTeam ? `${catColor}10` : '#f2f2f7', border:`1px solid ${hasTeam ? catColor+'30' : '#e5e5ea'}`, color: hasTeam ? catColor : '#8e8e93', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                              <span>👥</span><span>Team</span>
                            </button>
                            <button onClick={() => setBriefingModal(e)} style={{ flex:1, padding:'9px 0', borderRadius:10, background: hasBriefing ? '#34c75910' : '#f2f2f7', border:`1px solid ${hasBriefing ? '#34c75930' : '#e5e5ea'}`, color: hasBriefing ? '#34c759' : '#8e8e93', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                              <span>📋</span><span>Briefing</span>
                            </button>
                            <div style={{ position:'relative' }}>
                              <button onClick={() => setExportMenu(exportMenu===e.id ? null : e.id)} style={{ padding:'9px 13px', borderRadius:10, background:'#f2f2f7', border:'1px solid #e5e5ea', color:'#8e8e93', fontSize:14 }}>📅</button>
                              {exportMenu === e.id && (
                                <div style={{ position:'absolute', bottom:'110%', right:0, zIndex:300, background:'#ffffff', borderRadius:14, boxShadow:'0 8px 30px rgba(0,0,0,0.15)', overflow:'hidden', minWidth:200, border:'1px solid #e5e5ea' }}>
                                  {[
                                    { icon:'🗓', label:'Google Calendar', action: () => window.open(googleCalendarUrl(e), '_blank') },
                                    { icon:'📧', label:'Outlook Web',     action: () => window.open(outlookCalendarUrl(e), '_blank') },
                                    { icon:'⬇️', label:'ICS Download',    action: () => downloadIcs(e) },
                                  ].map((opt, i, arr) => (
                                    <button key={opt.label} onClick={(ev) => { ev.stopPropagation(); opt.action(); setExportMenu(null) }}
                                      style={{ display:'flex', alignItems:'center', gap:12, width:'100%', background:'transparent', border:'none', borderBottom: i < arr.length-1 ? '1px solid #f2f2f7' : 'none', color:'#1c1c1e', padding:'13px 16px', fontSize:14, cursor:'pointer' }}
                                      onMouseEnter={ev => ev.currentTarget.style.background='#f9f9f9'}
                                      onMouseLeave={ev => ev.currentTarget.style.background='transparent'}
                                    ><span>{opt.icon}</span><span>{opt.label}</span></button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {!isLast && <div style={{ height:1, background:'#f7f7f7', marginLeft:16 }} />}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </main>

        {/* ── TAB BAR ── */}
        <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'rgba(255,255,255,0.94)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderTop:'1px solid #e5e5ea', paddingBottom:'env(safe-area-inset-bottom, 0px)' }}>
          <div style={{ maxWidth:680, margin:'0 auto', padding:'10px 24px 12px', display:'flex', justifyContent:'space-around', alignItems:'center' }}>
            {persons.map(p => (
              <button key={p.key}
                onClick={() => handleEnablePush(p.key)}
                title={`Push für ${p.name} aktivieren`}
                style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, background:'transparent', border:'none', padding:'4px 8px', borderRadius:12, cursor:'pointer', minWidth:64 }}
              >
                <div style={{ width:40, height:40, borderRadius:20, background:`${p.color}15`, border:`2px solid ${p.color}35`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, fontWeight:800, color:p.color, position:'relative' }}>
                  {counts[p.key] || 0}
                  {pushPerson === p.key && (
                    <div style={{ position:'absolute', top:-2, right:-2, width:10, height:10, borderRadius:5, background:'#34c759', border:'2px solid white' }} />
                  )}
                </div>
                <span style={{ fontSize:11, color:'#8e8e93', fontWeight:600 }}>{p.name}</span>
              </button>
            ))}
            <div style={{ width:1, height:36, background:'#e5e5ea' }} />
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, minWidth:48 }}>
              <div style={{ fontSize:17, fontWeight:800, color:'#8e8e93' }}>{events.length}</div>
              <span style={{ fontSize:11, color:'#8e8e93', fontWeight:600 }}>Termine</span>
            </div>
          </div>
        </div>

        {/* ── TOAST ── */}
        {toast && (
          <div style={{
            position:'fixed', top:'env(safe-area-inset-top, 20px)', left:'50%',
            transform:'translateX(-50%)', zIndex:999,
            background: toast.type === 'success' ? '#34c759' : '#1c1c1e',
            color:'white', padding:'10px 20px', borderRadius:20,
            fontSize:14, fontWeight:600, boxShadow:'0 4px 20px rgba(0,0,0,0.2)',
            whiteSpace:'nowrap', animation:'fadeIn 0.2s ease'
          }}>{toast.msg}</div>
        )}

        {/* ── MODALS ── */}
        {editModal    && <EventModal    event={editModal==='new' ? null : editModal} onSave={handleSaveEvent} onDelete={handleDeleteEvent} onClose={() => setEditModal(null)} />}
        {teamModal    && <TeamModal     event={teamModal}    persons={persons} onSave={handleSaveTeam}     onClose={() => setTeamModal(null)} />}
        {briefingModal && <BriefingModal event={briefingModal} persons={persons} onSave={handleSaveBriefing} onClose={() => setBriefingModal(null)} />}
        {personsModal && <PersonsModal  persons={persons}    onSave={handleSavePersons}  onClose={() => setPersonsModal(false)} />}
        {exportMenu   && <div style={{ position:'fixed', inset:0, zIndex:50 }} onClick={() => setExportMenu(null)} />}
      {profileView && (() => { const p = persons.find(x => x.key === profileView); return p ? <ProfileView person={p} profile={profiles[p.key]} onEdit={() => { setProfileView(null); setProfileEdit(p.key) }} onClose={() => setProfileView(null)} /> : null })()}
      {profileEdit && (() => { const p = persons.find(x => x.key === profileEdit); return p ? <ProfileModal person={p} profile={profiles[p.key]} onSave={(data) => handleSaveProfile(p.key, data)} onClose={() => setProfileEdit(null)} /> : null })()}
      </div>
    </PinLock>
  )
}
