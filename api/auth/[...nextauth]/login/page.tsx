'use client'
import { signIn } from "next-auth/react"

export default function LoginPage() {
  return (
    <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
      <h1>Sign In</h1>
      <button 
        onClick={() => signIn('google')} 
        style={{
          padding: '12px 24px',
          backgroundColor: '#4285F4',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          cursor: 'pointer'
        }}
      >
        Continue with Google
      </button>
    </div>
  )
}
