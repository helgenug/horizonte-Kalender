export default function ProfileView({ person, profile, onEdit, onClose }) {
  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="slide-up" style={{ background:'#f2f2f7', borderRadius:'20px 20px 0 0', width:'100%', maxWidth:560, paddingBottom:'env(safe-area-inset-bottom, 20px)' }}>

        {/* Handle */}
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 0' }}>
          <div style={{ width:36, height:4, borderRadius:2, background:'#c7c7cc' }} />
        </div>

        <div style={{ padding:'20px 20px 24px' }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
            <div style={{
              width:72, height:72, borderRadius:36,
              background: profile?.photo ? 'transparent' : `${person.color}20`,
              border:`3px solid ${person.color}`,
              overflow:'hidden', flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center'
            }}>
              {profile?.photo
                ? <img src={profile.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <span style={{ fontSize:30 }}>👤</span>
              }
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:24, fontWeight:800, color:person.color, letterSpacing:-0.5 }}>{person.name}</div>
              {profile?.role && <div style={{ fontSize:14, color:'#8e8e93', marginTop:2 }}>{profile.role}</div>}
            </div>
          </div>

          {/* Bio */}
          {profile?.bio ? (
            <div style={{ background:'#ffffff', borderRadius:14, padding:'14px 16px', marginBottom:20, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize:11, color:'#8e8e93', textTransform:'uppercase', letterSpacing:1, fontWeight:600, marginBottom:8 }}>Über mich</div>
              <div style={{ fontSize:15, color:'#1c1c1e', lineHeight:1.5 }}>{profile.bio}</div>
            </div>
          ) : (
            <div style={{ background:'#ffffff', borderRadius:14, padding:'14px 16px', marginBottom:20, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', textAlign:'center' }}>
              <div style={{ fontSize:14, color:'#c7c7cc' }}>Noch kein Profil eingetragen</div>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onClose} style={{ flex:1, padding:'14px', borderRadius:12, background:'#ffffff', border:'1px solid #e5e5ea', color:'#8e8e93', fontSize:15, fontWeight:600 }}>
              Schließen
            </button>
            <button onClick={onEdit} style={{ flex:2, padding:'14px', borderRadius:12, background:person.color, border:'none', color:'#fff', fontSize:15, fontWeight:700, boxShadow:`0 4px 12px ${person.color}40` }}>
              ✏️ Profil bearbeiten
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
