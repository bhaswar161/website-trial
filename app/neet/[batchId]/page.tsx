"use client";
import { useSession, signOut } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { useState, useEffect, useMemo, use } from 'react' 
import { createClient } from '@supabase/supabase-js'

type PageProps = { params: Promise<{ batchId: string }> };

export default function BatchDashboard({ params }: PageProps) {
  const { batchId } = use(params);
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  
  // UI States
  const [showNotifs, setShowNotifs] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showStreak, setShowStreak] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  // Data States
  const [notices, setNotices] = useState<any[]>([])
  const [newNotice, setNewNotice] = useState("")
  const [xp, setXp] = useState(0)
  const [streakMinutes, setStreakMinutes] = useState(0)

  const supabase = useMemo(() => {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }, []); 

  const isOwner = session?.user?.email === "bhaswarray@gmail.com"

  useEffect(() => { 
    setMounted(true);
    if (session?.user?.email) fetchData();
  }, [batchId, session]);

  const fetchData = async () => {
    const { data: nData } = await supabase.from('notices').select('*').eq('batch_id', batchId).order('created_at', { ascending: false });
    if (nData) setNotices(nData);
    const { data: sData } = await supabase.from('student_stats').select('xp_points').eq('email', session?.user?.email).single();
    if (sData) setXp(sData.xp_points);
  };

  const handlePostNotice = async () => {
    if (!newNotice) return;
    const { error } = await supabase.from('notices').insert([{ 
      batch_id: batchId, 
      content: newNotice 
    }]);
    if (!error) {
      setNewNotice("");
      fetchData();
    }
  };

  if (status === "loading" || !mounted) return null;
  if (status === "unauthenticated") redirect("/api/auth/signin")

  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* --- TOP ACTION BAR --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 5%', borderBottom: '1px solid #f0f0f0', position: 'relative', zIndex: 10 }}>
        <h2 style={{ fontSize: '18px', margin: 0, color: '#333' }}>Study</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
          <div style={{...iconStatStyle, cursor: 'pointer'}} onClick={() => setShowStreak(true)}>
             <span>🔥</span> <span style={{ fontWeight: 'bold' }}>{streakMinutes >= 10 ? '1' : '0'}</span>
          </div>
          <div style={{...iconStatStyle, cursor: 'pointer'}} onClick={() => setShowLeaderboard(true)}>
             <span style={{ background: '#e3f2fd', color: '#1976d2', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>XP</span> 
             <span style={{ fontWeight: 'bold' }}>{xp}</span>
          </div>
          <div style={{ position: 'relative', cursor: 'pointer', fontSize: '22px' }} onClick={() => setShowNotifs(true)}>
            🔔 {notices.length > 0 && <span style={badgeStyle}>{notices.length}</span>}
          </div>
          <div style={{ position: 'relative' }}>
            <img 
              src={session?.user?.image || "https://ui-avatars.com/api/?name=" + session?.user?.name} 
              style={{ width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer', border: '1px solid #eee' }} 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              alt="avatar"
            />
            {showProfileMenu && (
              <div style={dropdownStyle}>
                <Link href="/profile" style={dropdownItem}>View Profile</Link>
                <div onClick={() => signOut()} style={{...dropdownItem, color: '#d32f2f'}}>Logout</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- BANNER --- */}
      <div style={{ background: '#1c252e', color: '#fff', margin: '20px 5%', borderRadius: '20px', padding: '50px' }}>
        <span style={{ fontSize: '12px', opacity: 0.7 }}>YOUR BATCH</span>
        <h1 style={{ margin: '10px 0', fontSize: '32px' }}>{batchId.replace(/-/g, ' ').toUpperCase()}</h1>
      </div>

      {/* --- BATCH OFFERINGS --- */}
      <main style={{ padding: '0 5%' }}>
        <h3 style={{ fontWeight: '700', marginBottom: '20px' }}>Batch Offerings</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {['All Classes', 'All Tests', 'My Doubts', 'Community'].map((item) => (
            <Link key={item} href={item === 'All Classes' ? `/neet/${batchId}/all-classes` : '#'} style={offerCardStyle}>
              <span style={{ fontWeight: '600', color: '#444' }}>{item}</span>
              <span style={{ color: '#ccc' }}>❯</span>
            </Link>
          ))}
        </div>

        {/* --- UPCOMING EVENTS (PIC 1) --- */}
        <section style={{ marginTop: '50px', marginBottom: '50px' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '20px' }}>Upcoming Events (0)</h3>
          <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: '20px', padding: '40px', textAlign: 'center' }}>
             <div style={{ fontSize: '50px', marginBottom: '15px' }}>🕒</div>
             <p style={{ fontWeight: 'bold', margin: '0', color: '#333' }}>No upcoming events,</p>
             <p style={{ color: '#888', fontSize: '14px', marginTop: '5px' }}>Perfect time to catch up on pending work!</p>
          </div>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
             <button style={{ background: 'none', border: '1px solid #6157ff', color: '#6157ff', padding: '12px 30px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
               View Weekly Schedule
             </button>
          </div>
        </section>
      </main>

      {/* --- NOTIFICATIONS DRAWER --- */}
      {showNotifs && (
        <div style={drawerOverlay} onClick={() => setShowNotifs(false)}>
          <div style={drawerContent} onClick={e => e.stopPropagation()}>
            <div style={drawerHeader}>
              <h3 style={{margin:0}}>Notifications</h3>
              <button onClick={() => setShowNotifs(false)} style={closeBtn}>✕</button>
            </div>
            
            {/* FACULTY POST BOX (OWNER ONLY) */}
            {isOwner && (
              <div style={{ padding: '20px', borderBottom: '1px solid #eee', background: '#f9f9f9' }}>
                <textarea 
                  value={newNotice} 
                  onChange={e => setNewNotice(e.target.value)} 
                  placeholder="Create a new notification..." 
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #ddd', resize: 'none', fontSize: '14px' }}
                  rows={3}
                />
                <button onClick={handlePostNotice} style={{ ...actionBtnFull, marginTop: '10px' }}>Post Notification</button>
              </div>
            )}

            <div style={{ padding: '10px', height: 'calc(100vh - 200px)', overflowY: 'auto' }}>
              {notices.map((n, i) => (
                <div key={i} style={notifItem}>
                  <div style={notifIcon}>📢</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>{n.content}</div>
                    <div style={{ fontSize: '11px', color: '#aaa', marginTop: '5px' }}>
                      {new Date(n.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ... [Streak and Leaderboard Modals remain same] ... */}
    </div>
  )
}

// --- STYLES ---
const iconStatStyle: any = { display: 'flex', alignItems: 'center', gap: '8px', color: '#444', fontSize: '18px' };
const badgeStyle: any = { position: 'absolute', top: '-5px', right: '-8px', background: '#d32f2f', color: '#fff', fontSize: '10px', borderRadius: '50%', padding: '2px 5px', border: '2px solid #fff' };
const offerCardStyle: any = { background: '#fff', padding: '25px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #f0f0f0', textDecoration: 'none' };
const dropdownStyle: any = { position: 'absolute', top: '45px', right: '0', background: '#fff', minWidth: '160px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #f0f0f0', zIndex: 100 };
const dropdownItem: any = { display: 'block', padding: '12px 15px', fontSize: '14px', color: '#333', textDecoration: 'none', cursor: 'pointer' };
const drawerOverlay: any = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' };
const drawerContent: any = { width: '400px', height: '100%', background: '#fff', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)' };
const drawerHeader: any = { padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const closeBtn: any = { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' };
const notifItem: any = { display: 'flex', gap: '15px', padding: '15px', borderBottom: '1px solid #f9f9f9', alignItems: 'flex-start' };
const notifIcon: any = { background: '#fff3e0', padding: '10px', borderRadius: '12px', fontSize: '18px' };
const actionBtnFull: any = { width: '100%', padding: '14px', background: '#6157ff', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };