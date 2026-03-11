'use client'
import { signIn } from "next-auth/react"

export default function LoginPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
      <h1>Welcome Back</h1>
      <p>Please sign in to continue</p>
      
      {/* This button triggers the Google flow you set up in Phase 2 */}
      <button 
        onClick={() => signIn('google', { callbackUrl: '/' })}
        style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#4285F4', color: 'white', border: 'none', borderRadius: '5px' }}
      >
        Sign in with Google
      </button>
    </div>
  )
}
