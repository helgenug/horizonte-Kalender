import { useState, useEffect } from 'react'
import { db } from './firebase.js'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore'
import { INITIAL_EVENTS, CATEGORIES, DAY_LABELS } from './events.js'
import EventModal from './components/EventModal.jsx'
import TeamModal from './components/TeamModal.jsx'
import { googleCalendarUrl, outlookCalendarUrl, downloadIcs } from './components/calendarExport.js'

const CAT_COLORS = {
  MVS:          { bg:'rgba(61,122,138,0.2)',   color:'#7ecce0', border:'rgba(61,122,138,0.5)' },
  Talk:         { bg:'rgba(201,149,58,0.15)',  color:'#d4a84b', border:'rgba(201,149,58,0.4)' },
  Seminar:      { bg:'rgba(100,160,100,0.15)', color:'#8dc88d', border:'rgba(100,160,100,0.4)' },
  Vernissage:   { bg:'rgba(180,100,150,0.15)', color:'#d4a0c0', border:'rgba(180,100,150,0.4)' },
  Vortrag:      { bg:'rgba(150,130,80,0.18)',  color:'#c8b870', border:'rgba(150,130,80,0.4)' },
  Show:         { bg:'rgba(200,80,60,0.15)',   color:'#e09080', border:'rgba(200,80,60,0.4)' },
  Bilderflut:   { bg:'rgba(80,80,200,0.15)',   color:'#a0a0e8', border:'rgba(80,80,200,0.4)' },
  Ausstellung:  { bg:'rgba(120,160,180,0.15)', color:'#90b8c8', border:'rgba(120,160,180,0.4)' },
  Veranstaltung:{ bg:'rgba(160,160,160,0.12)', color:'#b8b8b8', border:'rgba(160,160,160,0.35)' },
  Festival:     { bg:'rgba(201,149,58,0.22)',  color:'#e8c060', border:'rgba(201,149,58,0.55)' },
}

const PERSONS = [
  { key:'H', name:'Holger', color:'#e8845a', bg:'rgba(232,132,90,0.15)' },
  { key:'D', name:'David',  color:'#5ab8e8', bg:'rgba(90,184,232,0.15)' },
  { key:'I', name:'Ilayda', color:'#a87ee0', bg:'rgba(168,126,224,0.15)' },
]

