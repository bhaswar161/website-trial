"use client";
import { useSession, signOut } from "next-auth/react"
import { redirect, useRouter } from "next/navigation"
import Link from "next/link"
import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from "../../context/ThemeContext"

export default function NeetPage() {
  const { data: session, status } = useSession()
  const { isDarkMode, toggleTheme } = useTheme()
  const router = useRouter();
  const [mounted, setMounted] = useState(false)
  const [enrolledBatches, setEnrolledBatches] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState("#all");
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  const [customName, setCustomName] = useState("");
  const [profilePic, setProfilePic] = useState("");

  const supabase = useMemo(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const isOwner = session?.user?.email?.toLowerCase() === "bhaswarray@gmail.com";

  // FIX: Sync system that prevents "forgetting" enrollments
  const fetchEnrollments = useCallback(async () => {
    if (!session?.user?.email) return;
    const email = session.user.email.toLowerCase();
    
    // Check Local Storage first
    const localKey = `enrolled_${email}`;
    const localData = localStorage.getItem(localKey);
    if (localData) {
      setEnrolledBatches(JSON.parse(localData));
    }

    // Double check with Supabase
    const { data: enrolls } = await supabase
      .from('enrollments')
      .select('batch_id')
      .eq('student_email', email);
    
    if (enrolls) {
      const ids = enrolls.map(e => e.batch_id);
      setEnrolledBatches(ids);
      localStorage.setItem(localKey, JSON.stringify(ids));
    }
    setIsDataLoading(false);
  }, [session, supabase]);

  useEffect(() => {
    setMounted(true)
    setCustomName(localStorage.getItem("userFirstName") || "");
    setProfilePic(localStorage.getItem("userProfilePic") || "");
    
    if (status === "authenticated") {
      fetchEnrollments();
    } else if (status === "unauthenticated") {
      setIsDataLoading(false);
    }

    window.addEventListener('focus', fetchEnrollments);
    return () => window.removeEventListener('focus', fetchEnrollments);
  }, [status, fetchEnrollments]);

  const displayName = customName || session?.user?.name?.split(' ')[0] || "Student";

  const handleEnroll = async (batchId: string, batchName: string) => {
    if (!session?.user?.email) return;
    const email = session.user.email.toLowerCase();

    const updated = [...enrolledBatches, batchId];
    setEnrolledBatches(updated);
    localStorage.setItem(`enrolled_${email}`, JSON.stringify(updated));

    const { error } = await supabase
      .from('enrollments')
      .insert([{ 
        student_email: email, 
        student_name: displayName, 
        batch_id: batchId,
        batch_name: batchName 
      }]);
    
    if (!error || (error as any).code === '23505') {
        alert(`🎉 Successfully enrolled in ${batchName}!`);
    }
  };

  const handleShare = (batchName: string) => {
    const text = encodeURIComponent(`Check out ${batchName} on StudyHub: ` + window.location.href);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const theme = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    card: isDarkMode ? '#1e293b' : '#fff',
    text: isDarkMode ? '#f8fafc' : '#0f172a',
    subtext: isDarkMode ? '#94a3b8' : '#64748b',
    headerBg: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    border: isDarkMode ? '#334155' : '#e2e8f0'
  };

  const batches = [
    { 
        id: "ultimate-2026", 
        name: "Yakeen NEET 2026", 
        color: "#6c63ff", 
        tag: "ONLINE",
        price: "6,000",
        hashtags: ["#class 12", "#dropper", "#all"],
        banner: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=800&auto=format&fit=crop"
    },
    { 
        id: "crash-course", 
        name: "NEET Crash Course 2026", 
        color: "#ff4ecd", 
        tag: "ONLINE",
        price: "5,500",
        hashtags: ["#class 11", "#all"],
        banner: "https://images.unsplash.com/photo-1631815587646-b85a1bb027e1?q=80&w=800&auto=format&fit=crop"
    }
  ];

  const filteredBatches = batches.filter(batch => batch.hashtags.includes(activeFilter.toLowerCase()));

  if (status === "unauthenticated") redirect("/")
  if (status === "loading" || !mounted) return null;

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', fontFamily: 'sans-serif', transition: 'background 0.4s ease' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        body { margin: 0; padding: 0; overflow-x: hidden; }
        header { 
          display: grid; 
          grid-template-columns: 1fr auto 1fr; 
          align-items: center; 
          padding: 0 5%; 
          background: ${theme.headerBg}; 
          backdrop-filter: blur(12px); 
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid ${theme.border}; 
          position: sticky; top: 0; z-index: 1000; height: 80px; 
          transition: background 0.3s ease;
        }
        .nav-center ul { display: flex; gap: 20px; list-style: none; align-items: center; margin: 0; padding: 0; }
        .btn-outline-blue { border: 2px solid #5b6cfd; color: #5b6cfd; padding: 8px 25px; border-radius: 12px; font-weight: 800; text-decoration: none; font-size: 16px; }
        .btn-outline-red { border: 2px solid #ff4757; color: #ff4757; padding: 8px 25px; border-radius: 12px; font-weight: 800; text-decoration: none; font-size: 16px; }
        .filter-btn { background: ${theme.card}; border: 1px solid ${theme.border}; padding: 10px 20px; cursor: pointer; font-weight: 600; color: ${theme.subtext}; border-radius: 10px; text-transform: uppercase; font-size: 12px; transition: 0.2s; }
        .filter-btn.active { color: #fff; background: #5b6cfd; border-color: #5b6cfd; }
        .batch-card { background: ${theme.card}; border-radius: 24px; overflow: hidden; border: 1px solid ${theme.border}; box-shadow: 0 10px 30px rgba(0,0,0,0.08); transition: 0.4s; position: relative; }
        .batch-card:hover { transform: translateY(-12px); border-color: #5b6cfd; box-shadow: 0 0 25px rgba(91, 108, 253, 0.4); }
        .batch-card::after { content: ''; position: absolute; inset: 0; border-radius: 24px; border: 2px solid #5b6cfd; opacity: 0; transition: 0.3s; pointer-events: none; }
        .batch-card:hover::after { opacity: 1; animation: spark-pulse 1.5s infinite; }
        @keyframes spark-pulse { 0% { box-shadow: 0 0 0 0px rgba(91, 108, 253, 0.7); } 100% { box-shadow: 0 0 0 15px rgba(91, 108, 253, 0); } }
        .resource-card { flex: 1; minWidth: 240px; padding: 25px; border-radius: 20px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; border: 1px solid ${theme.border}; background: ${theme.card}; color: ${theme.text}; transition: 0.3s; }
        .resource-card:hover { transform: translateY(-8px); box-shadow: 0 12px 25px rgba(0,0,0,0.15); }
      `}} />

      <header>
        <Link href="/" style={{ textDecoration: 'none', fontWeight: 900, fontSize: '24px', color: '#5b6cfd' }}>StudyHub</Link>
        <nav className="nav-center">
          <ul>
            <li><Link href="/" className="btn-outline-blue">Home</Link></li>
            {isOwner && (
              <li><motion.div whileHover={{ scale: 1.05 }}><Link href="/admin" className="btn-outline-red">Admin Panel</Link></motion.div></li>
            )}
            <li style={{color: theme.subtext, fontSize: '14px', fontWeight: '600'}}>Books</li>
            <li style={{color: theme.subtext, fontSize: '14px', fontWeight: '600'}}>Results</li>
          </ul>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15, justifySelf: 'end' }}>
          <button onClick={toggleTheme} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}>
            {isDarkMode ? "☀️" : "🌙"}
          </button>
          <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <img src={profilePic || session?.user?.image || ""} style={{ width: '42px', height: '42px', borderRadius: '50%', border: '2px solid #5b6cfd', objectFit: 'cover' }} />
            <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: '800', fontSize: '14px', color: theme.text }}>Hi, {displayName}</div>
                <div style={{ fontSize: '10px', color: '#5b6cfd', fontWeight: 'bold' }}>{isOwner ? 'FACULTY' : 'STUDENT'}</div>
            </div>
          </Link>
          <button onClick={() => signOut()} style={{ background: '#ff4757', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>Logout</button>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
        <h1 style={{ fontSize: '42px', fontWeight: '900', color: theme.text, marginBottom: '10px' }}>NEET Online Preparation</h1>
        <p style={{ color: theme.subtext, marginBottom: '40px', fontSize: '18px', maxWidth: '850px' }}>Access StudyHub's premium courses and resources for NEET aspirants.</p>

        {/* RESOURCE BOXES */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '60px', flexWrap: 'wrap' }}>
          <motion.div whileHover={{ y: -8 }} className="resource-card" style={{ borderLeft: `6px solid #5b6cfd` }}>
            <div><b>Blogs</b><br/><small style={{color: theme.subtext}}>Access Blogs</small></div><div>➔</div>
          </motion.div>
          <motion.div whileHover={{ y: -8 }} className="resource-card" style={{ borderLeft: `6px solid #ff4ecd` }}>
            <div><b>PDF Bank</b><br/><small style={{color: theme.subtext}}>Access PDF Bank</small></div><div>➔</div>
          </motion.div>
          <motion.div whileHover={{ y: -8 }} className="resource-card" style={{ borderLeft: `6px solid #10b981` }}>
            <div><b>Test Series</b><br/><small style={{color: theme.subtext}}>Access Test Series</small></div><div>➔</div>
          </motion.div>
          <motion.div whileHover={{ y: -8 }} className="resource-card" style={{ borderLeft: `6px solid #3b82f6` }}>
            <div><b>Books</b><br/><small style={{color: theme.subtext}}>Access Books</small></div><div>➔</div>
          </motion.div>
        </div>

        {/* BATCH FILTER */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '40px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '25px' }}>
          {["#all", "#class 11", "#class 12", "#dropper"].map(tag => (
            <button key={tag} onClick={() => setActiveFilter(tag)} className={`filter-btn ${activeFilter === tag ? 'active' : ''}`}>{tag.replace('#', '')}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '35px' }}>
          <AnimatePresence>
            {filteredBatches.map((batch) => {
              const isEnrolled = enrolledBatches.includes(batch.id);
              const canExplore = isOwner || isEnrolled;

              return (
                <motion.div layout key={batch.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="batch-card">
                  <div style={{ height: '210px', position: 'relative' }}>
                    <img src={batch.banner} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: '15px', left: '15px', background: batch.color, color: '#fff', padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: '900' }}>{batch.tag}</div>
                  </div>

                  <div style={{ padding: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <h3 style={{ fontSize: '24px', fontWeight: '900', color: theme.text, margin: 0 }}>{batch.name}</h3>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ background: isDarkMode ? '#334155' : '#f1f5f9', color: theme.subtext, fontSize: '11px', padding: '4px 8px', borderRadius: '5px', fontWeight: 'bold' }}>Hinglish</span>
                          <img src="https://cdn-icons-png.flaticon.com/512/3670/3670051.png" style={{ width: '22px', cursor: 'pointer' }} onClick={() => handleShare(batch.name)} />
                      </div>
                    </div>

                    {/* NEW DETAILS */}
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ color: theme.subtext, fontSize: '14px', fontWeight: '600' }}>👥 For NEET Aspirants</div>
                        <div style={{ color: theme.subtext, fontSize: '13px', marginTop: '4px' }}>📅 Starts: 13 Apr, 2026 | Ends: 30 Jun, 2027</div>
                    </div>

                    {/* TAGS badges */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        {batch.hashtags.filter(h => h !== '#all').map(h => (
                            <span key={h} style={{ background: isDarkMode ? 'rgba(91,108,253,0.1)' : '#f0f2ff', color: '#5b6cfd', fontSize: '10px', padding: '4px 10px', borderRadius: '6px', fontWeight: '800', border: '1px solid rgba(91, 108, 253, 0.2)' }}>{h.toUpperCase()}</span>
                        ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '15px 0' }}>
                      <span style={{ fontSize: '28px', fontWeight: '900', color: '#5b6cfd' }}>₹0</span>
                      <span style={{ fontSize: '16px', color: '#94a3b8', textDecoration: 'line-through' }}>₹{batch.price}</span>
                      <div style={{ background: '#eefcf1', color: '#10b981', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', border: '1px solid #d1fae5' }}>🏷️ 100% OFF</div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      {isDataLoading ? (
                        <button disabled style={{ flex: 1, padding: '15px', borderRadius: '14px', fontWeight: '900', background: theme.border, color: theme.subtext }}>LOADING...</button>
                      ) : canExplore ? (
                        <Link href={`/neet/${batch.id}`} style={{ flex: 1 }}>
                          <button style={{ width: '100%', padding: '15px', borderRadius: '14px', fontWeight: '900', background: batch.color, color: '#fff', border: 'none', cursor: 'pointer' }}>EXPLORE</button>
                        </Link>
                      ) : (
                        <button onClick={() => handleEnroll(batch.id, batch.name)} style={{ flex: 1, padding: '15px', borderRadius: '14px', fontWeight: '900', background: batch.color, color: '#fff', border: 'none', cursor: 'pointer' }}>ENROLL NOW</button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}