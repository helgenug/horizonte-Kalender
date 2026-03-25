import { useState } from 'react'

const ROLES = ['Fotograf', 'Videograf', 'Social Media']

const PERSONS = [
  { key:'H', name:'Holger', color:'#e8845a', bg:'rgba(232,132,90,0.12)' },
  { key:'D', name:'David',  color:'#5ab8e8', bg:'rgba(90,184,232,0.12)' },
  { key:'I', name:'Ilayda', color:'#a87ee0', bg:'rgba(168,126,224,0.12)' },
]

export default function TeamModal({ event, onSave, onClose }) {
  const [assignments, setAssignments] = useState(
    JSON.parse(JSON.stringify(event.assignments || {}))
  )

  const isActive = (key) => (assignments[key] || []).length > 0

  const togglePerson = (key) => {
    setAssignments(prev => ({
      ...prev,
      [key]: isActive(key) ? [] : ['Fotograf']
    }))
  }

  const toggleRole = (personKey, role) => {
    setAssignments(prev => {
      const current = prev[personKey] || []
      const updated = current.includes(role)
        ? current.filter(r => r !== role)
        : [...current, role]
      return { ...prev, [personKey]: updated }
    })
  }

  const handleSave = () => {
    const team = Object.entries(assignments)
      .filter(([, roles]) => roles.length > 0)
      .map(([k]) => k)
    onSave({ assignments, team })
  }

  return (
    <div
      style={{
        position:'fixed', inset:0,
        background:'rgba(0,0,0,0.7)',
        backdropFilter:'blur(6px)',
        display:'flex', alignItems:'flex-end', justifyContent:'center',
        zIndex:1000, padding:'0'
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal-in"
        style={{
          background:'#0f2535',
          borderRadius:'20px 20px 0 0',
          padding:'0 0 env(safe-area-inset-bottom, 20px)',
          width:'100%', maxWidth:560,
          maxHeight:'90vh', overflowY:'auto',
          border:'1px solid rgba(201,149,58,0.2)',
          borderBottom:'none',
          boxShadow:'0 -8px 40px rgba(0,0,0,0.6)'
        }}
      >
        {/* Handle */}
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 8px' }}>
          <div style={{ width:40, height:4, borderRadius:2, background:'rgba(255,255,255,0.15)' }} />
        </div>

        <div style={{ padding:'4px 20px 20px' }}>
          {/* Header */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, color:'#8faab5', letterSpacing:2, textTransform:'uppercase', marginBottom:4 }}>
              {event.time}
            </div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, color:'#faf7f0', lineHeight:1.3 }}>
              {event.title}
            </div>
          </div>

          {/* Persons */}
          {PERSONS.map(p => {
            const active = isActive(p.key)
            const personRoles = assignments[p.key] || []
            return (
              <div key={p.key} style={{
                marginBottom:12, borderRadius:14,
                border:`1.5px solid ${active ? p.color : 'rgba(255,255,255,0.08)'}`,
                background: active ? p.bg : 'rgba(255,255,255,0.03)',
                overflow:'hidden',
                transition:'all 0.2s'
              }}>
                {/* Person row */}
                <button
                  onClick={() => togglePerson(p.key)}
                  style={{
                    width:'100%', background:'transparent', border:'none',
                    display:'flex', alignItems:'center', gap:14,
                    padding:'14px 16px', cursor:'pointer', textAlign:'left'
                  }}
                >
                  <div style={{
                    width:36, height:36, borderRadius:'50%',
                    border:`2px solid ${p.color}`,
                    background: active ? p.color : 'transparent',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color: active ? '#0d2330' : p.color,
                    fontSize:13, fontWeight:700, flexShrink:0,
                    fontFamily:"'DM Mono',monospace",
                    transition:'all 0.2s'
                  }}>{p.key}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:600, color: active ? p.color : '#8faab5', transition:'color 0.2s' }}>
                      {p.name}
                    </div>
                    {active && personRoles.length > 0 && (
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:2 }}>
                        {personRoles.join(' · ')}
                      </div>
                    )}
                  </div>
                  <div style={{
                    width:22, height:22, borderRadius:'50%',
                    border:`2px solid ${active ? p.color : 'rgba(255,255,255,0.15)'}`,
                    background: active ? p.color : 'transparent',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:12, color: active ? '#0d2330' : 'transparent',
                    transition:'all 0.2s', flexShrink:0
                  }}>✓</div>
                </button>

                {/* Roles */}
                {active && (
                  <div style={{
                    display:'flex', gap:8, padding:'0 16px 14px',
                    flexWrap:'wrap',
                    borderTop:'1px solid rgba(255,255,255,0.06)'
                  }}>
                    <div style={{ width:'100%', fontSize:10, color:'rgba(255,255,255,0.3)', letterSpacing:2, textTransform:'uppercase', paddingTop:10, marginBottom:4 }}>Rolle</div>
                    {ROLES.map(role => {
                      const on = personRoles.includes(role)
                      return (
                        <button
                          key={role}
                          onClick={() => toggleRole(p.key, role)}
                          style={{
                            padding:'8px 16px', borderRadius:20, fontSize:13,
                            border:`1.5px solid ${on ? p.color : 'rgba(255,255,255,0.12)'}`,
                            background: on ? p.color : 'rgba(255,255,255,0.04)',
                            color: on ? '#0d2330' : '#8faab5',
                            cursor:'pointer', fontFamily:"'DM Mono',monospace",
                            fontWeight: on ? 600 : 400,
                            transition:'all 0.15s'
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
          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <button
              onClick={onClose}
              style={{
                flex:1, background:'rgba(255,255,255,0.05)',
                border:'1px solid rgba(255,255,255,0.1)',
                color:'#8faab5', padding:'14px', borderRadius:12, fontSize:14
              }}
            >Abbrechen</button>
            <button
              onClick={handleSave}
              style={{
                flex:2, background:'#c9953a', border:'none',
                color:'#0d2330', padding:'14px', borderRadius:12,
                fontSize:14, fontWeight:700,
                boxShadow:'0 4px 16px rgba(201,149,58,0.35)'
              }}
            >Speichern</button>
          </div>
        </div>
      </div>
    </div>
  )
}
