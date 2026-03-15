"use client";
import { useSession, signOut } from "next-auth/react"
import { redirect, useRouter } from "next/navigation"
import Link from "next/link"
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { motion } from 'framer-motion'

export default function NeetPage() {
  const { data: session, status } = useSession()
  const router = useRouter();
  const [mounted, setMounted] = useState(false)
  const [enrolledBatches, setEnrolledBatches] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState("#all");
  
  // SYNC PROFILE DATA
  const [customName, setCustomName] = useState("");
  const [profilePic, setProfilePic] = useState("");

  const supabase = useMemo(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const isOwner = session?.user?.email === "bhaswarray@gmail.com";

  useEffect(() => {
    setMounted(true)
    // Extract data from profile page storage
    setCustomName(localStorage.getItem("userFirstName") || "");
    setProfilePic(localStorage.getItem("userProfilePic") || "");

    if (!session?.user?.email) return;

    const fetchData = async () => {
      const { data: enrolls } = await supabase
        .from('enrollments')
        .select('batch_id')
        .eq('student_email', session.user.email);
      if (enrolls) setEnrolledBatches(enrolls.map(e => e.batch_id));
    };
    fetchData();
  }, [session, supabase]);

  const displayName = customName || session?.user?.name?.split(' ')[0] || "Student";

  const handleEnroll = async (batchId: string) => {
    if (!session?.user?.email) return;
    const { error } = await supabase
      .from('enrollments')
      .insert([{ student_email: session.user.email, batch_id: batchId }]);
    if (!error || (error as any).code === '23505') {
      setEnrolledBatches(prev => [...prev, batchId]);
    }
  };

  const handleShare = (batchName: string) => {
    const text = encodeURIComponent(`Check out ${batchName} on StudyHub: ` + window.location.href);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (status === "unauthenticated") redirect("/")
  if (status === "loading" || !mounted) return null;

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

  const filteredBatches = batches.filter(batch => 
    batch.hashtags.includes(activeFilter.toLowerCase())
  );

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        header {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          padding: 0 5%;
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
          position: sticky; top: 0; z-index: 1000; height: 80px;
        }
        .nav-center ul { display: flex; gap: 25px; list-style: none; align-items: center; }
        .nav-link { text-decoration: none; color: #444; font-weight: 600; font-size: 14px; }
        .filter-btn { background: #fff; border: 1px solid #e2e8f0; padding: 10px 20px; cursor: pointer; font-weight: 600; color: #64748b; border-radius: 10px; text-transform: uppercase; font-size: 12px; }
        .filter-btn.active { color: #fff; background: #5b6cfd; border-color: #5b6cfd; }
        .resource-card { flex: 1; minWidth: 240px; padding: 25px; border-radius: 20px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; border: 1px solid #f1f5f9; background: #fff; position: relative; overflow: hidden; }
        .resource-card b { font-size: 18px; color: #1c252e; }
        .resource-card small { color: #666; font-size: 13px; }
        .price-container { display: flex; align-items: center; gap: 12px; margin: 15px 0; }
        .discount-badge { background: #eefcf1; color: #10b981; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 800; border: 1px solid #d1fae5; }
        .admin-btn { color: #ff4757; border: 2px solid #ff4757; padding: 8px 20px; border-radius: 50px; font-weight: 800; text-decoration: none; display: inline-block; }
      `}} />

      <header>
        <Link href="/" style={{ textDecoration: 'none', fontWeight: 900, fontSize: '24px', color: '#5b6cfd' }}>StudyHub</Link>

        <nav className="nav-center">
          <ul>
            <Link href="/" className="nav-link">Home</Link>
            {isOwner ? (
                <motion.div whileHover={{ scale: 1.05 }} animate={{ opacity: [0.8, 1, 0.8] }} transition={{ repeat: Infinity, duration: 2 }}>
                  <Link href="/admin" className="admin-btn">Admin Panel</Link>
                </motion.div>
            ) : (
                <Link href="/neet" className="nav-link" style={{color:'#5b6cfd'}}>Dashboard</Link>
            )}
            <li className="nav-link">Books</li>
            <li className="nav-link">Results</li>
          </ul>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 15, justifySelf: 'end' }}>
          <Link href="/profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* SYNCED PROFILE IMAGE */}
            <img src={profilePic || session?.user?.image || ""} style={{ width: '42px', height: '42px', borderRadius: '50%', border: '2px solid #5b6cfd', objectFit: 'cover' }} />
            <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: '800', fontSize: '14px', color: '#1c252e' }}>Hi, {displayName}</div>
                <div style={{ fontSize: '10px', color: '#5b6cfd', fontWeight: 'bold' }}>{isOwner ? 'FACULTY' : 'STUDENT'}</div>
            </div>
          </Link>
          <button onClick={() => signOut()} style={{ background: '#ff4757', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>Logout</button>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        <button onClick={() => router.back()} style={{ background: '#fff', border: '1px solid #e2e8f0', width: '42px', height: '42px', borderRadius: '50%', cursor: 'pointer', marginBottom: '30px', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>

        <div style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '42px', fontWeight: '900', color: '#0f172a', marginBottom: '10px' }}>NEET Online Preparation</h1>
            <p style={{ color: '#64748b', fontSize: '17px', maxWidth: '850px', lineHeight: '1.6' }}>
                Access StudyHub's premium courses and resources for NEET aspirants.
            </p>
        </div>

        {/* PIC 2 RESOURCE BOXES */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '60px', flexWrap: 'wrap' }}>
            <div className="resource-card" style={{ borderLeft: '6px solid #5b6cfd' }}>
                <div><b>Blogs</b><br/><small>Read Our Latest Blogs</small></div>
                <span>➔</span>
            </div>
            <div className="resource-card" style={{ borderLeft: '6px solid #ff4ecd' }}>
                <div><b>PDF Bank</b><br/><small>Access PDF Bank</small></div>
                <span>➔</span>
            </div>
            <div className="resource-card" style={{ borderLeft: '6px solid #10b981' }}>
                <div><b>Test Series</b><br/><small>Practice with Our Mock Test</small></div>
                <span>➔</span>
            </div>
            <div className="resource-card" style={{ borderLeft: '6px solid #3b82f6' }}>
                <div><b>Books</b><br/><small>Find NEET Books</small></div>
                <span>➔</span>
            </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '40px', flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0', paddingBottom: '25px' }}>
          {["#all", "#class 11", "#class 12", "#dropper"].map(tag => (
            <button key={tag} onClick={() => setActiveFilter(tag)} className={`filter-btn ${activeFilter === tag ? 'active' : ''}`}>{tag.replace('#', '')}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '35px' }}>
          {filteredBatches.map((batch) => {
            const isEnrolled = enrolledBatches.includes(batch.id);
            const isAuthorized = isOwner || isEnrolled;

            return (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={batch.id} style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
                <div style={{ height: '210px', position: 'relative' }}>
                  <img src={batch.banner} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="banner" />
                  <div style={{ position: 'absolute', top: '15px', left: '15px', background: batch.color, color: '#fff', padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: '900' }}>{batch.tag}</div>
                </div>

                <div style={{ padding: '25px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                    <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: 0 }}>{batch.name}</h3>
                    <img src="https://cdn-icons-png.flaticon.com/512/3670/3670051.png" style={{ width: '22px', cursor: 'pointer' }} onClick={() => handleShare(batch.name)} />
                  </div>

                  <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '15px' }}>
                    <div>👥 For NEET Aspirants | 📅 Starts: 13 Apr, 2026</div>
                  </div>

                  {/* HASHTAGS SHOWN ON CARD */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    {batch.hashtags.map(t => <span key={t} style={{fontSize:'10px', background:'#f8fafc', color: '#5b6cfd', border: '1px solid #e2e8f0', padding:'3px 8px', borderRadius:'6px', fontWeight: '700'}}>{t}</span>)}
                  </div>

                  <div className="price-container">
                    <span style={{ fontSize: '28px', fontWeight: '900', color: '#5b6cfd' }}>₹0</span>
                    <span style={{ fontSize: '16px', color: '#94a3b8', textDecoration: 'line-through' }}>₹{batch.price}</span>
                    <div className="discount-badge">Discount of 100% applied</div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    {isAuthorized ? (
                      <Link href={`/neet/${batch.id}`} style={{ flex: 1 }}>
                        <button style={{ width: '100%', padding: '15px', borderRadius: '14px', fontWeight: '900', background: batch.color, color: '#fff', border: 'none', cursor: 'pointer' }}>EXPLORE</button>
                      </Link>
                    ) : (
                      <>
                        <button style={{ flex: 1, padding: '15px', borderRadius: '14px', fontWeight: '900', background: '#fff', border: `2px solid ${batch.color}`, color: batch.color, opacity: 0.5 }}>EXPLORE</button>
                        <button onClick={() => handleEnroll(batch.id)} style={{ flex: 1, padding: '15px', borderRadius: '14px', fontWeight: '900', background: batch.color, color: '#fff', border: 'none' }}>ENROLL NOW</button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </main>
    </div>
  )
}