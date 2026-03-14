"use client";
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import NoticeBoard from '../../components/NoticeBoard'
import Leaderboard from '../../components/Leaderboard'
import Link from 'next/link'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function BatchDetailsPage() {
  const { batchId } = useParams()
  const { data: session } = useSession()
  const [materials, setMaterials] = useState<any[]>([])
  const [liveStatus, setLiveStatus] = useState(false)
  
  const isOwner = session?.user?.email === "bhaswarray@gmail.com"
  const batchName = batchId === "ultimate-2026" ? "Yakeen NEET 2026" : "NEET Crash Course 2026"

  useEffect(() => {
    const fetchData = async () => {
      const { data: mats } = await supabase.from('materials').select('*').eq('batch_id', batchId)
      if (mats) setMaterials(mats)
      
      const { data: status } = await supabase.from('class_status').select('is_live').eq('id', batchId).single()
      if (status) setLiveStatus(status.is_live)
    }
    fetchData()
  }, [batchId])

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fb' }}>
      {/* Header with Batch Name */}
      <header style={{ background: '#6c63ff', padding: '40px 5%', color: 'white' }}>
        <Link href="/neet" style={{ color: '#fff', textDecoration: 'none', fontSize: '14px' }}>← Back to Batches</Link>
        <h1 style={{ margin: '10px 0 0 0' }}>{batchName}</h1>
      </header>

      <div style={{ padding: '40px 5%', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '30px' }}>
        <div>
          <h4 style={{ color: '#666', marginBottom: '15px' }}>Batch Offerings</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
            <div style={tileStyle}>📚 All Classes</div>
            <div style={tileStyle}>📝 All Tests</div>
            <div style={tileStyle}>❓ My Doubts</div>
            <div style={tileStyle}>👥 Community</div>
          </div>

          <h4 style={{ color: '#666', marginBottom: '15px' }}>Study Zone</h4>
          {['Physics', 'Chemistry', 'Biology'].map(sub => (
            <details key={sub} style={folderStyle}>
              <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>📂 {sub}</summary>
              <div style={{ marginTop: '10px' }}>
                {materials.filter(m => m.subject === sub).map(m => (
                  <div key={m.id} style={materialItemStyle}>
                    <span>{m.title}</span>
                    <div>{m.video_url && '🎥'} {m.notes_url && '📄'}</div>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>

        {/* Components move here so they are only seen on this page */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <NoticeBoard category="neet" isOwner={isOwner} />
          <Leaderboard category="neet" />
        </div>
      </div>
    </div>
  )
}

const tileStyle = { background: '#fff', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', fontWeight: 'bold' };
const folderStyle = { background: '#fff', padding: '15px', borderRadius: '12px', marginBottom: '10px', border: '1px solid #eee' };
const materialItemStyle = { display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #f0f0f0', fontSize: '14px' };