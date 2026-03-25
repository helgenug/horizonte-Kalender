import { useState, useEffect } from 'react'

const CORRECT_PIN = '2026'
const STORAGE_KEY = 'hz_unlocked'

export default function PinLock({ children }) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(STORAGE_KEY) === 'yes')
  const [pin, setPin] = useState('')
  const [shake, setShake] = useState(false)
  const [attempts, setAttempts] = useState(0)

  const handleDigit = (d) => {
    if (pin.length >= 4) return
    const next = pin + d
    setPin(next)
    if (next.length === 4) {
      setTimeout(() => {
        if (next === CORRECT_PIN) {
          sessionStorage.setItem(STORAGE_KEY, 'yes')
          setUnlocked(true)
        } else {
          setShake(true)
          setAttempts(a => a + 1)
          setTimeout(() => { setShake(false); setPin('') }, 600)
        }
      }, 120)
    }
  }

  const handleDelete = () => setPin(p => p.slice(0, -1))

  if (unlocked) return children

  return (
    <div style={{
      minHeight:'100vh', background:'#f2f2f7',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      padding:24, userSelect:'none'
    }}>
      {/* Logo area */}
      <div style={{ textAlign:'center', marginBottom:48 }}>
        <div style={{ fontSize:44, marginBottom:12 }}>📸</div>
        <div style={{ fontSize:26, fontWeight:700, color:'#1c1c1e', letterSpacing:-0.5 }}>
          Horizonte Zingst
        </div>
        <div style={{ fontSize:14, color:'#8e8e93', marginTop:4 }}>2026 · Team-Kalender</div>
      </div>

      {/* PIN dots */}
      <div style={{
        display:'flex', gap:20, marginBottom:40,
        animation: shake ? 'shake 0.5s ease' : 'none'
      }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width:16, height:16, borderRadius:8,
            background: i < pin.length ? '#1c1c1e' : '#d1d1d6',
            transition:'background 0.15s, transform 0.15s',
            transform: i < pin.length ? 'scale(1.15)' : 'scale(1)'
          }} />
        ))}
      </div>

      {attempts > 0 && (
        <div style={{ fontSize:13, color:'#ff3b30', marginBottom:24, fontWeight:500 }}>
          Falscher PIN — versuch es nochmal
        </div>
      )}

      {/* Numpad */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 76px)', gap:12 }}>
        {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((d, i) => (
          <button
            key={i}
            onClick={() => d === '⌫' ? handleDelete() : d !== '' ? handleDigit(String(d)) : null}
            disabled={d === ''}
            style={{
              width:76, height:76, borderRadius:38,
              background: d === '' ? 'transparent' : d === '⌫' ? '#e5e5ea' : '#ffffff',
              border:'none',
              boxShadow: d === '' ? 'none' : '0 2px 8px rgba(0,0,0,0.1)',
              fontSize: d === '⌫' ? 20 : 24,
              fontWeight: d === '⌫' ? 400 : 300,
              color: '#1c1c1e',
              cursor: d === '' ? 'default' : 'pointer',
              transition:'transform 0.1s, background 0.1s',
              WebkitTapHighlightColor:'transparent'
            }}
            onMouseDown={e => { if(d !== '') e.currentTarget.style.transform = 'scale(0.93)'; e.currentTarget.style.background = d === '⌫' ? '#d1d1d6' : '#f2f2f7' }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = d === '⌫' ? '#e5e5ea' : '#ffffff' }}
            onTouchStart={e => { if(d !== '') e.currentTarget.style.transform = 'scale(0.93)'; e.currentTarget.style.background = d === '⌫' ? '#d1d1d6' : '#f2f2f7' }}
            onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = d === '⌫' ? '#e5e5ea' : '#ffffff' }}
          >{d}</button>
        ))}
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-10px); }
          40%     { transform: translateX(10px); }
          60%     { transform: translateX(-8px); }
          80%     { transform: translateX(8px); }
        }
      `}</style>
    </div>
  )
}
