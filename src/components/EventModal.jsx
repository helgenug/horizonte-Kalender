import { useState } from 'react'
import { CATEGORIES } from '../events.js'

export default function EventModal({ event, onSave, onDelete, onClose }) {
  const isNew = !event?.id
  const [form, setForm] = useState({
    date:     event?.date     || '2026-05-29',
    time:     event?.time     || '10:00',
    title:    event?.title    || '',
    location: event?.location || '',
    cat:      event?.cat      || 'Talk',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div
      style={{
        position:'fixed', inset:0,
        background:'rgba(0,0,0,0.7)',
        backdropFilter:'blur(6px)',
        display:'flex', alignItems:'flex-end', justifyContent:'center',
        zIndex:1000
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
          maxHeight:'92vh', overflowY:'auto',
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
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:'#faf7f0', fontStyle:'italic', marginBottom:22 }}>
            {isNew ? 'Neuer Termin' : 'Termin bearbeiten'}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <div>
              <div style={{ fontSize:10, letterSpacing:2, color:'#8faab5', textTransform:'uppercase', marginBottom:6 }}>Datum</div>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize:10, letterSpacing:2, color:'#8faab5', textTransform:'uppercase', marginBottom:6 }}>Uhrzeit</div>
              <input type="time" value={form.time} onChange={e => set('time', e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:10, letterSpacing:2, color:'#8faab5', textTransform:'uppercase', marginBottom:6 }}>Titel</div>
            <input type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Titel des Termins" />
          </div>

          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:10, letterSpacing:2, color:'#8faab5', textTransform:'uppercase', marginBottom:6 }}>Ort</div>
            <input type="text" value={form.location} onChange={e => set('location', e.target.value)} placeholder="z.B. Meeting Point" />
          </div>

          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:10, letterSpacing:2, color:'#8faab5', textTransform:'uppercase', marginBottom:6 }}>Kategorie</div>
            <select value={form.cat} onChange={e => set('cat', e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ display:'flex', gap:10 }}>
            {!isNew && (
              <button
                onClick={() => onDelete(event.id)}
                style={{
                  background:'rgba(200,80,60,0.1)', border:'1px solid rgba(200,80,60,0.3)',
                  color:'#e09080', padding:'14px 16px', borderRadius:12, fontSize:14
                }}
              >🗑</button>
            )}
            <button
              onClick={onClose}
              style={{
                flex:1, background:'rgba(255,255,255,0.05)',
                border:'1px solid rgba(255,255,255,0.1)',
                color:'#8faab5', padding:'14px', borderRadius:12, fontSize:14
              }}
            >Abbrechen</button>
            <button
              onClick={() => form.title.trim() && onSave({ ...event, ...form })}
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
