import { useState } from 'react'

const COLORS = ['#ff6b35','#007aff','#af52de','#34c759','#ff9500','#ff3b30','#00c7be','#5856d6','#ff2d55','#30b0c7']

export default function PersonsModal({ persons, onSave, onClose }) {
  const [list, setList] = useState(JSON.parse(JSON.stringify(persons)))
  const [newName, setNewName] = useState('')

  const addPerson = () => {
    if (!newName.trim()) return
    const key = newName.trim().slice(0,2).toUpperCase()
    const color = COLORS[list.length % COLORS.length]
    setList(prev => [...prev, { key, name: newName.trim(), color }])
    setNewName('')
  }

  const removePerson = (key) => setList(prev => prev.filter(p => p.key !== key))

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="slide-up" style={{ background:'#f2f2f7', borderRadius:'20px 20px 0 0', width:'100%', maxWidth:560, maxHeight:'85vh', overflowY:'auto', paddingBottom:'env(safe-area-inset-bottom, 20px)' }}>

        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 0' }}>
          <div style={{ width:36, height:4, borderRadius:2, background:'#c7c7cc' }} />
        </div>

        <div style={{ padding:'16px 20px 24px' }}>
          <div style={{ fontSize:20, fontWeight:700, color:'#1c1c1e', marginBottom:20 }}>Team verwalten</div>

          <div style={{ background:'#ffffff', borderRadius:14, overflow:'hidden', marginBottom:12, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            {list.map((p, i) => (
              <div key={p.key}>
                {i > 0 && <div style={{ height:1, background:'#f2f2f7', marginLeft:60 }} />}
                <div style={{ display:'flex', alignItems:'center', padding:'12px 16px', gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:18, background:p.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'white', flexShrink:0 }}>{p.key}</div>
                  <span style={{ flex:1, fontSize:16, fontWeight:500, color:'#1c1c1e' }}>{p.name}</span>
                  <button onClick={() => removePerson(p.key)} style={{ width:28, height:28, borderRadius:14, background:'#ff3b3015', border:'none', color:'#ff3b30', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background:'#ffffff', borderRadius:14, overflow:'hidden', marginBottom:24, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', display:'flex' }}>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPerson()}
              placeholder="Person hinzufügen…"
              style={{ flex:1, border:'none', background:'transparent', padding:'13px 16px', fontSize:16 }}
            />
            <button onClick={addPerson} style={{ padding:'0 16px', background:'transparent', border:'none', color:'#c9953a', fontSize:15, fontWeight:700 }}>+ Add</button>
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onClose} style={{ flex:1, padding:'14px', borderRadius:12, background:'#ffffff', border:'1px solid #e5e5ea', color:'#8e8e93', fontSize:15, fontWeight:600 }}>Abbrechen</button>
            <button onClick={() => onSave(list)} style={{ flex:2, padding:'14px', borderRadius:12, background:'#c9953a', border:'none', color:'#fff', fontSize:15, fontWeight:700 }}>Speichern</button>
          </div>
        </div>
      </div>
    </div>
  )
}
