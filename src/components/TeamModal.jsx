const ROLES = ['Fotograf', 'Videograf', 'Social Media']

const PERSONS = [
  { key:'H', name:'Holger', color:'#e8845a', bg:'rgba(232,132,90,0.15)' },
  { key:'D', name:'David',  color:'#5ab8e8', bg:'rgba(90,184,232,0.15)' },
  { key:'I', name:'Ilayda', color:'#a87ee0', bg:'rgba(168,126,224,0.15)' },
]

export default function TeamModal({ event, onSave, onClose }) {
  // assignments: { H: ['Fotograf'], D: [], I: ['Videograf', 'Social Media'] }
  const [assignments, setAssignments] = useState(
    structuredClone(event.assignments || {})
  )

  function toggle(personKey, role) {
    setAssignments(prev => {
      const current = prev[personKey] || []
      const updated = current.includes(role)
        ? current.filter(r => r !== role)
        : [...current, role]
      return { ...prev, [personKey]: updated }
    })
  }

  function togglePerson(personKey) {
    setAssignments(prev => {
      const hasAny = (prev[personKey] || []).length > 0
      return { ...prev, [personKey]: hasAny ? [] : ['Fotograf'] }
    })
  }

  const handleSave = () => {
    // also update legacy team array for filter compatibility
    const team = Object.entries(assignments)
      .filter(([, roles]) => roles.length > 0)
      .map(([k]) => k)
    onSave({ assignments, team })
  }

  return (
    <div
      style={{
        position:'fixed', inset:0, background:'rgba(0,0,0,0.75)',
        display:'flex', alignItems:'center', justifyContent:'center',
        zIndex:1000, padding:20
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background:'#0f2a3a', border:'1px solid rgba(201,149,58,0.3)',
        borderRadius:8, padding:24, width:'100%', maxWidth:440,
        maxHeight:'90vh', overflowY:'auto'
      }}>
        {/* Title */}
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, color:'#faf7f0', fontStyle:'italic', marginBottom:4 }}>
          Team zuweisen
        </div>
        <div style={{ fontSize:11, color:'#8faab5', marginBottom:20, letterSpacing:1 }}>
          {event.time} · {event.title}
        </div>

        {/* Per person */}
        {PERSONS.map(p => {
          const personRoles = assignments[p.key] || []
          const active = personRoles.length > 0
          return (
            <div key={p.key} style={{
              marginBottom:14,
              padding:12,
              borderRadius:6,
              border:`1px solid ${active ? p.color : 'rgba(143,170,181,0.15)'}`,
              background: active ? p.bg : 'transparent',
              transition:'all 0.2s'
            }}>
              {/* Person header */}
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: active ? 12 : 0 }}>
                <button
                  onClick={() => togglePerson(p.key)}
                  style={{
                    width:28, height:28, borderRadius:'50%',
                    border:`2px solid ${p.color}`,
                    background: active ? p.color : 'transparent',
                    color: active ? '#0d2330' : p.color,
                    fontSize:11, fontWeight:700, fontFamily:"'DM Mono',monospace",
                    cursor:'pointer', flexShrink:0
                  }}
                >{p.key}</button>
                <span style={{ color: active ? p.color : '#8faab5', fontSize:13, fontWeight: active ? 500 : 400 }}>
                  {p.name}
                </span>
                {active && (
                  <span style={{ marginLeft:'auto', fontSize:10, color:p.color, letterSpacing:1 }}>
                    {personRoles.join(' · ')}
                  </span>
                )}
              </div>

              {/* Role pills — only show if person active */}
              {active && (
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {ROLES.map(role => {
                    const on = personRoles.includes(role)
                    return (
                      <button
                        key={role}
                        onClick={() => toggle(p.key, role)}
                        style={{
                          padding:'4px 12px', borderRadius:20, fontSize:11,
                          border:`1px solid ${on ? p.color : 'rgba(143,170,181,0.25)'}`,
                          background: on ? p.color : 'transparent',
                          color: on ? '#0d2330' : '#8faab5',
                          cursor:'pointer', fontFamily:"'DM Mono',monospace",
                          fontWeight: on ? 500 : 400
                        }}
                      >{role}</button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* Buttons */}
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
          <button
            onClick={onClose}
            style={{
              background:'transparent', border:'1px solid rgba(143,170,181,0.3)',
              color:'#8faab5', padding:'8px 20px', borderRadius:4, fontSize:12
            }}
          >Abbrechen</button>
          <button
            onClick={handleSave}
            style={{
              background:'#c9953a', border:'none', color:'#0d2330',
              padding:'8px 24px', borderRadius:4, fontSize:12, fontWeight:500
            }}
          >Speichern</button>
        </div>
      </div>
    </div>
  )
}

// Need useState import
import { useState } from 'react'
