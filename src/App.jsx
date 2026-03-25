import { useState, useEffect } from 'react'
import { db } from './firebase.js'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore'
import { INITIAL_EVENTS, CATEGORIES, DAY_LABELS } from './events.js'
import EventModal from './components/EventModal.jsx'
import TeamModal from './components/TeamModal.jsx'
import PersonsModal from './components/PersonsModal.jsx'
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
  { key:'I', name:'Ilayda', color:'#af52de' },
]

export default function App() {
  const [events, setEvents]           = useState([])
  const [persons, setPersons]         = useState(DEFAULT_PERSONS)
  const [loading, setLoading]         = useState(true)
  const [seeded, setSeeded]           = useState(false)
  const [editModal, setEditModal]     = useState(null)
  const [teamModal, setTeamModal]     = useState(null)
  const [personsModal, setPersonsModal] = useState(false)
  const [exportMenu, setExportMenu]   = useState(null)

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
          batch.set(ref, { ...e, team: [], assignments: {} })
        })
        batch.set(sentinelRef, { at: new Date().toISOString() })
        await batch.commit()
      }
      setSeeded(true)
    }
    seed()
  }, [])

  // Load persons from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, '_meta', 'persons'), snap => {
      if (snap.exists()) setPersons(snap.data().list)
    })
    return unsub
  }, [])

  // Load events
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
    else await addDoc(collection(db, 'events'), { ...data, team: [], assignments: {} })
    setEditModal(null)
  }

  const handleDeleteEvent = async (id) => {
    if (!confirm('Termin wirklich löschen?')) return
    await deleteDoc(doc(db, 'events', id))
    setEditModal(null)
  }

  const handleSaveTeam = async ({ assignments, team }) => {
    await updateDoc(doc(db, 'events', teamModal.id), { assignments, team })
    setTeamModal(null)
  }

  const handleSavePersons = async (newPersons) => {
    const { setDoc } = await import('firebase/firestore')
    await setDoc(doc(db, '_meta', 'persons'), { list: newPersons })
    setPersonsModal(false)
  }

  const days = [...new Set(events.map(e => e.date))]
  const counts = {}
  persons.forEach(p => { counts[p.key] = 0 })
  events.forEach(e => (e.team||[]).forEach(p => { if (counts[p] !== undefined) counts[p]++ }))

  return (
    <div style={{ minHeight:'100vh', background:'#f2f2f7', paddingBottom:90 }}>

      {/* ── HEADER ── */}
      <div style={{
        background:'#ffffff',
        padding:'calc(env(safe-area-inset-top, 0px) + 16px) 20px 0',
        borderBottom:'1px solid #d1d1d6',
        position:'sticky', top:0, zIndex:200,
        boxShadow:'0 1px 0 rgba(0,0,0,0.08)'
      }}>
        <div style={{ maxWidth:680, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div>
              <div style={{ fontSize:12, color:'#8e8e93', letterSpacing:0.5, marginBottom:2 }}>
                29. Mai — 7. Juni 2026
              </div>
              <div style={{ fontSize:24, fontWeight:700, color:'#1c1c1e', letterSpacing:-0.5 }}>
                Horizonte Zingst
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button
                onClick={() => setPersonsModal(true)}
                style={{
                  width:36, height:36, borderRadius:18,
                  background:'#f2f2f7', border:'none',
                  fontSize:18, display:'flex', alignItems:'center', justifyContent:'center'
                }}
                title="Team verwalten"
              >👥</button>
              <button
                onClick={() => setEditModal('new')}
                style={{
                  width:36, height:36, borderRadius:18,
                  background:'#c9953a', border:'none',
                  color:'white', fontSize:22, fontWeight:300,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 2px 8px rgba(201,149,58,0.4)'
                }}
              >+</button>
            </div>
          </div>

          {/* Team strip */}
          <div className="scroll-x" style={{ paddingBottom:14 }}>
            {persons.map(p => (
              <div key={p.key} style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'6px 14px', borderRadius:20,
                background:`${p.color}18`,
                border:`1.5px solid ${p.color}40`,
                whiteSpace:'nowrap', flexShrink:0
              }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:p.color }} />
                <span style={{ fontSize:13, fontWeight:600, color:p.color }}>{p.name}</span>
                <span style={{ fontSize:12, color:'#8e8e93' }}>{counts[p.key] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── EVENTS ── */}
      <main style={{ maxWidth:680, margin:'0 auto', padding:'20px 16px' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:80, color:'#8e8e93', fontSize:16 }}>
            Wird geladen…
          </div>
        ) : days.map(date => {
          const dayEvs = events.filter(e => e.date === date)
          if (!dayEvs.length) return null
          const [dn, dd] = DAY_LABELS[date] || [date, date]
          return (
            <div key={date} className="fade-in" style={{ marginBottom:28 }}>

              {/* Day header */}
              <div style={{
                display:'flex', alignItems:'baseline', gap:8,
                marginBottom:10, paddingLeft:4
              }}>
                <span style={{ fontSize:20, fontWeight:700, color:'#1c1c1e' }}>{dn}</span>
                <span style={{ fontSize:14, color:'#8e8e93', fontWeight:400 }}>{dd}</span>
              </div>

              {/* Cards */}
              <div style={{
                background:'#ffffff',
                borderRadius:16,
                overflow:'hidden',
                boxShadow:'0 2px 12px rgba(0,0,0,0.07)'
              }}>
                {dayEvs.map((e, idx) => {
                  const team = e.team || []
                  const assignments = e.assignments || {}
                  const catColor = CAT_COLORS[e.cat] || '#8e8e93'
                  const hasTeam = team.length > 0
                  const isLast = idx === dayEvs.length - 1

                  return (
                    <div key={e.id}>
                      <div style={{ padding:'14px 16px' }}>

                        {/* Time + Cat */}
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                          <span style={{ fontSize:13, fontWeight:600, color:catColor }}>{e.time}</span>
                          <span style={{
                            fontSize:11, fontWeight:600, letterSpacing:0.5,
                            textTransform:'uppercase', color:catColor,
                            background:`${catColor}15`,
                            padding:'2px 8px', borderRadius:6
                          }}>{e.cat}</span>
                          {hasTeam && (
                            <div style={{ marginLeft:'auto', display:'flex', gap:-4 }}>
                              {persons.filter(p => team.includes(p.key)).map(p => (
                                <div key={p.key} style={{
                                  width:22, height:22, borderRadius:11,
                                  background:p.color,
                                  border:'2px solid white',
                                  display:'flex', alignItems:'center', justifyContent:'center',
                                  fontSize:10, fontWeight:700, color:'white',
                                  marginLeft:-4
                                }}>{p.key}</div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Title */}
                        <div
                          onClick={() => setEditModal(e)}
                          style={{
                            fontSize:16, fontWeight:500, color:'#1c1c1e',
                            lineHeight:1.4, cursor:'pointer', marginBottom: e.location ? 4 : 0
                          }}
                        >{e.title}</div>

                        {/* Location */}
                        {e.location && (
                          <div style={{ fontSize:13, color:'#8e8e93', display:'flex', alignItems:'center', gap:4 }}>
                            <span>📍</span>{e.location}
                          </div>
                        )}

                        {/* Team detail */}
                        {hasTeam && (
                          <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap' }}>
                            {persons.filter(p => team.includes(p.key)).map(p => {
                              const roles = assignments[p.key] || []
                              return (
                                <div key={p.key} style={{
                                  display:'flex', alignItems:'center', gap:5,
                                  padding:'4px 10px', borderRadius:8,
                                  background:`${p.color}12`,
                                  border:`1px solid ${p.color}30`
                                }}>
                                  <div style={{ width:6, height:6, borderRadius:3, background:p.color }} />
                                  <span style={{ fontSize:13, fontWeight:600, color:p.color }}>{p.name}</span>
                                  {roles.length > 0 && (
                                    <span style={{ fontSize:12, color:'#8e8e93' }}>{roles.join(', ')}</span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Actions */}
                        <div style={{ display:'flex', gap:8, marginTop:12 }}>
                          <button
                            onClick={() => setTeamModal(e)}
                            style={{
                              flex:1, padding:'9px 0', borderRadius:10,
                              background: hasTeam ? `${catColor}12` : '#f2f2f7',
                              border:`1px solid ${hasTeam ? catColor+'40' : '#e5e5ea'}`,
                              color: hasTeam ? catColor : '#8e8e93',
                              fontSize:13, fontWeight:600,
                              display:'flex', alignItems:'center', justifyContent:'center', gap:5
                            }}
                          >
                            <span>👥</span>
                            <span>{hasTeam ? 'Team ändern' : 'Team zuweisen'}</span>
                          </button>

                          <div style={{ position:'relative' }}>
                            <button
                              onClick={() => setExportMenu(exportMenu===e.id ? null : e.id)}
                              style={{
                                padding:'9px 14px', borderRadius:10,
                                background:'#f2f2f7', border:'1px solid #e5e5ea',
                                color:'#8e8e93', fontSize:13, fontWeight:600,
                                display:'flex', alignItems:'center', gap:5
                              }}
                            >📅</button>
                            {exportMenu === e.id && (
                              <div style={{
                                position:'absolute', bottom:'110%', right:0, zIndex:300,
                                background:'#ffffff', borderRadius:14,
                                boxShadow:'0 8px 30px rgba(0,0,0,0.15)',
                                overflow:'hidden', minWidth:200,
                                border:'1px solid #e5e5ea'
                              }}>
                                {[
                                  { icon:'🗓', label:'Google Calendar', action: () => window.open(googleCalendarUrl(e), '_blank') },
                                  { icon:'📧', label:'Outlook Web',     action: () => window.open(outlookCalendarUrl(e), '_blank') },
                                  { icon:'⬇️', label:'ICS herunterladen', action: () => downloadIcs(e) },
                                ].map((opt, i, arr) => (
                                  <button key={opt.label}
                                    onClick={() => { opt.action(); setExportMenu(null) }}
                                    style={{
                                      display:'flex', alignItems:'center', gap:12,
                                      width:'100%', background:'transparent', border:'none',
                                      borderBottom: i < arr.length-1 ? '1px solid #f2f2f7' : 'none',
                                      color:'#1c1c1e', padding:'13px 16px',
                                      fontSize:14, cursor:'pointer', textAlign:'left'
                                    }}
                                  ><span>{opt.icon}</span><span>{opt.label}</span></button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {!isLast && (
                        <div style={{ height:1, background:'#f2f2f7', marginLeft:16 }} />
                      )}
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
        background:'rgba(255,255,255,0.92)',
        backdropFilter:'blur(20px)',
        WebkitBackdropFilter:'blur(20px)',
        borderTop:'1px solid #d1d1d6',
        padding:'10px 20px',
        paddingBottom:'calc(10px + env(safe-area-inset-bottom, 0px))',
        display:'flex', justifyContent:'space-around', alignItems:'center'
      }}>
        {persons.map(p => (
          <div key={p.key} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, minWidth:60 }}>
            <div style={{
              width:36, height:36, borderRadius:18,
              background:`${p.color}18`,
              border:`2px solid ${p.color}40`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:16, fontWeight:700, color:p.color
            }}>{counts[p.key] || 0}</div>
            <span style={{ fontSize:11, color:'#8e8e93', fontWeight:500 }}>{p.name}</span>
          </div>
        ))}
      </div>

      {/* ── MODALS ── */}
      {editModal && <EventModal event={editModal==='new' ? null : editModal} onSave={handleSaveEvent} onDelete={handleDeleteEvent} onClose={() => setEditModal(null)} />}
      {teamModal && <TeamModal event={teamModal} persons={persons} onSave={handleSaveTeam} onClose={() => setTeamModal(null)} />}
      {personsModal && <PersonsModal persons={persons} onSave={handleSavePersons} onClose={() => setPersonsModal(false)} />}
      {exportMenu && <div style={{ position:'fixed', inset:0, zIndex:50 }} onClick={() => setExportMenu(null)} />}
    </div>
  )
}
