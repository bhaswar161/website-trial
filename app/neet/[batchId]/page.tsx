"use client";
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { useState, useEffect, useMemo, use } from 'react' 
import { createClient } from '@supabase/supabase-js'

type PageProps = {
  params: Promise<{ batchId: string }>;
};

export default function BatchDashboard({ params }: PageProps) {
  const { batchId } = use(params);
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  
  const [notices, setNotices] = useState<any[]>([])
  const [xp, setXp] = useState(0)

  const supabase = useMemo(() => {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }, []); 

  const isOwner = session?.user?.email === "bhaswarray@gmail.com"

  useEffect(() => { 
    setMounted(true);
    fetchData();
  }, [batchId]);

  const fetchData = async () => {
    const { data: nData } = await supabase.from('notices').select('*').eq('batch_id', batchId);
    if (nData) setNotices(nData);
    
    const { data: sData } = await supabase.from('student_stats').select('xp_points').eq('email', session?.user?.email).single();
    if (sData) setXp(sData.xp_points);
  };

  if (status === "loading" || !mounted) return <p style={{textAlign:'center', marginTop:'50px'}}>Loading...</p>
  if (status === "unauthenticated") redirect("/api/auth/signin")

  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* TOP ACTION BAR (AS PER YOUR PIC) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 5%', borderBottom: '1px solid #f0f0f0' }}>
        <h2 style={{ fontSize: '18px', margin: 0, color: '#333' }}>Study</h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
          <span style={{ cursor: 'pointer', fontSize: '20px' }}>🎁</span>
          
          <div style={iconStatStyle}>
             <span>🔥</span> <span style={{ fontWeight: 'bold' }}>0</span>
          </div>

          <div style={iconStatStyle}>
             <span style={{ background: '#e3f2fd', color: '#1976d2', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>XP</span> 
             <span style={{ fontWeight: 'bold' }}>{xp}</span>
          </div>

          {/* NOTIFICATION BELL WITH BADGE */}
          <div style={{ position: 'relative', cursor: 'pointer', fontSize: '22px' }}>
            🔔
            {notices.length > 0 && (
              <span style={badgeStyle}>{notices.length}</span>
            )}
          </div>

          <img src={session?.user?.image || ""} style={{ width: '35px', height: '35px', borderRadius: '50%', border: '2px solid #6c63ff' }} alt="profile" />
        </div>
      </div>

      {/* BANNER SECTION */}
      <div style={{ background: 'linear-gradient(135deg, #2c3e50, #000)', color: '#fff', margin: '20px 5%', borderRadius: '20px', padding: '50px' }}>
        <span style={{ fontSize: '12px', opacity: 0.7 }}>YOUR BATCH</span>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: '10px 0', fontSize: '32px' }}>{batchId.replace(/-/g, ' ').toUpperCase()} ▾</h1>
          <button style={{ padding: '12px 25px', borderRadius: '25px', background: '#fff', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
            UPGRADE <span style={{ color: '#fbc02d' }}>PLAN</span>
          </button>
        </div>
      </div>

      {/* OFFERINGS SECTION */}
      <main style={{ padding: '0 5%' }}>
        <h3>Batch Offerings</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <Link href={`/neet/${batchId}/all-classes`} style={offerCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '24px', color: '#6c63ff' }}>📘</span>
              <span style={{ fontWeight: '600', color: '#444' }}>All Classes</span>
            </div>
            <span style={{ color: '#ccc' }}>❯</span>
          </Link>
          
          <Link href="#" style={offerCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '24px', color: '#1976d2' }}>📝</span>
              <span style={{ fontWeight: '600', color: '#444' }}>All Tests</span>
            </div>
            <span style={{ color: '#ccc' }}>❯</span>
          </Link>

          <Link href="#" style={offerCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '24px', color: '#ff9800' }}>❓</span>
              <span style={{ fontWeight: '600', color: '#444' }}>My Doubts</span>
            </div>
            <span style={{ color: '#ccc' }}>❯</span>
          </Link>

          <Link href="#" style={offerCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '24px', color: '#4caf50' }}>👥</span>
              <span style={{ fontWeight: '600', color: '#444' }}>Community</span>
            </div>
            <span style={{ color: '#ccc' }}>❯</span>
          </Link>
        </div>
      </main>

    </div>
  )
}

// STYLES
const iconStatStyle: any = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  color: '#444',
  fontSize: '18px'
};

const badgeStyle: any = {
  position: 'absolute',
  top: '-5px',
  right: '-5px',
  background: '#d32f2f',
  color: '#fff',
  fontSize: '10px',
  borderRadius: '50%',
  width: '18px',
  height: '18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  border: '2px solid #fff'
};

const offerCardStyle: any = {
  background: '#fff',
  padding: '25px',
  borderRadius: '15px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  border: '1px solid #f0f0f0',
  textDecoration: 'none',
  boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
};