'use client'
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// Safe initialization
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export default function NeetPage() {
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const [liveStatuses, setLiveStatuses] = useState<Record<string, boolean>>({})

  const isOwner = session?.user?.email === "bhaswarray@gmail.com"

  useEffect(() => {
    setMounted(true)
    if (!supabase) return;

    // Fetch initial status
    const fetchStatus = async () => {
      const { data } = await supabase.from('class_status').select('*')
      if (data) {
        const statusMap = data.reduce((acc: any, curr: any) => ({ ...acc, [curr.id]: curr.is_live }), {})
        setLiveStatuses(statusMap)
      }
    }
    fetchStatus()

    // Realtime subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'class_status' }, (payload) => {
        setLiveStatuses(prev => ({ ...prev, [payload.new.id]: payload.new.is_live }))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const toggleClassStatus = async (batchId: string, currentStatus: boolean) => {
    if (!isOwner || !supabase) return
    await supabase.from('class_status').update({ is_live: !currentStatus }).eq('id', batchId)
  }

  const handleJoinClass = (roomBaseName: string) => {
    const today = new Date().toISOString().split('T')[0]; 
    const finalRoomName = `${roomBaseName}_${today}`;
    const config = isOwner 
      ? "#config.startWithAudioMuted=false"
      : "#config.startWithAudioMuted=true&config.prejoinPageEnabled=true";

    window.open(`https://meet.jit.si/${finalRoomName}${config}`, '_blank', 'noopener,noreferrer');
  };

  if (status === "unauthenticated") redirect("/api/auth/signin")
  if (status === "loading" || !mounted) return <div style={{textAlign:'center', marginTop:'50px'}}>Loading Portal...</div>

  const batches = [
    { id: "ultimate-2026", name: "NEET 2026 Ultimate Batch", color: "#6c63ff", roomName: "StudyHub_Ultimate_Bhaswar" },
    { id: "crash-course", name: "NEET Crash Course", color: "#ff4ecd", roomName: "StudyHub_Crash_Bhaswar" }
  ]

  return (
    <div style={{ padding: '40px 5%', fontFamily: 'sans-serif', background: '#f5f7fb', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div>
          <Link href="/" style={{ color: '#6c63ff', textDecoration: 'none' }}>← Home</Link>
          <h1 style={{ color: '#333' }}>NEET Study Portal</h1>
        </div>
        {isOwner && <div style={{ color: '#2e7d32', fontWeight: 'bold' }}>Faculty Mode</div>}
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
        {batches.map((batch) => {
          const isLive = liveStatuses[batch.id] || false;
          return (
            <div key={batch.id} style={{ background: 'white', padding: '30px', borderRadius: '20px', borderTop: `8px solid ${batch.color}` }}>
              <h3>{batch.name} {isLive && <span style={{ color: 'red', fontSize: '12px' }}>● LIVE</span>}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                <button 
                  onClick={() => isOwner ? toggleClassStatus(batch.id, isLive) : (isLive && handleJoinClass(batch.roomName))}
                  disabled={!isOwner && !isLive}
                  style={{ 
                    padding: '12px', borderRadius: '10px', border: 'none', cursor: (isOwner || isLive) ? 'pointer' : 'not-allowed',
                    background: isOwner ? (isLive ? '#ff4757' : batch.color) : (isLive ? '#ff4757' : '#ccc'),
                    color: 'white', fontWeight: 'bold'
                  }}>
                  {isOwner ? (isLive ? "End Session" : "Start Session") : (isLive ? "Join Now" : "Waiting...")}
                </button>
                {isOwner && isLive && (
                  <button onClick={() => handleJoinClass(batch.roomName)} style={{ padding: '10px', borderRadius: '10px', border: '1px solid #ccc', cursor: 'pointer' }}>
                    Enter Meeting Room
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}