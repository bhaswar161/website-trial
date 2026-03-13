"use client";
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
    
    if (!supabase) {
      console.error("❌ Supabase client failed to initialize. Check your Vercel Environment Variables!");
      return;
    }

    const fetchStatus = async () => {
      const { data, error } = await supabase.from('class_status').select('*')
      if (error) console.error("❌ Error fetching status:", error)
      if (data) {
        const statusMap = data.reduce((acc: any, curr: any) => ({ ...acc, [curr.id]: curr.is_live }), {})
        setLiveStatuses(statusMap)
      }
    }
    fetchStatus()

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'class_status' }, (payload) => {
        setLiveStatuses(prev => ({ ...prev, [payload.new.id]: payload.new.is_live }))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const toggleClassStatus = async (batchId: string, currentStatus: boolean) => {
    if (!supabase) {
      alert("Database not connected. Check Vercel Environment Variables.");
      return;
    }
    
    // Update local state immediately for instant button feedback (Optimistic UI)
    setLiveStatuses(prev => ({ ...prev, [batchId]: !currentStatus }));

    const { error } = await supabase
      .from('class_status')
      .update({ is_live: !currentStatus })
      .eq('id', batchId);

    if (error) {
      console.error("❌ Toggle Error:", error);
      alert("Failed to update database.");
      // Rollback if it fails
      setLiveStatuses(prev => ({ ...prev, [batchId]: currentStatus }));
    }
  };

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
            <div key={batch.id} style={{ background: 'white', padding: '30px', borderRadius: '20px', borderTop: `8px solid ${batch.color}`, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <h3>{batch.name}</h3>
                 {isLive && <span style={{ color: '#ff4757', fontWeight: 'bold', fontSize: '14px' }}>● LIVE</span>}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                <button 
                  onClick={() => isOwner ? toggleClassStatus(batch.id, isLive) : handleJoinClass(batch.roomName)}
                  disabled={!isOwner && !isLive}
                  style={{ 
                    padding: '14px', borderRadius: '12px', border: 'none', 
                    cursor: (isOwner || isLive) ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                    background: isOwner ? (isLive ? '#ff4757' : batch.color) : (isLive ? '#ff4757' : '#e0e0e0'),
                    color: 'white', fontWeight: 'bold', fontSize: '16px'
                  }}>
                  {isOwner ? (isLive ? "🔴 End Session" : "▶ Start Session") : (isLive ? "Join Now" : "Class is Offline")}
                </button>

                {isOwner && isLive && (
                  <button 
                    onClick={() => handleJoinClass(batch.roomName)} 
                    style={{ padding: '12px', borderRadius: '12px', border: '2px solid #6c63ff', background: 'transparent', color: '#6c63ff', fontWeight: 'bold', cursor: 'pointer' }}>
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