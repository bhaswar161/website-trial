"use client";
import { useSession, signOut, signIn } from "next-auth/react"
import { redirect, useRouter } from "next/navigation"
import Link from "next/link"
import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from "../../context/ThemeContext"

export default function NeetPage() {
  const { data: session, status } = useSession()
  const { isDarkMode } = useTheme()
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

  const fetchEnrollments = useCallback(async () => {
    if (!session?.user?.email) return;
    const email = session.user.email.toLowerCase();
    
    const localKey = `enrolled_${email}`;
    const localData = localStorage.getItem(localKey);
    if (localData) setEnrolledBatches(JSON.parse(localData));

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

  const handleEnroll = async (batchId: string, batchName: string, isPaid: boolean, price: string) => {
    if (!session?.user?.email) {
        signIn('google');
        return;
    }

    if (isPaid) {
        router.push(`/neet/checkout?batchId=${batchId}&amount=${price.replace(',', '')}`);
        return;
    }

    const email = session.user.email.toLowerCase();
    const updated = [...enrolledBatches, batchId];
    setEnrolledBatches(updated);
    localStorage.setItem(`enrolled_${email}`, JSON.stringify(updated));

    const { error } = await supabase.from('enrollments').insert([{ 
      student_email: email, 
      student_name: displayName, 
      batch_id: batchId,
      batch_name: batchName 
    }]);
    
    if (!error || (error as any).code === '23505') {
        alert(`🎉 Welcome to ${batchName}! You can now explore the course.`);
    }
  };

  const handleShare = (batchName: string) => {
    const text = encodeURIComponent(`Join ${batchName} with me on StudyHub!`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const theme = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    card: isDarkMode ? '#1e293b' : '#fff',
    text: isDarkMode ? '#f8fafc' : '#0f172a',
    subtext: isDarkMode ? '#94a3b8' : '#64748b',
    headerBg: isDarkMode ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.85)',
    border: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
  };

  const batches = [
    { id: "ultimate-2026", name: "Yakeen NEET 2026", color: "#6c63ff", tag: "PAID", price: "200", originalPrice: "6,000", isPaid: true, hashtags: ["#class 12", "#dropper", "#all"], banner: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=800&auto=format&fit=crop" },
    { id: "arjuna-2026", name: "Arjuna NEET 2026", color: "#3b82f6", tag: "PAID", price: "200", originalPrice: "5,000", isPaid: true, hashtags: ["#class 11", "#all"], banner: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop" },
    { id: "crash-course", name: "NEET Crash Course 2026", color: "#ff4ecd", tag: "FREE", price: "0", originalPrice: "0", isPaid: false, hashtags: ["#class 11", "#all"], banner: "https://images.unsplash.com/photo-1631815587646-b85a1bb027e1?q=80&w=800&auto=format&fit=crop" }
  ];

  const filteredBatches = batches.filter(batch => batch.hashtags.includes(activeFilter.toLowerCase()));

  if (status === "unauthenticated") redirect("/")
  if (status === "loading" || !mounted) return null;

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', fontFamily: 'sans-serif', transition: '0.4s' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        body { margin: 0; padding: 0; }
        header { display: flex; justify-content: space-between; align-items: center; padding: 0 5%; background: ${theme.headerBg}; backdrop-filter: blur(15px); border-bottom: 1px solid ${theme.border}; position: sticky; top: 0; z-index: 1000; height: 80px; }
        .home-btn { border: 2px solid #5b6cfd; color: #5b6cfd; padding: 8px 25px; border-radius: 12px; font-weight: 800; text-decoration: none; font-size: 16px; background: rgba(91, 108, 253, 0.05); transition: 0.2s; }
        .filter-btn { background: ${theme.card}; border: 1px solid ${theme.border}; padding: 10px 20px; cursor: pointer; font-weight: 600; color: ${theme.subtext}; border-radius: 10px; text-transform: uppercase; font-size: 12px; }
        .filter-btn.active { color: #fff; background: #5b6cfd; border-color: #5b6cfd; }
        .batch-card { background: ${theme.card}; border-radius: 24px; overflow: hidden; border: 1px solid ${theme.border}; box-shadow: 0 10px 30px rgba(0,0,0,0.08); transition: 0.4s; position: relative; }
        .batch-card:hover { transform: translateY(-12px); border-color: #5b6cfd; }
        .profile-pill { display: flex; align-items: center; gap: 12px; background: ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)'}; padding: 6px 16px 6px 6px; border-radius: 50px; color: inherit; text-decoration: none; }
      `}} />

      <header>
        <Link href="/" style={{ textDecoration: 'none', fontWeight: 900, fontSize: '24px', color: '#5b6cfd' }}>StudyHub</Link>
        <nav style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
          <Link href="/" className="home-btn">Home</Link>
          {session && isOwner && <Link href="/admin" style={{background:'#ffebeb', color:'#ff4757', padding:'8px 18px', borderRadius:'12px', fontWeight:800, textDecoration:'none'}}>Admin Panel</Link>}
          <Link href="#" style={{color: theme.text, textDecoration:'none', fontWeight: 600}}>Books</Link>
          <Link href="#" style={{color: theme.text, textDecoration:'none', fontWeight: 600}}>Results</Link>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <Link href="/profile" className="profile-pill">
            <img src={profilePic || session?.user?.image || ""} style={{ width: '38px', height: '38px', borderRadius: '50%', border: '2px solid #5b6cfd', objectFit: 'cover' }} />
            <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                <div style={{ fontWeight: '800', fontSize: '13px', color: theme.text }}>Hi, {displayName}</div>
                <div style={{ fontSize: '10px', color: '#5b6cfd', fontWeight: '900' }}>{isOwner ? 'FACULTY' : 'STUDENT'}</div>
            </div>
          </Link>
          <button onClick={() => signOut()} style={{ background: '#ff4757', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>Logout</button>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
        <h1 style={{ fontSize: '42px', fontWeight: '900', color: theme.text, marginBottom: '10px' }}>NEET Online Preparation</h1>
        <p style={{ color: theme.subtext, marginBottom: '40px', fontSize: '18px' }}>Join our premium batches and start your journey to medical excellence.</p>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
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
                    <img src={batch.banner} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="banner" />
                    <div style={{ position: 'absolute', top: '15px', left: '15px', background: batch.isPaid ? '#6c63ff' : '#ff4ecd', color: '#fff', padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: '900' }}>{batch.tag}</div>
                  </div>
                  <div style={{ padding: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <h3 style={{ fontSize: '24px', fontWeight: '900', color: theme.text, margin: 0 }}>{batch.name}</h3>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ background: isDarkMode ? '#334155' : '#f1f5f9', color: theme.subtext, fontSize: '11px', padding: '4px 8px', borderRadius: '5px', fontWeight: 'bold' }}>Hinglish</span>
                          <img src="https://cdn-icons-png.flaticon.com/512/3670/3670051.png" style={{ width: '22px', cursor: 'pointer' }} onClick={() => handleShare(batch.name)} />
                      </div>
                    </div>
                    <div style={{ color: theme.subtext, fontSize: '14px', fontWeight: '600', marginBottom: '15px' }}>📅 Starts: 13 Apr, 2026 | Ends: 30 Jun, 2027</div>
                    
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        {batch.hashtags.filter(h => h !== '#all').map(h => (
                            <span key={h} style={{ background: isDarkMode ? 'rgba(91,108,253,0.1)' : '#f0f2ff', color: '#5b6cfd', fontSize: '10px', padding: '4px 10px', borderRadius: '6px', fontWeight: '800' }}>{h.toUpperCase()}</span>
                        ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '25px' }}>
                      <span style={{ fontSize: '28px', fontWeight: '900', color: '#5b6cfd' }}>₹{batch.price}</span>
                      {batch.isPaid && <span style={{ fontSize: '16px', color: '#94a3b8', textDecoration: 'line-through' }}>₹{batch.originalPrice}</span>}
                    </div>

                    {isDataLoading ? (
                      <button disabled style={{ width: '100%', padding: '15px', borderRadius: '14px', background: theme.border }}>LOADING...</button>
                    ) : canExplore ? (
                      <Link href={`/neet/${batch.id}`} style={{ width: '100%' }}>
                        <button style={{ width: '100%', padding: '15px', borderRadius: '14px', fontWeight: '900', background: batch.color, color: '#fff', border: 'none', cursor: 'pointer' }}>EXPLORE</button>
                      </Link>
                    ) : (
                      <button 
                        onClick={() => handleEnroll(batch.id, batch.name, batch.isPaid, batch.price)} 
                        style={{ width: '100%', padding: '15px', borderRadius: '14px', fontWeight: '900', background: batch.color, color: '#fff', border: 'none', cursor: 'pointer' }}
                      >
                        {batch.isPaid ? 'BUY NOW' : 'ENROLL NOW'}
                      </button>
                    )}
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
