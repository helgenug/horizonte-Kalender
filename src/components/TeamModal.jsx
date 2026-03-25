import { useState } from 'react'

const ROLES = ['Fotograf', 'Videograf', 'Social Media']

export default function TeamModal({ event, persons, onSave, onClose }) {
  const [assignments, setAssignments] = useState(
    JSON.parse(JSON.stringify(event.assignments || {}))
  )

  const isActive = (key) => (assignments[key] || []).length > 0
  const togglePerson = (key) => setAssignments(prev => ({ ...prev, [key]: isActive(key) ? [] : ['Fotograf'] }))
  const toggleRole = (personKey, role) => setAssignments(prev => {
    const cur = prev[personKey] || []
    return { ...prev, [personKey]: cur.includes(role) ? cur.filter(r => r !== role) : [...cur, role] }
  })

  const handleSave = () => {
    const team = Object.entries(assignments).filter(([, r]) => r.length > 0).map(([k]) => k)
    onSave({ assignments, team })
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="slide-up" style={{ background:'#f2f2f7', borderRadius:'20px 20px 0 0', width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto', paddingBottom:'env(safe-area-inset-bottom, 20px)' }}>

        {/* Handle */}
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 0' }}>
          <div style={{ width:36, height:4, borderRadius:2, background:'#c7c7cc' }} />
        </div>

        <div style={{ padding:'16px 20px 24px' }}>
          <div style={{ fontSize:18, fontWeight:700, color:'#1c1c1e', marginBottom:4 }}>Team zuweisen</div>
          <div style={{ fontSize:14, color:'#8e8e93', marginBottom:20 }}>{event.time} · {event.title}</div>

          {persons.map(p => {
            const active = isActive(p.key)
            const roles = assignments[p.key] || []
            return (
              <div key={p.key} style={{
                background:'#ffffff', borderRadius:14, marginBottom:10,
                overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                border: active ? `1.5px solid ${p.color}50` : '1.5px solid transparent'
              }}>
                <button onClick={() => togglePerson(p.key)} style={{
                  width:'100%', background:'transparent', border:'none',
                  display:'flex', alignItems:'center', gap:14, padding:'14px 16px', cursor:'pointer'
                }}>
                  <div style={{
                    width:40, height:40, borderRadius:20,
                    background: active ? p.color : `${p.color}18`,
                    border:`2px solid ${p.color}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:14, fontWeight:700, color: active ? '#fff' : p.color,
                    transition:'all 0.2s', flexShrink:0
                  }}>{p.key}</div>
                  <div style={{ flex:1, textAlign:'left' }}>
                    <div style={{ fontSize:16, fontWeight:600, color: active ? '#1c1c1e' : '#8e8e93' }}>{p.name}</div>
                    {active && roles.length > 0 && <div style={{ fontSize:12, color:'#8e8e93', marginTop:1 }}>{roles.join(' · ')}</div>}
                  </div>
                  <div style={{
                    width:24, height:24, borderRadius:12,
                    background: active ? p.color : '#e5e5ea',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'white', fontSize:14, fontWeight:700, flexShrink:0
                  }}>{active ? '✓' : ''}</div>
                </button>

                {active && (
                  <div style={{ padding:'0 16px 14px', borderTop:'1px solid #f2f2f7' }}>
                    <div style={{ fontSize:11, color:'#8e8e93', textTransform:'uppercase', letterSpacing:1, marginBottom:8, marginTop:10 }}>Rolle</div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      {ROLES.map(role => {
                        const on = roles.includes(role)
                        return (
                          <button key={role} onClick={() => toggleRole(p.key, role)} style={{
                            padding:'8px 16px', borderRadius:20, fontSize:14,
                            background: on ? p.color : '#f2f2f7',
                            border:`1.5px solid ${on ? p.color : '#e5e5ea'}`,
                            color: on ? '#fff' : '#3a3a3c',
                            fontWeight: on ? 600 : 400
                          }}>{role}</button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          <div style={{ display:'flex', gap:10, marginTop:16 }}>
            <button onClick={onClose} style={{ flex:1, padding:'14px', borderRadius:12, background:'#ffffff', border:'1px solid #e5e5ea', color:'#8e8e93', fontSize:15, fontWeight:600 }}>Abbrechen</button>
            <button onClick={handleSave} style={{ flex:2, padding:'14px', borderRadius:12, background:'#c9953a', border:'none', color:'#fff', fontSize:15, fontWeight:700, boxShadow:'0 4px 12px rgba(201,149,58,0.3)' }}>Speichern</button>
          </div>
        </div>
      </div>
    </div>
  )
}
