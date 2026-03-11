'use client'
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// 1. Safe Jitsi Import (Prevents build errors)
const JitsiMeeting = dynamic(
  () => import('@jitsi/react-sdk').then((mod) => mod.JitsiMeeting),
  { 
    ssr: false, 
    loading: () => <div style={{padding: '50px', textAlign: 'center', color: '#6c63ff'}}>Initializing Classroom...</div> 
  }
)

export default function NeetPage() {
  const { data: session, status } = useSession()
  const [activeRoom, setActiveRoom] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // 2. Handle Mounting & Auth
  useEffect(() => {
    setMounted(true)
  }, [])

  if (status === "unauthenticated") redirect("/login")
  if (status === "loading" || !mounted) {
    return <div style={{ textAlign: 'center', marginTop: '50px', color: '#6c63ff' }}>Loading StudyHub...</div>
  }

  // Security Check: Faculty vs Student
  const isOwner = session?.user?.email === "bhaswarray@gmail.com"

  const batches = [
    {
      id: "ultimate-2026",
      name: "NEET 2026 Ultimate Batch",
      description: "Full syllabus coverage with live daily classes, DPPs, and notes.",
      color: "#6c63ff",
      roomName: "StudyHub_Ultimate_2026_Batch"
    },
    {
      id: "crash-course",
      name: "NEET Crash Course",
      description: "Fast-track revision and high-yield MCQs for last-minute prep.",
      color: "#ff4ecd",
      roomName: "StudyHub_NEET_Crash_Course"
    }
  ]

  return (
    <div style={{ padding: '40px 5%', fontFamily: 'Arial, sans-serif', background: '#f5f7fb', minHeight: '100vh' }}>
      
      {/* HEADER SECTION */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <Link href="/" style={{ color: '#6c63ff', textDecoration: 'none', fontWeight: 'bold' }}>← Back to Home</Link>
          <h1 style={{ marginTop: '10px', color: '#333', fontSize: '32px' }}>NEET Study Portal</h1>
          <p style={{ color: '#666' }}>Welcome back, {session?.user?.name?.split(' ')[0]}!</p>
        </div>
        {isOwner && (
          <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', border: '1px solid #2e7d32', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
            Teacher Mode: Faculty Dashboard
          </div>
        )}
      </header>

      {/* LIVE CLASSROOM (Shows at top when a room is joined) */}
      {activeRoom && (
        <div style={{ marginBottom: '50px', borderRadius: '24px', overflow: 'hidden', background: '#000', height: '650px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', border: '4px solid #fff' }}>
          <div style={{ background: '#222', color: 'white', padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ height: '10px', width: '10px', background: '#ff4757', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
              <b>Live Class: {activeRoom.replace(/_/g, ' ')}</b>
            </span>
            <button onClick={() => setActiveRoom(null)} style={{ background: '#ff4757', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '8px', padding: '8px 16px', fontWeight: 'bold' }}>Leave Classroom</button>
          </div>
          <JitsiMeeting
            domain="meet.jit.si"
            roomName={activeRoom}
            userInfo={{ displayName: session?.user?.name || "Student" }}
            interfaceConfigOverwrite={{
              TOOLBAR_BUTTONS: ['microphone', 'camera', 'chat', 'raisehand', 'tileview', 'desktop', 'settings'],
            }}
            getIFrameRef={(node) => { if (node) node.style.height = '100%'; }}
          />
        </div>
      )}

      {/* BATCH GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
        {batches.map((batch) => (
          <div key={batch.id} style={{ background: 'white', borderRadius: '24px', padding: '35px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', borderTop: `8px solid ${batch.color}`, transition: 'transform 0.3s ease' }}>
            <h3 style={{ fontSize: '24px', marginBottom: '12px', color: batch.color }}>{batch.name}</h3>
            <p style={{ color: '#555', lineHeight: '1.6', marginBottom: '30px', fontSize: '15px' }}>{batch.description}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button style={{ padding: '14px', borderRadius: '12px', border: '1px solid #eee', background: '#fafafa', color: '#444', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>
                📂 Study Materials & PYQs
              </button>

              <button 
                onClick={() => setActiveRoom(batch.roomName)} 
                style={{ 
                  padding: '14px', 
                  borderRadius: '12px', 
                  border: isOwner ? 'none' : `2px solid ${batch.color}`, 
                  background: isOwner ? batch.color : 'transparent', 
                  color: isOwner ? 'white' : batch.color, 
                  fontWeight: 'bold', 
                  cursor: 'pointer',
                  boxShadow: isOwner ? `0 10px 20px -5px ${batch.color}66` : 'none'
                }}>
                {isOwner ? "🚀 Start Live Session" : "📺 Join Live Classroom"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <footer style={{ marginTop: '50px', textAlign: 'center', borderTop: '1px solid #ddd', paddingTop: '20px', color: '#999', fontSize: '14px' }}>
        © 2026 StudyHub NEET Portal | Admin: Bhaswar Ray
      </footer>

      <style jsx global>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
