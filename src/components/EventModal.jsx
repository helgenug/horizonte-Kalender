import { useState } from 'react'
import { CATEGORIES } from '../events.js'

export default function EventModal({ event, onSave, onDelete, onClose }) {
  const isNew = !event?.id
  const [form, setForm] = useState({
    date: event?.date || '2026-05-29',
    time: event?.time || '10:00',
    title: event?.title || '',
    location: event?.location || '',
    cat: event?.cat || 'Talk',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="slide-up" style={{ background:'#f2f2f7', borderRadius:'20px 20px 0 0', width:'100%', maxWidth:560, maxHeight:'92vh', overflowY:'auto', paddingBottom:'env(safe-area-inset-bottom, 20px)' }}>

        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 0' }}>
          <div style={{ width:36, height:4, borderRadius:2, background:'#c7c7cc' }} />
        </div>

        <div style={{ padding:'16px 20px 24px' }}>
          <div style={{ fontSize:20, fontWeight:700, color:'#1c1c1e', marginBottom:20 }}>
            {isNew ? 'Neuer Termin' : 'Termin bearbeiten'}
          </div>

          <div style={{ background:'#ffffff', borderRadius:14, overflow:'hidden', marginBottom:12, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            {[
              { label:'Datum', content: <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={{ border:'none', background:'transparent', fontSize:16, padding:'13px 16px', width:'100%' }} /> },
              { label:'Uhrzeit', content: <input type="time" value={form.time} onChange={e => set('time', e.target.value)} style={{ border:'none', background:'transparent', fontSize:16, padding:'13px 16px', width:'100%' }} /> },
            ].map((row, i) => (
              <div key={i}>
                {i > 0 && <div style={{ height:1, background:'#f2f2f7', marginLeft:16 }} />}
                <div style={{ display:'flex', alignItems:'center' }}>
                  <div style={{ fontSize:14, color:'#8e8e93', padding:'0 0 0 16px', minWidth:80 }}>{row.label}</div>
                  {row.content}
                </div>
              </div>
            ))}
          </div>

          <div style={{ background:'#ffffff', borderRadius:14, overflow:'hidden', marginBottom:12, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <input type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Titel" style={{ border:'none', background:'transparent', fontSize:16, padding:'13px 16px', width:'100%' }} />
            <div style={{ height:1, background:'#f2f2f7', marginLeft:16 }} />
            <input type="text" value={form.location} onChange={e => set('location', e.target.value)} placeholder="Ort (optional)" style={{ border:'none', background:'transparent', fontSize:16, padding:'13px 16px', width:'100%', color:'#8e8e93' }} />
          </div>

          <div style={{ background:'#ffffff', borderRadius:14, overflow:'hidden', marginBottom:24, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', alignItems:'center' }}>
              <div style={{ fontSize:14, color:'#8e8e93', padding:'0 0 0 16px', minWidth:100 }}>Kategorie</div>
              <select value={form.cat} onChange={e => set('cat', e.target.value)} style={{ border:'none', background:'transparent', fontSize:16, padding:'13px 16px', flex:1, appearance:'none', color:'#1c1c1e' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display:'flex', gap:10 }}>
            {!isNew && <button onClick={() => onDelete(event.id)} style={{ padding:'14px 16px', borderRadius:12, background:'#fff1f0', border:'1px solid #ffd5d3', color:'#ff3b30', fontSize:15 }}>🗑</button>}
            <button onClick={onClose} style={{ flex:1, padding:'14px', borderRadius:12, background:'#ffffff', border:'1px solid #e5e5ea', color:'#8e8e93', fontSize:15, fontWeight:600 }}>Abbrechen</button>
            <button onClick={() => form.title.trim() && onSave({ ...event, ...form })} style={{ flex:2, padding:'14px', borderRadius:12, background:'#c9953a', border:'none', color:'#fff', fontSize:15, fontWeight:700, boxShadow:'0 4px 12px rgba(201,149,58,0.3)' }}>Speichern</button>
          </div>
        </div>
      </div>
    </div>
  )
}
