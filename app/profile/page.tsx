'use client'
import { useSession } from "next-auth/react"
import { useState } from "react"
import Link from "next/link"

export default function ProfilePage() {
  const { data: session } = useSession()
  const [username, setUsername] = useState("")

  if (!session) return <div style={{padding: '50px', textAlign: 'center'}}><h1>Please log in to view this page.</h1><Link href="/">Go Home</Link></div>

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial' }}>
      <Link href="/" style={{ color: '#6a1b9a', textDecoration: 'none' }}>← Back to Home</Link>
      
      <h1 style={{ marginTop: '20px' }}>Your Study Profile</h1>
      <p style={{ color: 'gray' }}>Email: {session.user?.email}</p>

      <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <label><strong>Set Username</strong></label>
        <input 
          type="text" 
          placeholder="e.g. FutureDoctor2026" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
        />

        <label><strong>Target Exam</strong></label>
        <select style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}>
          <option>NEET</option>
          <option>JEE</option>
          <option>Boards</option>
        </select>

        <button 
          onClick={() => alert('Profile Updated!')}
          style={{ padding: '15px', background: '#6a1b9a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Save Profile Changes
        </button>
      </div>
    </div>
  )
}
