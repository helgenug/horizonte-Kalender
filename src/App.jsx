import { useState, useEffect } from 'react'
import { db } from './firebase.js'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch, getDocs
} from 'firebase/firestore'
import { INITIAL_EVENTS, CATEGORIES, DAY_LABELS } from './events.js'
import EventModal from './components/EventModal.jsx'
import { googleCalendarUrl, outlookCalendarUrl, downloadIcs } from './components/calendarExport.js'

const CAT_COLORS = {
  MVS:        { bg:'rgba(61,122,138,0.25)',  color:'#7ecce0', border:'rgba(61,122,138,0.4)' },
  Talk:       { bg:'rgba(201,149,58,0.15)',  color:'#d4a84b', border:'rgba(201,149,58,0.3)' },
  Seminar:    { bg:'rgba(100,160,100,0.15)', color:'#8dc88d', border:'rgba(100,160,100,0.3)' },
  Vernissage: { bg:'rgba(180,100,150,0.15)', color:'#d4a0c0', border:'rgba(180,100,150,0.3)' },
  Vortrag:    { bg:'rgba(150,130,80,0.2)',   color:'#c8b870', border:'rgba(150,130,80,0.3)' },
  Show:       { bg:'rgba(200,80,60,0.15)',   color:'#e09080', border:'rgba(200,80,60,0.3)' },
  Bilderflut: { bg:'rgba(80,80,180,0.15)',   color:'#a0a0e0', border:'rgba(80,80,180,0.3)' },
  Ausstellung:{ bg:'rgba(120,160,180,0.15)', color:'#90b8c8', border:'rgba(120,160,180,0.3)' },
  Veranstaltung:{ bg:'rgba(160,160,160,0.15)', color:'#b0b0b0', border:'rgba(160,160,160,0.3)' },
  Festival:   { bg:'rgba(201,149,58,0.25)',  color:'#e8c060', border:'rgba(201,149,58,0.5)' },
}

const PERSONS = [
  { key:'H', name:'Holger', color:'#e8845a', bg:'rgba(232,132,90,0.15)' },
  { key:'D', name:'David',  color:'#5ab8e8', bg:'rgba(90,184,232,0.15)' },
  { key:'I', name:'Ilayda', color:'#a87ee0', bg:'rgba(168,126,224,0.15)' },
]

