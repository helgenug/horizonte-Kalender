import { useState, useRef } from 'react'

export default function ProfileModal({ person, profile, onSave, onClose }) {
  const [bio, setBio]         = useState(profile?.bio || '')
  const [role, setRole]       = useState(profile?.role || '')
  const [photo, setPhoto]     = useState(profile?.photo || null)
  const [saving, setSaving]   = useState(false)
  const fileRef               = useRef()

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPhoto(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    setSaving(true)
    onSave({ bio, role, photo })
  }

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="slide-up" style={{ background:'#f2f2f7', borderRadius:'20px 20px 0 0', width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto', paddingBottom:'env(safe-area-inset-bottom, 20px)' }}>

        {/* Handle */}
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 0' }}>
          <div style={{ width:36, height:4, borderRadius:2, background:'#c7c7cc' }} />
        </div>

        <div style={{ padding:'16px 20px 24px' }}>

          {/* Photo + name header */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:28 }}>
            <div
              onClick={() => fileRef.current.click()}
              style={{
                width:96, height:96, borderRadius:48,
                background: photo ? 'transparent' : `${person.color}20`,
                border: `3px solid ${person.color}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', overflow:'hidden', marginBottom:12,
                position:'relative'
              }}
            >
              {photo
                ? <img src={photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <span style={{ fontSize:36 }}>📷</span>
              }
              <div style={{
                position:'absolute', bottom:0, left:0, right:0,
                background:'rgba(0,0,0,0.4)', padding:'4px 0',
                fontSize:10, color:'white', textAlign:'center', fontWeight:600
              }}>Ändern</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display:'none' }} />
            <div style={{ fontSize:22, fontWeight:800, color: person.color }}>{person.name}</div>
            <div style={{ fontSize:13, color:'#8e8e93', marginTop:2 }}>Profil bearbeiten</div>
          </div>

          {/* Role */}
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:11, color:'#8e8e93', textTransform:'uppercase', letterSpacing:1, fontWeight:600, marginBottom:6 }}>Rolle / Funktion</div>
            <div style={{ background:'#ffffff', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              <input
                type="text"
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="z.B. Fotograf, Videograf, Social Media…"
                style={{ border:'none', background:'transparent', padding:'13px 16px', fontSize:15, width:'100%' }}
              />
            </div>
          </div>

          {/* Bio */}
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:11, color:'#8e8e93', textTransform:'uppercase', letterSpacing:1, fontWeight:600, marginBottom:6 }}>Über mich</div>
            <div style={{ background:'#ffffff', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Kurze Beschreibung, Spezialgebiet, Ausrüstung…"
                rows={4}
                style={{ border:'none', background:'transparent', padding:'13px 16px', fontSize:15, width:'100%', resize:'none', lineHeight:1.5 }}
              />
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onClose} style={{ flex:1, padding:'14px', borderRadius:12, background:'#ffffff', border:'1px solid #e5e5ea', color:'#8e8e93', fontSize:15, fontWeight:600 }}>
              Abbrechen
            </button>
            <button onClick={handleSave} disabled={saving} style={{ flex:2, padding:'14px', borderRadius:12, background: person.color, border:'none', color:'#fff', fontSize:15, fontWeight:700, opacity: saving ? 0.7 : 1, boxShadow:`0 4px 12px ${person.color}40` }}>
              {saving ? 'Wird gespeichert…' : 'Speichern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
