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
import { requestPushPermission } from './push.js'

const CAT_COLORS = {
  MVS:          '#007aff',
  Talk:         '#c9953a',
  Seminar:      '#34c759',
  Vernissage:   '#af52de',
  Vortrag:      '#ff9500',
  Show:         '#ff3b30',
  Bilderflut:   '#5856d6',
  Ausstellung:  '#00c7be',
  Veranstaltung:'#888888',
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
  const [events, setEvents]               = useState([])
  const [persons, setPersons]             = useState(DEFAULT_PERSONS)
  const [loading, setLoading]             = useState(true)
  const [seeded, setSeeded]               = useState(false)
  const [now, setNow]                     = useState(new Date())
  const [editModal, setEditModal]         = useState(null)
  const [teamModal, setTeamModal]         = useState(null)
  const [personsModal, setPersonsModal]   = useState(false)
  const [briefingModal, setBriefingModal] = useState(null)
  const [exportMenu, setExportMenu]       = useState(null)
  const [profiles, setProfiles]           = useState({})
  const [profileView, setProfileView]     = useState(null)
  const [profileEdit, setProfileEdit]     = useState(null)
  const [toast, setToast]                 = useState(null)
  const [pushPerson, setPushPerson]       = useState(null)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const showToast = useCallback((msg, type = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

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

  useEffect(() => {
    const unsub = onSnapshot(doc(db, '_meta', 'persons'), snap => {
      if (snap.exists()) setPersons(snap.data().list)
    })
    return unsub
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(doc(db, '_meta', 'profiles'), snap => {
      if (snap.exists()) setProfiles(snap.data())
    })
    return unsub
  }, [])

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

  const handleEnablePush = async (personKey) => {
    if (!('Notification' in window)) {
      showToast('Dein Browser unterstützt keine Push-Benachrichtigungen')
      return
    }
    const ok = await requestPushPermission(personKey)
    if (ok) {
      showToast('Push-Benachrichtigungen aktiviert ✓', 'success')
      setPushPerson(personKey)
    } else {
      showToast('Benachrichtigungen wurden abgelehnt')
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
      <div style={{ minHeight:'100vh', background:'#f0efe9', paddingBottom:90 }}>

        {/* ── HEADER ── */}
        <div style={{
          background:'#111111',
          paddingTop:'env(safe-area-inset-top, 0px)',
          position:'sticky', top:0, zIndex:200,
        }}>
          <div style={{ maxWidth:680, margin:'0 auto', padding:'20px 20px 0' }}>

            {/* Title row */}
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
              <div>
                <div style={{ fontSize:11, color:'#c9953a', letterSpacing:1.5, fontWeight:600, textTransform:'uppercase', marginBottom:4 }}>
                  29. Mai – 7. Juni 2026
                </div>
                <div style={{ fontSize:28, fontWeight:800, color:'#ffffff', letterSpacing:-1, lineHeight:1 }}>
                  Horizonte Zingst
                </div>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center', paddingTop:2 }}>
                <button
                  onClick={() => setPersonsModal(true)}
                  style={{ width:36, height:36, borderRadius:18, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}
                  title="Team verwalten"
                >👥</button>
                <button
                  onClick={() => setEditModal('new')}
                  style={{ width:36, height:36, borderRadius:18, background:'#c9953a', border:'none', color:'white', fontSize:22, fontWeight:300, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 12px rgba(201,149,58,0.5)' }}
                >+</button>
              </div>
            </div>

            {/* Stats */}
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', fontWeight:500, marginBottom:0 }}>
              {events.length} Termine
              {totalBriefings > 0 && <span style={{ color:'#c9953a', marginLeft:10 }}>· {totalBriefings} Briefings</span>}
            </div>

            {/* Team strip */}
            <div className="scroll-x" style={{ padding:'14px 0 16px', gap:8 }}>
              {persons.map(p => (
                <button key={p.key}
                  onClick={() => setProfileView(p.key)}
                  style={{
                    display:'flex', alignItems:'center', gap:8,
                    padding:'7px 14px 7px 10px', borderRadius:24,
                    background:'rgba(255,255,255,0.07)',
                    border:'1px solid rgba(255,255,255,0.12)',
                    whiteSpace:'nowrap', flexShrink:0, cursor:'pointer'
                  }}>
                  {profiles[p.key]?.photo
                    ? <img src={profiles[p.key].photo} alt="" style={{ width:22, height:22, borderRadius:11, objectFit:'cover', border:'1.5px solid rgba(255,255,255,0.2)' }} />
                    : <div style={{ width:22, height:22, borderRadius:11, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.5)' }}>{p.key}</div>
                  }
                  <span style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.8)' }}>{p.name}</span>
                  <span style={{ fontSize:12, color:'#c9953a', fontWeight:700 }}>{counts[p.key] || 0}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── EVENTS ── */}
        <main style={{ maxWidth:680, margin:'0 auto', padding:'20px 14px' }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:80, color:'#999' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
              <div style={{ fontSize:15, letterSpacing:0.3 }}>Wird geladen…</div>
            </div>
          ) : days.map(date => {
            const dayEvs = events.filter(e => e.date === date)
            if (!dayEvs.length) return null
            const [dn, dd] = DAY_LABELS[date] || [date, date]
            const allPast = dayEvs.every(e => isPast(e.date, e.time))

            return (
              <div key={date} className="fade-in" style={{ marginBottom:32 }}>

                {/* Day header */}
                <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:10, paddingLeft:2 }}>
                  <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
                    <span style={{ fontSize:22, fontWeight:800, color: allPast ? '#bbbbaa' : '#111111', letterSpacing:-0.5 }}>{dn}</span>
                    <span style={{ fontSize:13, color:'#999999' }}>{dd}</span>
                  </div>
                  <span style={{ fontSize:11, color:'#999', background:'rgba(0,0,0,0.05)', padding:'2px 9px', borderRadius:6, fontWeight:600 }}>
                    {dayEvs.length}
                  </span>
                </div>

                {/* Individual cards */}
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {dayEvs.map(e => {
                    const team        = e.team || []
                    const assignments = e.assignments || {}
                    const catColor    = CAT_COLORS[e.cat] || '#888'
                    const hasTeam     = team.length > 0
                    const hasBriefing = hasBriefingData(e.briefing)
                    const past        = isPast(e.date, e.time)

                    return (
                      <div key={e.id} style={{
                        background:'#ffffff',
                        borderRadius:14,
                        boxShadow:'0 2px 12px rgba(0,0,0,0.07)',
                        borderLeft:`3px solid ${past ? '#ddddd8' : catColor}`,
                        opacity: past ? 0.5 : 1,
                        transition:'opacity 0.4s'
                      }}>
                        <div style={{ padding:'14px 16px' }}>

                          {/* Time + category + team dots */}
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                            <span style={{
                              fontSize:22, fontWeight:800, lineHeight:1,
                              color: past ? '#cccccc' : '#111111',
                              letterSpacing:-0.5, fontVariantNumeric:'tabular-nums',
                              minWidth:56
                            }}>{e.time}</span>
                            <span style={{
                              fontSize:10, fontWeight:700, letterSpacing:1.2,
                              textTransform:'uppercase', color:'#999999',
                              background:'#f2f2ee', padding:'3px 8px', borderRadius:5,
                            }}>{e.cat}</span>
                            {hasBriefing && (
                              <span style={{ fontSize:10, color:'#c9953a', background:'rgba(201,149,58,0.1)', padding:'3px 7px', borderRadius:5, fontWeight:700, letterSpacing:0.5 }}>BRIEF</span>
                            )}
                            {hasTeam && (
                              <div style={{ marginLeft:'auto', display:'flex' }}>
                                {persons.filter(p => team.includes(p.key)).map((p, i) => (
                                  <div key={p.key} style={{
                                    width:22, height:22, borderRadius:11,
                                    background:'#111111',
                                    border:'2px solid #ffffff',
                                    display:'flex', alignItems:'center', justifyContent:'center',
                                    fontSize:9, fontWeight:800, color:'white',
                                    marginLeft: i > 0 ? -6 : 0
                                  }}>{p.key}</div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Title */}
                          <div
                            onClick={() => setEditModal(e)}
                            style={{ fontSize:15, fontWeight:700, color: past ? '#aaaaaa' : '#111111', lineHeight:1.4, cursor:'pointer', marginBottom: e.location ? 6 : 0 }}
                          >{e.title}</div>

                          {/* Location */}
                          {e.location && (
                            <a href={mapsUrl(e.location)} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize:12, color:'#c9953a', display:'inline-flex', alignItems:'center', gap:4, textDecoration:'none', marginBottom:2 }}
                              onClick={ev => ev.stopPropagation()}
                            >
                              <span>📍</span>
                              <span style={{ borderBottom:'1px solid rgba(201,149,58,0.3)' }}>{e.location}</span>
                            </a>
                          )}

                          {/* Team badges */}
                          {hasTeam && (
                            <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap' }}>
                              {persons.filter(p => team.includes(p.key)).map(p => {
                                const roles = assignments[p.key] || []
                                return (
                                  <div key={p.key} style={{
                                    display:'flex', alignItems:'center', gap:5,
                                    padding:'4px 10px', borderRadius:6,
                                    background:'#f5f5f2', border:'1px solid #e8e8e4'
                                  }}>
                                    <div style={{ width:5, height:5, borderRadius:3, background:'#111', flexShrink:0 }} />
                                    <span style={{ fontSize:12, fontWeight:700, color:'#111' }}>{p.name}</span>
                                    {roles.length > 0 && <span style={{ fontSize:11, color:'#999' }}>{roles.join(', ')}</span>}
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {/* Action buttons */}
                          <div style={{ display:'flex', gap:6, marginTop:12 }}>
                            <button onClick={() => setTeamModal(e)} style={{
                              flex:1, padding:'8px 0', borderRadius:8,
                              background: hasTeam ? 'rgba(201,149,58,0.08)' : '#f5f5f2',
                              border: hasTeam ? '1px solid rgba(201,149,58,0.25)' : '1px solid #e8e8e4',
                              color: hasTeam ? '#c9953a' : '#999',
                              fontSize:12, fontWeight:600,
                              display:'flex', alignItems:'center', justifyContent:'center', gap:5
                            }}>
                              <span>👥</span><span>Team</span>
                            </button>
                            <button onClick={() => setBriefingModal(e)} style={{
                              flex:1, padding:'8px 0', borderRadius:8,
                              background: hasBriefing ? 'rgba(201,149,58,0.08)' : '#f5f5f2',
                              border: hasBriefing ? '1px solid rgba(201,149,58,0.25)' : '1px solid #e8e8e4',
                              color: hasBriefing ? '#c9953a' : '#999',
                              fontSize:12, fontWeight:600,
                              display:'flex', alignItems:'center', justifyContent:'center', gap:5
                            }}>
                              <span>📋</span><span>Briefing</span>
                            </button>
                            <div style={{ position:'relative' }}>
                              <button onClick={() => setExportMenu(exportMenu===e.id ? null : e.id)} style={{
                                padding:'8px 12px', borderRadius:8,
                                background:'#f5f5f2', border:'1px solid #e8e8e4',
                                color:'#999', fontSize:13
                              }}>📅</button>
                              {exportMenu === e.id && (
                                <div style={{ position:'absolute', bottom:'110%', right:0, zIndex:300, background:'#ffffff', borderRadius:12, boxShadow:'0 8px 30px rgba(0,0,0,0.15)', overflow:'hidden', minWidth:200, border:'1px solid #e8e8e4' }}>
                                  {[
                                    { icon:'🗓', label:'Google Calendar', action: () => window.open(googleCalendarUrl(e), '_blank') },
                                    { icon:'📧', label:'Outlook Web',     action: () => window.open(outlookCalendarUrl(e), '_blank') },
                                    { icon:'⬇️', label:'ICS Download',    action: () => downloadIcs(e) },
                                  ].map((opt, i, arr) => (
                                    <button key={opt.label} onClick={(ev) => { ev.stopPropagation(); opt.action(); setExportMenu(null) }}
                                      style={{ display:'flex', alignItems:'center', gap:12, width:'100%', background:'transparent', border:'none', borderBottom: i < arr.length-1 ? '1px solid #f2f2f0' : 'none', color:'#111', padding:'12px 16px', fontSize:13, cursor:'pointer' }}
                                      onMouseEnter={ev => ev.currentTarget.style.background='#f9f9f7'}
                                      onMouseLeave={ev => ev.currentTarget.style.background='transparent'}
                                    ><span>{opt.icon}</span><span>{opt.label}</span></button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </main>

        {/* ── TAB BAR ── */}
        <div style={{
          position:'fixed', bottom:0, left:0, right:0,
          background:'#111111',
          paddingBottom:'env(safe-area-inset-bottom, 0px)',
          borderTop:'1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{ maxWidth:680, margin:'0 auto', padding:'10px 24px 12px', display:'flex', justifyContent:'space-around', alignItems:'center' }}>
            {persons.map(p => (
              <div key={p.key} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, minWidth:64 }}>
                <div style={{ position:'relative' }}>
                  <button
                    onClick={() => setProfileView(p.key)}
                    style={{
                      width:40, height:40, borderRadius:20,
                      background:'rgba(255,255,255,0.07)',
                      border:'1.5px solid rgba(255,255,255,0.15)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:16, fontWeight:800, color:'#c9953a', cursor:'pointer'
                    }}
                  >
                    {counts[p.key] || 0}
                  </button>
                  <button
                    onClick={() => handleEnablePush(p.key)}
                    title={`Push für ${p.name} aktivieren`}
                    style={{
                      position:'absolute', top:-3, right:-3,
                      width:15, height:15, borderRadius:8,
                      background: pushPerson === p.key ? '#c9953a' : 'rgba(255,255,255,0.15)',
                      border:'2px solid #111111',
                      fontSize:7, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'
                    }}
                  >🔔</button>
                </div>
                <span style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontWeight:600, letterSpacing:0.3 }}>{p.name}</span>
              </div>
            ))}
            <div style={{ width:1, height:32, background:'rgba(255,255,255,0.1)' }} />
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, minWidth:48 }}>
              <div style={{ fontSize:16, fontWeight:800, color:'rgba(255,255,255,0.4)' }}>{events.length}</div>
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.25)', fontWeight:600, letterSpacing:0.3 }}>Termine</span>
            </div>
          </div>
        </div>

        {/* ── TOAST ── */}
        {toast && (
          <div style={{
            position:'fixed', top:'env(safe-area-inset-top, 20px)', left:'50%',
            transform:'translateX(-50%)', zIndex:999,
            background: toast.type === 'success' ? '#c9953a' : '#111111',
            color:'white', padding:'10px 22px', borderRadius:20,
            fontSize:13, fontWeight:600, boxShadow:'0 4px 20px rgba(0,0,0,0.3)',
            whiteSpace:'nowrap', animation:'fadeIn 0.2s ease', letterSpacing:0.3
          }}>{toast.msg}</div>
        )}

        {/* ── MODALS ── */}
        {editModal     && <EventModal    event={editModal==='new' ? null : editModal} onSave={handleSaveEvent} onDelete={handleDeleteEvent} onClose={() => setEditModal(null)} />}
        {teamModal     && <TeamModal     event={teamModal}     persons={persons} onSave={handleSaveTeam}     onClose={() => setTeamModal(null)} />}
        {briefingModal && <BriefingModal event={briefingModal} persons={persons} onSave={handleSaveBriefing} onClose={() => setBriefingModal(null)} />}
        {personsModal  && <PersonsModal  persons={persons}     onSave={handleSavePersons} onClose={() => setPersonsModal(false)} />}
        {exportMenu    && <div style={{ position:'fixed', inset:0, zIndex:50 }} onClick={() => setExportMenu(null)} />}
        {profileView && (() => { const p = persons.find(x => x.key === profileView); return p ? <ProfileView person={p} profile={profiles[p.key]} onEdit={() => { setProfileView(null); setProfileEdit(p.key) }} onClose={() => setProfileView(null)} /> : null })()}
        {profileEdit && (() => { const p = persons.find(x => x.key === profileEdit); return p ? <ProfileModal person={p} profile={profiles[p.key]} onSave={(data) => handleSaveProfile(p.key, data)} onClose={() => setProfileEdit(null)} /> : null })()}
      </div>
    </PinLock>
  )
}