export default function App() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [seeded, setSeeded] = useState(false)
  const [catFilter, setCatFilter] = useState('all')
  const [personFilter, setPersonFilter] = useState(null)
  const [modal, setModal] = useState(null) // null | 'new' | event-object
  const [exportMenu, setExportMenu] = useState(null) // event id

  // Seed initial data — uses a sentinel doc to ensure it only ever runs once
  useEffect(() => {
    const seedIfEmpty = async () => {
      const { getDoc, setDoc } = await import('firebase/firestore')
      const sentinelRef = doc(db, '_meta', 'seeded')
      const sentinel = await getDoc(sentinelRef)
      if (!sentinel.exists()) {
        const batch = writeBatch(db)
        INITIAL_EVENTS.forEach(e => {
          const ref = doc(collection(db, 'events'))
          batch.set(ref, { ...e, team: [] })
        })
        batch.set(sentinelRef, { at: new Date().toISOString() })
        await batch.commit()
      }
      setSeeded(true)
    }
    seedIfEmpty()
  }, [])

  // Realtime listener
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

  const handleSave = async (formData) => {
    const { id, ...data } = formData
    if (id) {
      await updateDoc(doc(db, 'events', id), data)
    } else {
      await addDoc(collection(db, 'events'), data)
    }
    setModal(null)
  }

  const handleDelete = async (id) => {
    if (!confirm('Termin wirklich löschen?')) return
    await deleteDoc(doc(db, 'events', id))
    setModal(null)
  }

  const toggleTeam = async (event, person) => {
    const current = event.team || []
    const updated = current.includes(person)
      ? current.filter(p => p !== person)
      : [...current, person]
    await updateDoc(doc(db, 'events', event.id), { team: updated })
  }

  // Group by date
  const days = [...new Set(events.map(e => e.date))]
  const filtered = events.filter(e => {
    if (catFilter !== 'all' && e.cat !== catFilter) return false
    if (personFilter && !(e.team || []).includes(personFilter)) return false
    return true
  })

  const counts = { H:0, D:0, I:0 }
  events.forEach(e => (e.team||[]).forEach(p => { if(counts[p]!==undefined) counts[p]++ }))

  return (
    <div style={{ minHeight:'100vh', paddingBottom:'80px' }}>

      {/* HEADER */}
      <header style={{
        background:'linear-gradient(180deg,#1a3a4a 0%,#0d2330 100%)',
        padding:'36px 24px 28px',
        borderBottom:'1px solid rgba(201,149,58,0.3)',
        position:'relative'
      }}>
        <div style={{ maxWidth:960, margin:'0 auto', display:'flex', alignItems:'flex-end', gap:24, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:10, letterSpacing:4, color:'#c9953a', textTransform:'uppercase', marginBottom:6 }}>
              Team · Einsatzplan
            </div>
            <h1 style={{
              fontFamily:"'Playfair Display',serif", fontSize:'clamp(24px,5vw,44px)',
              fontWeight:400, color:'#faf7f0', lineHeight:1.1
            }}>
              Horizonte <em style={{ fontStyle:'italic', color:'#c9953a' }}>Zingst</em> 2026
            </h1>
            <div style={{ fontSize:10, color:'#8faab5', letterSpacing:2, marginTop:8 }}>
              29. MAI — 07. JUNI 2026
            </div>
          </div>
          <div style={{ display:'flex', gap:10, marginLeft:'auto', flexWrap:'wrap', alignItems:'center' }}>
            {PERSONS.map(p => (
              <div key={p.key} style={{
                display:'flex', alignItems:'center', gap:6,
                fontSize:11, letterSpacing:1, padding:'4px 12px', borderRadius:20,
                border:`1px solid ${p.color}`, background:p.bg, color:p.color
              }}>
                {p.key} · {p.name}
              </div>
            ))}
            <button
              onClick={() => setModal('new')}
              style={{
                background:'#c9953a', border:'none', color:'#0d2330',
                padding:'8px 18px', borderRadius:4, fontSize:12,
                fontWeight:500, letterSpacing:1, marginLeft:8
              }}
            >+ Termin</button>
          </div>
        </div>
      </header>

      {/* FILTERS */}
      <div style={{ maxWidth:960, margin:'0 auto', padding:'16px 24px', display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ fontSize:10, letterSpacing:2, color:'#8faab5', textTransform:'uppercase', marginRight:4 }}>Filter:</span>
        {['all', ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setCatFilter(c)} style={{
            background: catFilter===c ? '#c9953a' : 'transparent',
            border:`1px solid ${catFilter===c ? '#c9953a' : 'rgba(143,170,181,0.3)'}`,
            color: catFilter===c ? '#0d2330' : '#8faab5',
            padding:'4px 12px', fontSize:11, letterSpacing:1, borderRadius:2,
            fontWeight: catFilter===c ? 500 : 400
          }}>{c === 'all' ? 'Alle' : c}</button>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
          {PERSONS.map(p => (
            <button key={p.key} onClick={() => setPersonFilter(personFilter===p.key ? null : p.key)} style={{
              background: personFilter===p.key ? p.bg : 'transparent',
              border:`1px solid ${personFilter===p.key ? p.color : 'rgba(143,170,181,0.25)'}`,
              color: personFilter===p.key ? p.color : '#8faab5',
              padding:'4px 12px', fontSize:11, borderRadius:20
            }}>{p.name}</button>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <main style={{ maxWidth:960, margin:'0 auto', padding:'0 24px' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:'#8faab5', fontSize:13 }}>Laden…</div>
        ) : (
          days.map(date => {
            const dayEvs = filtered.filter(e => e.date === date)
            if (!dayEvs.length) return null
            const [dn, dd] = DAY_LABELS[date] || [date, date]
            return (
              <div key={date} style={{ marginBottom:32 }}>
                <div style={{
                  display:'flex', alignItems:'baseline', gap:14,
                  marginBottom:10, paddingBottom:7,
                  borderBottom:'1px solid rgba(201,149,58,0.2)'
                }}>
                  <span style={{ fontFamily:"'Playfair Display',serif", fontSize:19, color:'#faf7f0', fontStyle:'italic' }}>{dn}</span>
                  <span style={{ fontSize:11, color:'#c9953a', letterSpacing:2 }}>{dd}</span>
                  <span style={{ fontSize:10, color:'#8faab5', marginLeft:'auto' }}>{dayEvs.length} Termine</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                  {dayEvs.map(e => {
                    const team = e.team || []
                    const cc = CAT_COLORS[e.cat] || CAT_COLORS.Veranstaltung
                    const borderColor = team.includes('H') && team.includes('D') && team.includes('I')
                      ? '#c9953a'
                      : team.includes('H') ? '#e8845a'
                      : team.includes('D') ? '#5ab8e8'
                      : team.includes('I') ? '#a87ee0'
                      : 'transparent'

                    return (
                      <div key={e.id} style={{
                        display:'grid', gridTemplateColumns:'46px 1fr auto',
                        gap:10, alignItems:'center',
                        padding:'9px 12px',
                        background: team.length===3 ? 'rgba(201,149,58,0.08)' : 'rgba(26,58,74,0.28)',
                        borderLeft:`2px solid ${borderColor}`,
                        borderRadius:2, position:'relative'
                      }}>
                        {/* Time */}
                        <div style={{ fontSize:12, color:'#3d7a8a', letterSpacing:1, fontWeight:500 }}>{e.time}</div>

                        {/* Body */}
                        <div>
                          <div
                            onClick={() => setModal(e)}
                            style={{ fontSize:12.5, color:'#f2ead8', lineHeight:1.4, cursor:'pointer' }}
                            title="Klicken zum Bearbeiten"
                          >{e.title}</div>
                          {e.location && <div style={{ fontSize:10, color:'#8faab5', marginTop:2 }}>📍 {e.location}</div>}
                          <div style={{ display:'flex', gap:6, marginTop:5, alignItems:'center', flexWrap:'wrap' }}>
                            {/* Category tag */}
                            <span style={{
                              fontSize:9, letterSpacing:1.5, textTransform:'uppercase',
                              padding:'2px 6px', borderRadius:2,
                              background:cc.bg, color:cc.color, border:`1px solid ${cc.border}`
                            }}>{e.cat}</span>
                            {/* Calendar export */}
                            <div style={{ position:'relative' }}>
                              <button
                                onClick={() => setExportMenu(exportMenu===e.id ? null : e.id)}
                                style={{
                                  background:'transparent', border:'1px solid rgba(143,170,181,0.2)',
                                  color:'#8faab5', fontSize:9, padding:'2px 8px', borderRadius:2,
                                  letterSpacing:1
                                }}
                                title="Zum Kalender hinzufügen"
                              >📅 Export</button>
                              {exportMenu === e.id && (
                                <div style={{
                                  position:'absolute', top:'100%', left:0, zIndex:100,
                                  background:'#0f2a3a', border:'1px solid rgba(201,149,58,0.3)',
                                  borderRadius:4, padding:'6px 0', minWidth:160, marginTop:4
                                }}>
                                  {[
                                    { label:'Google Calendar', action: () => window.open(googleCalendarUrl(e), '_blank') },
                                    { label:'Outlook Web',     action: () => window.open(outlookCalendarUrl(e), '_blank') },
                                    { label:'ICS herunterladen', action: () => downloadIcs(e) },
                                  ].map(opt => (
                                    <button key={opt.label} onClick={() => { opt.action(); setExportMenu(null) }} style={{
                                      display:'block', width:'100%', background:'transparent',
                                      border:'none', color:'#f2ead8', textAlign:'left',
                                      padding:'7px 14px', fontSize:11, cursor:'pointer'
                                    }}
                                    onMouseEnter={e => e.target.style.background='rgba(201,149,58,0.1)'}
                                    onMouseLeave={e => e.target.style.background='transparent'}
                                    >{opt.label}</button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Team buttons */}
                        <div style={{ display:'flex', gap:5 }}>
                          {PERSONS.map(p => (
                            <button
                              key={p.key}
                              onClick={() => toggleTeam(e, p.key)}
                              style={{
                                width:30, height:26, borderRadius:4, fontSize:11, fontWeight:500,
                                border:`1.5px solid ${team.includes(p.key) ? p.color : 'rgba(143,170,181,0.25)'}`,
                                background: team.includes(p.key) ? p.color : 'transparent',
                                color: team.includes(p.key) ? '#0d2330' : '#8faab5',
                                transition:'all 0.15s'
                              }}
                            >{p.key}</button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </main>

      {/* SUMMARY BAR */}
      <div style={{
        position:'fixed', bottom:0, left:0, right:0,
        background:'rgba(13,35,48,0.96)', backdropFilter:'blur(10px)',
        borderTop:'1px solid rgba(201,149,58,0.25)',
        padding:'10px 24px', display:'flex', gap:24, justifyContent:'center', flexWrap:'wrap'
      }}>
        {PERSONS.map(p => (
          <div key={p.key} style={{ display:'flex', alignItems:'center', gap:8, fontSize:11 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:p.color }} />
            <span style={{ color:'#8faab5' }}>{p.name}</span>
            <span style={{ fontSize:16, fontWeight:500, color:p.color }}>{counts[p.key]}</span>
          </div>
        ))}
        <div style={{ marginLeft:'auto', fontSize:11, color:'#8faab5', alignSelf:'center' }}>
          {filtered.length} Termine sichtbar
        </div>
      </div>

      {/* MODAL */}
      {modal && (
        <EventModal
          event={modal === 'new' ? null : modal}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModal(null)}
        />
      )}

      {/* Close export menu on outside click */}
      {exportMenu && (
        <div
          style={{ position:'fixed', inset:0, zIndex:50 }}
          onClick={() => setExportMenu(null)}
        />
      )}
    </div>
  )
}
