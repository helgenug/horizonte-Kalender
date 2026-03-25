import { useState, useEffect } from 'react'
import { CATEGORIES } from '../events.js'

const styles = {
  overlay: {
    position:'fixed', inset:0, background:'rgba(0,0,0,0.75)',
    display:'flex', alignItems:'center', justifyContent:'center',
    zIndex:1000, padding:'20px'
  },
  modal: {
    background:'#0f2a3a', border:'1px solid rgba(201,149,58,0.3)',
    borderRadius:'8px', padding:'28px', width:'100%', maxWidth:'480px',
    maxHeight:'90vh', overflowY:'auto'
  },
  title: {
    fontFamily:"'Playfair Display', serif", fontSize:'22px',
    color:'#faf7f0', marginBottom:'24px', fontStyle:'italic'
  },
  field: { marginBottom:'16px' },
  label: { fontSize:'10px', letterSpacing:'2px', color:'#8faab5', textTransform:'uppercase', display:'block', marginBottom:'6px' },
  row: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' },
  btnRow: { display:'flex', gap:'10px', marginTop:'24px', justifyContent:'flex-end' },
  btnCancel: {
    background:'transparent', border:'1px solid rgba(143,170,181,0.3)',
    color:'#8faab5', padding:'8px 20px', borderRadius:'4px', fontSize:'12px'
  },
  btnSave: {
    background:'#c9953a', border:'none', color:'#0d2330',
    padding:'8px 24px', borderRadius:'4px', fontSize:'12px', fontWeight:'500'
  },
  btnDelete: {
    background:'transparent', border:'1px solid rgba(200,80,60,0.4)',
    color:'#e09080', padding:'8px 16px', borderRadius:'4px', fontSize:'12px', marginRight:'auto'
  }
}

export default function EventModal({ event, onSave, onDelete, onClose }) {
  const isNew = !event?.id
  const [form, setForm] = useState({
    date: event?.date || '2026-05-29',
    time: event?.time || '10:00',
    title: event?.title || '',
    location: event?.location || '',
    cat: event?.cat || 'Talk',
    team: event?.team || []
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.title.trim()) return
    onSave({ ...event, ...form })
  }

  return (
    <div style={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <div style={styles.title}>{isNew ? 'Neuer Termin' : 'Termin bearbeiten'}</div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Datum</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Uhrzeit</label>
            <input type="time" value={form.time} onChange={e => set('time', e.target.value)} />
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Titel</label>
          <input type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Titel des Termins" />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Ort</label>
          <input type="text" value={form.location} onChange={e => set('location', e.target.value)} placeholder="z.B. Meeting Point" />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Kategorie</label>
          <select value={form.cat} onChange={e => set('cat', e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Team</label>
          <div style={{ display:'flex', gap:'8px', marginTop:'4px' }}>
            {[['H','Holger','#e8845a'],['D','David','#5ab8e8'],['I','Ilayda','#a87ee0']].map(([k,name,color]) => (
              <button
                key={k}
                onClick={() => set('team', form.team.includes(k) ? form.team.filter(x=>x!==k) : [...form.team, k])}
                style={{
                  padding:'6px 16px', borderRadius:'4px', fontSize:'12px',
                  border: `1.5px solid ${color}`,
                  background: form.team.includes(k) ? color : 'transparent',
                  color: form.team.includes(k) ? '#0d2330' : color,
                  fontWeight: form.team.includes(k) ? '500' : '400'
                }}
              >{k} · {name}</button>
            ))}
          </div>
        </div>

        <div style={styles.btnRow}>
          {!isNew && <button style={styles.btnDelete} onClick={() => onDelete(event.id)}>Löschen</button>}
          <button style={styles.btnCancel} onClick={onClose}>Abbrechen</button>
          <button style={styles.btnSave} onClick={handleSave}>Speichern</button>
        </div>
      </div>
    </div>
  )
}
