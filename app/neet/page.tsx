'use client'
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// Safe Initialization: Prevents build-time crashes if keys are missing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export default function NeetPage() {
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const [liveStatuses, setLiveStatuses] = useState<Record<string, boolean>>({})

  const isOwner = session?.user?.email === "bhaswarray@gmail.com"

  useEffect(() => {
    setMounted(true)
    if (!supabase) return;

    fetchInitialStatus()

    // Realtime listener for status changes
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'class_status' }, 
        (payload) => {
          setLiveStatuses(prev => ({ ...prev, [payload.new.id]: payload.new.is_live }))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const fetchInitialStatus = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('class_status').select('*')
    if (data) {
      const statusMap = data.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.is_live }), {})
      setLiveStatuses(statusMap)
    }
  }

  const toggleClassStatus = async (batchId: string, currentStatus: boolean) => {
    if (!isOwner || !supabase) return
    await supabase.from('class_status').update({ is_live: !currentStatus }).eq('id', batchId)
  }

  const handleJoinClass = (roomBaseName: string) => {
    const today = new Date().toISOString().split('T')[0]; 
    const finalRoomName = `${roomBaseName}_${today}`;
    const config = isOwner 
      ? "#config.startWithAudioMuted=false&config.startWithVideoMuted=false"
      : "#config.startWithAudioMuted=true&config.startWithVideoMuted=true&config.prejoinPageEnabled=true";

    window.open(`https://meet.jit.si/${finalRoomName}${config}`, '_blank', 'noopener,noreferrer');
  };

  if (status === "unauthenticated") redirect("/api/auth/signin")
  if (status === "loading" || !mounted) return <div style={{textAlign:'center', marginTop:'50px', color: '#6c63ff'}}>Loading StudyHub...</div>

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
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <Link href="/" style={{ color: '#6c63ff', textDecoration: 'none', fontWeight: 'bold' }}>← Back to Home</Link>
          <h1 style={{ marginTop: '10px', color: '#333', fontSize: '32px' }}>NEET Study Portal</h1>
          <p style={{ color: '#666' }}>Welcome back, {session?.user?.name?.split(' ')[0]}!</p>
        </div>
        {isOwner && (
          <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', border: '1px solid #2e7d32' }}>
            Faculty Dashboard Active
          </div>
        )}
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
        {batches.map((batch) => {
          const isLive = liveStatuses[batch.id] || false;
          return (
            <div key={batch.id} style={{ background: 'white', borderRadius: '24px', padding: '35px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', borderTop: `8px solid ${batch.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '24px', marginBottom: '12px', color: batch.color }}>{batch.name}</h3>
                {isLive && (
                   <span style={{ background: '#ff4757', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold' }}>LIVE</span>
                )}
              </div>
              <p style={{ color: '#555', lineHeight: '1.6', marginBottom: '30px', fontSize: '15px' }}>{batch.description}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button style={{ padding: '14px', borderRadius: '12px', border: '1px solid #eee', background: '#fafafa', color: '#444', fontWeight: 'bold', cursor: 'pointer' }}>
                  📂 Study Materials & PYQs
                </button>

                <button 
                  onClick={async () => {
                    if (isOwner) {
                      await toggleClassStatus(batch.id, isLive);
                      if (!isLive) handleJoinClass(batch.roomName);
                    } else if (isLive) {
                      handleJoinClass(batch.roomName);
                    }
                  }}
                  disabled={!isOwner && !isLive}
                  style={{ 
                    padding: '14px', 
                    borderRadius: '12px', 
                    border: 'none',
                    background: isOwner ? (isLive ? '#ff4757' : batch.color) : (isLive ? '#ff4757' : '#ddd'), 
                    color: 'white', 
                    fontWeight: 'bold', 
                    cursor: (!isOwner && !isLive) ? 'not-allowed' : 'pointer',
                    boxShadow: (isOwner || isLive) ? `0 10px 20px -5px ${isLive ? '#ff4757' : batch.color}66` : 'none'
                  }}>
                  {isOwner ? (isLive ? "🛑 End Session" : "🚀 Start Live Session") : (isLive ? "📺 Join Live Classroom" : "🕒 Waiting for Teacher...")}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <footer style={{ marginTop: '50px', textAlign: 'center', borderTop: '1px solid #ddd', paddingTop: '20px', color: '#999', fontSize: '14px' }}>
        © 2026 StudyHub NEET Portal | Admin: Bhaswar Ray
      </footer>
    </div>
  )
}