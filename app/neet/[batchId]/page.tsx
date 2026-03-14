"use client";
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { useState, useEffect, useMemo, use } from 'react' 
import { createClient } from '@supabase/supabase-js'

type PageProps = { params: Promise<{ batchId: string }> };

export default function BatchDashboard({ params }: PageProps) {
  const { batchId } = use(params);
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  
  // UI States for Drawers and Modals
  const [showNotifs, setShowNotifs] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showStreak, setShowStreak] = useState(false)

  // Data States
  const [notices, setNotices] = useState<any[]>([])
  const [xp, setXp] = useState(0)
  const [streakMinutes, setStreakMinutes] = useState(0) // Logic for 10-min streak

  const supabase = useMemo(() => {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }, []); 

  useEffect(() => { 
    setMounted(true);
    if (session?.user?.email) fetchData();
  }, [batchId, session]);

  const fetchData = async () => {
    // 1. Fetch Notifications
    const { data: nData } = await supabase.from('notices').select('*').eq('batch_id', batchId).order('created_at', { ascending: false });
    if (nData) setNotices(nData);
    
    // 2. Fetch Student Stats
    const { data: sData } = await supabase.from('student_stats').select('xp_points').eq('email', session?.user?.email).single();
    if (sData) setXp(sData.xp_points);

    // 3. Fetch Streak (Today's watch time)
    const today = new Date().toISOString().split('T')[0];
    const { data: aData } = await supabase.from('daily_activity').select('watch_time_minutes').eq('student_email', session?.user?.email).eq('activity_date', today).single();
    if (aData) setStreakMinutes(aData.watch_time_minutes);
  };

  if (status === "loading" || !mounted) return null;
  if (status === "unauthenticated") redirect("/api/auth/signin")

  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'sans-serif', position: 'relative' }}>
      
      {/* TOP ACTION BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 5%', borderBottom: '1px solid #f0f0f0' }}>
        <h2 style={{ fontSize: '18px', margin: 0, color: '#333' }}>Study</h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
          {/* STREAK ICON */}
          <div style={{...iconStatStyle, cursor: 'pointer'}} onClick={() => setShowStreak(true)}>
             <span>🔥</span> <span style={{ fontWeight: 'bold' }}>{streakMinutes >= 10 ? '1' : '0'}</span>
          </div>

          {/* XP / LEADERBOARD ICON */}
          <div style={{...iconStatStyle, cursor: 'pointer'}} onClick={() => setShowLeaderboard(true)}>
             <span style={{ background: '#e3f2fd', color: '#1976d2', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>XP</span> 
             <span style={{ fontWeight: 'bold' }}>{xp}</span>
          </div>

          {/* NOTIFICATION BELL */}
          <div style={{ position: 'relative', cursor: 'pointer', fontSize: '22px' }} onClick={() => setShowNotifs(true)}>
            🔔 {notices.length > 0 && <span style={badgeStyle}>{notices.length}</span>}
          </div>

          <img src={session?.user?.image || ""} style={{ width: '35px', height: '35px', borderRadius: '50%' }} alt="profile" />
        </div>
      </div>

      {/* BANNER SECTION (UPDATED: NO ARROW, NO UPGRADE, NO GIFT) */}
      <div style={{ background: '#1c252e', color: '#fff', margin: '20px 5%', borderRadius: '20px', padding: '50px' }}>
        <span style={{ fontSize: '12px', opacity: 0.7 }}>YOUR BATCH</span>
        <h1 style={{ margin: '10px 0', fontSize: '32px' }}>
          {batchId.replace(/-/g, ' ').toUpperCase()}
        </h1>
      </div>

      {/* OFFERINGS GRID */}
      <main style={{ padding: '0 5%' }}>
        <h3 style={{ fontWeight: '700' }}>Batch Offerings</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {['All Classes', 'All Tests', 'My Doubts', 'Community'].map((item) => (
            <Link key={item} href={item === 'All Classes' ? `/neet/${batchId}/all-classes` : '#'} style={offerCardStyle}>
              <span style={{ fontWeight: '600', color: '#444' }}>{item}</span>
              <span style={{ color: '#ccc' }}>❯</span>
            </Link>
          ))}
        </div>
      </main>

      {/* --- SIDE DRAWERS & MODALS --- */}

      {/* 1. NOTIFICATIONS DRAWER (PIC 2) */}
      {showNotifs && (
        <div style={drawerOverlay} onClick={() => setShowNotifs(false)}>
          <div style={drawerContent} onClick={e => e.stopPropagation()}>
            <div style={drawerHeader}>
              <h3 style={{margin:0}}>Notifications</h3>
              <button onClick={() => setShowNotifs(false)} style={closeBtn}>✕</button>
            </div>
            <div style={{ padding: '10px' }}>
              <div style={{display:'flex', justifyContent:'space-between', padding:'10px'}}>
                <select style={{borderRadius:'20px', padding:'5px 10px', border:'1px solid #ddd'}}><option>{batchId.toUpperCase()}</option></select>
                <button style={{background:'none', border:'1px solid #ddd', borderRadius:'10px', padding:'5px 10px', fontSize:'12px'}}>Mark All Read</button>
              </div>
              {notices.map((n, i) => (
                <div key={i} style={notifItem}>
                  <div style={notifIcon}>📢</div>
                  <div>
                    <div style={{fontWeight: 'bold', fontSize: '14px'}}>{n.content}</div>
                    <div style={{fontSize: '11px', color: '#888'}}>New Update</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. LEADERBOARD DRAWER (PIC 4) */}
      {showLeaderboard && (
        <div style={drawerOverlay} onClick={() => setShowLeaderboard(false)}>
          <div style={drawerContent} onClick={e => e.stopPropagation()}>
            <div style={drawerHeader}>
              <h3 style={{margin:0}}>Leaderboard</h3>
              <button onClick={() => setShowLeaderboard(false)} style={closeBtn}>✕</button>
            </div>
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
               <div style={lockedShieldStyle}>🛡️</div>
               <h3 style={{margin:'20px 0 10px'}}>Leaderboard Locked</h3>
               <p style={{color: '#666', fontSize:'14px'}}>You need {10 - xp > 0 ? 10 - xp : 0} XP to unlock leaderboard!</p>
               <div style={xpInfoBox}>
                 💡 XPs for videos depend on actual watch time. Eg. A 1-hour video at 2x equals 30XP!
               </div>
               <button style={actionBtnFull} onClick={() => setShowLeaderboard(false)}>Earn XP Now</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. STREAK MODAL (PIC 3) */}
      {showStreak && (
        <div style={drawerOverlay}>
          <div style={modalStyle}>
            <button onClick={() => setShowStreak(false)} style={{...closeBtn, float:'right'}}>✕</button>
            <div style={{textAlign: 'center', padding: '20px'}}>
               <div style={circleProgress}>
                  <span style={{fontSize:'24px', fontWeight:'bold', color:'#fbc02d'}}>{streakMinutes}/10</span>
                  <span style={{fontSize: '10px', color:'#999'}}>Minutes</span>
               </div>
               <h2 style={{margin: '20px 0 10px'}}>Restart Your Streak!</h2>
               <p style={{color: '#666', fontSize: '14px', lineHeight:'1.5'}}>It's never too late to begin again. Watch 10 minutes of video to get your restart streak! 🔥</p>
               <button style={actionBtnFull}>Complete My Streak</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- STYLES ---
const iconStatStyle: any = { display: 'flex', alignItems: 'center', gap: '8px', color: '#444', fontSize: '18px' };
const badgeStyle: any = { position: 'absolute', top: '-5px', right: '-8px', background: '#d32f2f', color: '#fff', fontSize: '10px', borderRadius: '50%', padding: '2px 5px', border: '2px solid #fff' };
const offerCardStyle: any = { background: '#fff', padding: '25px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #f0f0f0', textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' };
const drawerOverlay: any = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end', alignItems:'center' };
const drawerContent: any = { width: '400px', height: '100%', background: '#fff', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', animation: 'slideIn 0.3s ease-out' };
const modalStyle: any = { background: '#fff', width: '420px', padding: '30px', borderRadius: '25px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' };
const drawerHeader: any = { padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const closeBtn: any = { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color:'#888' };
const notifItem: any = { display: 'flex', gap: '15px', padding: '15px', borderBottom: '1px solid #f9f9f9', alignItems: 'center' };
const notifIcon: any = { background: '#fff3e0', padding: '12px', borderRadius: '12px', fontSize:'20px' };
const lockedShieldStyle: any = { fontSize: '80px', margin: '0 auto', opacity: 0.8 };
const xpInfoBox: any = { background: '#fff', padding: '20px', borderRadius: '15px', margin: '30px 0', fontSize: '13px', border: '1px solid #fff9c4', boxShadow:'0 4px 12px rgba(0,0,0,0.05)' };
const actionBtnFull: any = { width: '100%', padding: '16px', background: '#6157ff', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' };
const circleProgress: any = { width: '120px', height: '120px', border: '6px solid #fbc02d', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', boxShadow: 'inset 0 0 10px rgba(251,192,45,0.2)' };