export default function App() {
  const [events, setEvents]             = useState([])
  const [loading, setLoading]           = useState(true)
  const [seeded, setSeeded]             = useState(false)
  const [catFilter, setCatFilter]       = useState('all')
  const [personFilter, setPersonFilter] = useState(null)
  const [editModal, setEditModal]       = useState(null)
  const [teamModal, setTeamModal]       = useState(null)
  const [exportMenu, setExportMenu]     = useState(null)

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

  const filtered = events.filter(e => {
    if (catFilter !== 'all' && e.cat !== catFilter) return false
    if (personFilter && !(e.team || []).includes(personFilter)) return false
    return true
  })

  const days = [...new Set(filtered.map(e => e.date))]
  const counts = { H:0, D:0, I:0 }
  events.forEach(e => (e.team||[]).forEach(p => { if (counts[p] !== undefined) counts[p]++ }))

  return (
    <div style={{ minHeight:'100vh', paddingBottom:90, background:'#0a1e2b' }}>

      {/* ── HEADER ── */}
      <header style={{
        background:'linear-gradient(160deg, #1a3a4a 0%, #0d2330 100%)',
        padding:'env(safe-area-inset-top, 0px) 0 0',
        borderBottom:'1px solid rgba(201,149,58,0.25)',
        position:'sticky', top:0, zIndex:200,
        boxShadow:'0 4px 24px rgba(0,0,0,0.4)'
      }}>
        <div style={{ padding:'18px 20px 16px', maxWidth:960, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
            <div>
              <div style={{ fontSize:9, letterSpacing:4, color:'#c9953a', textTransform:'uppercase', marginBottom:4, opacity:0.8 }}>
                Team · Einsatzplan
              </div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(20px,5vw,36px)', fontWeight:400, color:'#faf7f0', lineHeight:1.1 }}>
                Horizonte <em style={{ fontStyle:'italic', color:'#c9953a' }}>Zingst</em>
                <span style={{ fontSize:'clamp(14px,3vw,24px)', color:'rgba(250,247,240,0.5)', marginLeft:8 }}>2026</span>
              </div>
            </div>
            <button
              onClick={() => setEditModal('new')}
              style={{
                background:'#c9953a', border:'none', color:'#0d2330',
                padding:'10px 16px', borderRadius:10, fontSize:13,
                fontWeight:700, letterSpacing:0.5, whiteSpace:'nowrap',
                boxShadow:'0 2px 12px rgba(201,149,58,0.4)', flexShrink:0
              }}
            >+ Termin</button>
          </div>

          {/* Team pills */}
          <div style={{ display:'flex', gap:8, marginTop:14 }}>
            {PERSONS.map(p => (
              <div key={p.key} style={{
                fontSize:11, fontWeight:500, padding:'5px 14px', borderRadius:20,
                border:`1.5px solid ${p.color}`, background:p.bg, color:p.color,
                letterSpacing:0.5
              }}>{p.name}</div>
            ))}
          </div>
        </div>

        {/* ── FILTER STRIP ── */}
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', padding:'10px 20px' }}>
          <div className="filter-scroll">
            {['all', ...CATEGORIES].map(c => (
              <button key={c} onClick={() => setCatFilter(c)} style={{
                background: catFilter===c ? '#c9953a' : 'rgba(255,255,255,0.05)',
                border:`1px solid ${catFilter===c ? '#c9953a' : 'rgba(255,255,255,0.1)'}`,
                color: catFilter===c ? '#0d2330' : '#8faab5',
                padding:'7px 14px', fontSize:12, borderRadius:20,
                fontWeight: catFilter===c ? 600 : 400,
                whiteSpace:'nowrap', flexShrink:0,
                transition:'all 0.15s'
              }}>{c === 'all' ? 'Alle' : c}</button>
            ))}
          </div>
        </div>

        {/* ── PERSON FILTER ── */}
        <div style={{ padding:'0 20px 12px', display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:10, color:'#8faab5', letterSpacing:2, textTransform:'uppercase', flexShrink:0 }}>Zeige:</span>
          {[{ key:null, name:'Alle' }, ...PERSONS].map(p => (
            <button key={p.key||'all'} onClick={() => setPersonFilter(personFilter===p.key ? null : p.key)} style={{
              background: personFilter===p.key ? (p.bg||'rgba(201,149,58,0.15)') : 'rgba(255,255,255,0.05)',
              border:`1px solid ${personFilter===p.key ? (p.color||'#c9953a') : 'rgba(255,255,255,0.1)'}`,
              color: personFilter===p.key ? (p.color||'#c9953a') : '#8faab5',
              padding:'6px 14px', fontSize:12, borderRadius:20, whiteSpace:'nowrap',
              fontWeight: personFilter===p.key ? 600 : 400
            }}>{p.name}</button>
          ))}
        </div>
      </header>

      {/* ── MAIN ── */}
      <main style={{ maxWidth:960, margin:'0 auto', padding:'20px 16px' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:80, color:'#8faab5', fontSize:14 }}>
            <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
            Termine werden geladen…
          </div>
        ) : days.length === 0 ? (
          <div style={{ textAlign:'center', padding:80, color:'#8faab5', fontSize:14 }}>
            Keine Termine für diesen Filter.
          </div>
        ) : days.map(date => {
          const dayEvs = filtered.filter(e => e.date === date)
          if (!dayEvs.length) return null
          const [dn, dd] = DAY_LABELS[date] || [date, date]

          return (
            <div key={date} className="fade-in" style={{ marginBottom:32 }}>

              {/* Day header */}
              <div style={{
                display:'flex', alignItems:'center', gap:12,
                marginBottom:12, paddingBottom:10,
                borderBottom:'2px solid rgba(201,149,58,0.3)',
                position:'sticky', top:180, zIndex:10,
                background:'#0a1e2b', paddingTop:4
              }}>
                <div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(18px,4vw,24px)', color:'#faf7f0', fontStyle:'italic', lineHeight:1 }}>{dn}</div>
                  <div style={{ fontSize:11, color:'#c9953a', letterSpacing:2, marginTop:3 }}>{dd}</div>
                </div>
                <div style={{
                  marginLeft:'auto', fontSize:11, color:'#8faab5',
                  background:'rgba(255,255,255,0.05)', padding:'4px 10px', borderRadius:20,
                  border:'1px solid rgba(255,255,255,0.08)'
                }}>{dayEvs.length} Termine</div>
              </div>

              {/* Event cards */}
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {dayEvs.map(e => {
                  const team = e.team || []
                  const assignments = e.assignments || {}
                  const cc = CAT_COLORS[e.cat] || CAT_COLORS.Veranstaltung
                  const hasTeam = team.length > 0
                  const allThree = team.length === 3
                  const accentColor = allThree ? '#c9953a'
                    : team.includes('H') ? '#e8845a'
                    : team.includes('D') ? '#5ab8e8'
                    : team.includes('I') ? '#a87ee0'
                    : 'transparent'

                  return (
                    <div key={e.id} style={{
                      background: allThree
                        ? 'linear-gradient(135deg, #1a2e1a, #112433)'
                        : '#112433',
                      borderRadius:14,
                      border:`1px solid ${hasTeam ? accentColor+'44' : 'rgba(255,255,255,0.07)'}`,
                      borderLeft:`4px solid ${accentColor}`,
                      overflow:'hidden',
                      boxShadow: hasTeam
                        ? `0 4px 20px ${accentColor}22`
                        : '0 2px 12px rgba(0,0,0,0.3)',
                      transition:'box-shadow 0.2s'
                    }}>
                      <div style={{ padding:'14px 16px' }}>

                        {/* Time + Title */}
                        <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                          <div style={{
                            fontSize:13, color:'#3d7a8a', fontWeight:600,
                            letterSpacing:1, flexShrink:0, paddingTop:2,
                            minWidth:42
                          }}>{e.time}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div
                              onClick={() => setEditModal(e)}
                              style={{
                                fontSize:'clamp(13px,3.5vw,15px)',
                                color:'#f2ead8', lineHeight:1.45,
                                cursor:'pointer', fontWeight:500
                              }}
                            >{e.title}</div>
                            {e.location && (
                              <div style={{ fontSize:12, color:'#8faab5', marginTop:4, display:'flex', alignItems:'center', gap:4 }}>
                                <span>📍</span>
                                <span>{e.location}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Team badges */}
                        {hasTeam && (
                          <div style={{ display:'flex', gap:6, marginTop:12, flexWrap:'wrap' }}>
                            {PERSONS.filter(p => team.includes(p.key)).map(p => {
                              const roles = assignments[p.key] || []
                              return (
                                <div key={p.key} style={{
                                  display:'flex', alignItems:'center', gap:6,
                                  padding:'5px 12px', borderRadius:20,
                                  background:p.bg,
                                  border:`1px solid ${p.color}55`,
                                  fontSize:12
                                }}>
                                  <div style={{ width:6, height:6, borderRadius:'50%', background:p.color, flexShrink:0 }} />
                                  <span style={{ color:p.color, fontWeight:600 }}>{p.name}</span>
                                  {roles.length > 0 && (
                                    <span style={{ color:'rgba(255,255,255,0.4)', fontSize:11 }}>
                                      {roles.join(' · ')}
                                    </span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Action row */}
                        <div style={{
                          display:'flex', gap:8, marginTop:12,
                          paddingTop:10, borderTop:'1px solid rgba(255,255,255,0.06)',
                          alignItems:'center', flexWrap:'wrap'
                        }}>
                          {/* Category */}
                          <span style={{
                            fontSize:10, letterSpacing:1.5, textTransform:'uppercase',
                            padding:'4px 10px', borderRadius:20,
                            background:cc.bg, color:cc.color, border:`1px solid ${cc.border}`,
                            fontWeight:500
                          }}>{e.cat}</span>

                          <div style={{ display:'flex', gap:8, marginLeft:'auto' }}>
                            {/* Team button */}
                            <button
                              onClick={() => setTeamModal(e)}
                              style={{
                                background: hasTeam ? 'rgba(201,149,58,0.12)' : 'rgba(255,255,255,0.05)',
                                border:`1px solid ${hasTeam ? 'rgba(201,149,58,0.4)' : 'rgba(255,255,255,0.1)'}`,
                                color: hasTeam ? '#c9953a' : '#8faab5',
                                fontSize:12, padding:'7px 14px', borderRadius:8,
                                fontWeight:500, display:'flex', alignItems:'center', gap:5
                              }}
                            >👥 Team</button>

                            {/* Export button */}
                            <div style={{ position:'relative' }}>
                              <button
                                onClick={() => setExportMenu(exportMenu===e.id ? null : e.id)}
                                style={{
                                  background:'rgba(255,255,255,0.05)',
                                  border:'1px solid rgba(255,255,255,0.1)',
                                  color:'#8faab5', fontSize:12, padding:'7px 14px',
                                  borderRadius:8, display:'flex', alignItems:'center', gap:5
                                }}
                              >📅 Export</button>
                              {exportMenu === e.id && (
                                <div style={{
                                  position:'absolute', bottom:'110%', right:0, zIndex:300,
                                  background:'#1a3040',
                                  border:'1px solid rgba(201,149,58,0.3)',
                                  borderRadius:12, padding:'8px 0',
                                  minWidth:190,
                                  boxShadow:'0 8px 32px rgba(0,0,0,0.5)'
                                }}>
                                  {[
                                    { icon:'🗓', label:'Google Calendar', action: () => window.open(googleCalendarUrl(e), '_blank') },
                                    { icon:'📧', label:'Outlook Web',     action: () => window.open(outlookCalendarUrl(e), '_blank') },
                                    { icon:'⬇️', label:'ICS Download',    action: () => downloadIcs(e) },
                                  ].map(opt => (
                                    <button key={opt.label}
                                      onClick={() => { opt.action(); setExportMenu(null) }}
                                      style={{
                                        display:'flex', alignItems:'center', gap:10,
                                        width:'100%', background:'transparent',
                                        border:'none', color:'#f2ead8',
                                        padding:'11px 18px', fontSize:13, cursor:'pointer',
                                        textAlign:'left'
                                      }}
                                      onMouseEnter={ev => ev.currentTarget.style.background='rgba(201,149,58,0.1)'}
                                      onMouseLeave={ev => ev.currentTarget.style.background='transparent'}
                                    >
                                      <span>{opt.icon}</span>
                                      <span>{opt.label}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
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

      {/* ── SUMMARY BAR ── */}
      <div style={{
        position:'fixed', bottom:0, left:0, right:0,
        background:'rgba(10,30,43,0.97)',
        backdropFilter:'blur(16px)',
        WebkitBackdropFilter:'blur(16px)',
        borderTop:'1px solid rgba(201,149,58,0.2)',
        padding:'12px 20px',
        paddingBottom:'calc(12px + env(safe-area-inset-bottom, 0px))',
        display:'flex', alignItems:'center', gap:0,
        justifyContent:'space-around'
      }}>
        {PERSONS.map(p => (
          <div key={p.key} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
            <span style={{ fontSize:18, fontWeight:700, color:p.color, lineHeight:1 }}>{counts[p.key]}</span>
            <span style={{ fontSize:10, color:'#8faab5', letterSpacing:1 }}>{p.name}</span>
          </div>
        ))}
        <div style={{ width:1, height:30, background:'rgba(255,255,255,0.08)' }} />
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
          <span style={{ fontSize:18, fontWeight:700, color:'#8faab5', lineHeight:1 }}>{filtered.length}</span>
          <span style={{ fontSize:10, color:'#8faab5', letterSpacing:1 }}>Termine</span>
        </div>
      </div>

      {/* ── MODALS ── */}
      {editModal && (
        <EventModal
          event={editModal==='new' ? null : editModal}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          onClose={() => setEditModal(null)}
        />
      )}
      {teamModal && (
        <TeamModal
          event={teamModal}
          onSave={handleSaveTeam}
          onClose={() => setTeamModal(null)}
        />
      )}
      {exportMenu && (
        <div style={{ position:'fixed', inset:0, zIndex:50 }} onClick={() => setExportMenu(null)} />
      )}
    </div>
  )
}
