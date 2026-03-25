import { useState } from 'react'

export default function BriefingModal({ event, persons, onSave, onClose }) {
  const b = event.briefing || {}
  const [notes, setNotes]       = useState(b.notes || '')
  const [deadline, setDeadline] = useState(b.deadline || '')
  const [tasks, setTasks]       = useState(b.tasks || {})

  const setTask = (key, val) => setTasks(prev => ({ ...prev, [key]: val }))

  const handleSave = () => {
    onSave({ notes, deadline, tasks })
  }

  const hasBriefing = notes || deadline || Object.values(tasks).some(t => t)

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="slide-up" style={{
        background:'#f2f2f7', borderRadius:'20px 20px 0 0',
        width:'100%', maxWidth:560, maxHeight:'92vh', overflowY:'auto',
        paddingBottom:'env(safe-area-inset-bottom, 20px)'
      }}>
        {/* Handle */}
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 0' }}>
          <div style={{ width:36, height:4, borderRadius:2, background:'#c7c7cc' }} />
        </div>

        <div style={{ padding:'16px 20px 24px' }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
            <div>
              <div style={{ fontSize:20, fontWeight:700, color:'#1c1c1e' }}>Briefing</div>
              <div style={{ fontSize:13, color:'#8e8e93', marginTop:2 }}>{event.time} · {event.title}</div>
            </div>
            {hasBriefing && (
              <div style={{ fontSize:11, color:'#34c759', fontWeight:600, background:'#34c75915', padding:'4px 10px', borderRadius:20, border:'1px solid #34c75940', marginTop:4 }}>
                ✓ Briefing vorhanden
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:12, color:'#8e8e93', textTransform:'uppercase', letterSpacing:1, fontWeight:600, marginBottom:6 }}>
              Hinweise & Aufgaben
            </div>
            <div style={{ background:'#ffffff', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Was ist wichtig? Besondere Motive, Stimmungen, Must-Haves…"
                rows={4}
                style={{
                  border:'none', background:'transparent',
                  padding:'14px 16px', fontSize:15, width:'100%',
                  resize:'none', lineHeight:1.5, color:'#1c1c1e'
                }}
              />
            </div>
          </div>

          {/* Per-person tasks */}
          {persons.filter(p => (event.team||[]).includes(p.key)).length > 0 && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:12, color:'#8e8e93', textTransform:'uppercase', letterSpacing:1, fontWeight:600, marginBottom:6 }}>
                Bildauftrag pro Person
              </div>
              <div style={{ background:'#ffffff', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                {persons.filter(p => (event.team||[]).includes(p.key)).map((p, i, arr) => (
                  <div key={p.key}>
                    {i > 0 && <div style={{ height:1, background:'#f2f2f7', marginLeft:56 }} />}
                    <div style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'12px 16px' }}>
                      <div style={{
                        width:32, height:32, borderRadius:16, background:p.color,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:12, fontWeight:700, color:'white', flexShrink:0, marginTop:2
                      }}>{p.key}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:p.color, marginBottom:6 }}>{p.name}</div>
                        <textarea
                          value={tasks[p.key] || ''}
                          onChange={e => setTask(p.key, e.target.value)}
                          placeholder={`Aufgabe für ${p.name}…`}
                          rows={2}
                          style={{
                            border:'1px solid #e5e5ea', background:'#f9f9f9',
                            padding:'8px 10px', fontSize:14, width:'100%',
                            resize:'none', lineHeight:1.4, color:'#1c1c1e',
                            borderRadius:8
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deadline */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:12, color:'#8e8e93', textTransform:'uppercase', letterSpacing:1, fontWeight:600, marginBottom:6 }}>
              Lieferdeadline
            </div>
            <div style={{ background:'#ffffff', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display:'flex', alignItems:'center' }}>
                <span style={{ fontSize:18, padding:'0 14px' }}>⏰</span>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  style={{
                    border:'none', background:'transparent',
                    padding:'13px 16px 13px 0', fontSize:15, flex:1, color:'#1c1c1e'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onClose} style={{ flex:1, padding:'14px', borderRadius:12, background:'#ffffff', border:'1px solid #e5e5ea', color:'#8e8e93', fontSize:15, fontWeight:600 }}>
              Abbrechen
            </button>
            <button onClick={handleSave} style={{ flex:2, padding:'14px', borderRadius:12, background:'#c9953a', border:'none', color:'#fff', fontSize:15, fontWeight:700, boxShadow:'0 4px 12px rgba(201,149,58,0.3)' }}>
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
