'use client'
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from 'react'

export default function NeetPage() {
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 1. Auth Guard
  if (status === "unauthenticated") redirect("/api/auth/signin")
  
  if (status === "loading" || !mounted) {
    return <div style={{ textAlign: 'center', marginTop: '50px', color: '#6c63ff' }}>Loading StudyHub...</div>
  }

  const isOwner = session?.user?.email === "bhaswarray@gmail.com"

  // 2. Classroom Launcher with Security Logic
  const handleJoinClass = (roomBaseName: string) => {
    // Generate a daily-unique room name so students can't camp in old rooms
    const today = new Date().toISOString().split('T')[0]; 
    const finalRoomName = `${roomBaseName}_${today}`;
    
    // Jitsi Config: If owner, join with full access. If student, start muted.
    // Note: On free Jitsi, the first person in is moderator. 
    // This config helps you stay in control if you arrive first.
    const config = isOwner 
      ? "#config.startWithAudioMuted=false&config.startWithVideoMuted=false"
      : "#config.startWithAudioMuted=true&config.startWithVideoMuted=true&config.prejoinPageEnabled=true";

    const jitsiUrl = `https://meet.jit.si/${finalRoomName}${config}`;
    window.open(jitsiUrl, '_blank', 'noopener,noreferrer');
  };

  const batches = [
    {
      id: "ultimate-2026",
      name: "NEET 2026 Ultimate Batch",
      description: "Full syllabus coverage with live daily classes, DPPs, and notes.",
      color: "#6c63ff",
      roomName: "StudyHub_Ultimate_Batch_Bhaswar" 
    },
    {
      id: "crash-course",
      name: "NEET Crash Course",
      description: "Fast-track revision and high-yield MCQs for last-minute prep.",
      color: "#ff4ecd",
      roomName: "StudyHub_Crash_Course_Bhaswar"
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
          <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', border: '1px solid #2e7d32' }}>
            Teacher Mode: Faculty Dashboard
          </div>
        )}
      </header>

      {/* BATCH GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
        {batches.map((batch) => (
          <div key={batch.id} style={{ background: 'white', borderRadius: '24px', padding: '35px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', borderTop: `8px solid ${batch.color}` }}>
            <h3 style={{ fontSize: '24px', marginBottom: '12px', color: batch.color }}>{batch.name}</h3>
            <p style={{ color: '#555', lineHeight: '1.6', marginBottom: '30px', fontSize: '15px' }}>{batch.description}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button style={{ padding: '14px', borderRadius: '12px', border: '1px solid #eee', background: '#fafafa', color: '#444', fontWeight: 'bold', cursor: 'pointer' }}>
                📂 Study Materials & PYQs
              </button>

              <button 
                onClick={() => handleJoinClass(batch.roomName)} 
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
    </div>
  )
}