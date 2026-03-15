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

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, key);
  }, []);

  const isOwner = session?.user?.email === "bhaswarray@gmail.com";
  const displayName = session?.user?.name?.split(' ')[0] || "Student";

  useEffect(() => {
    setMounted(true)
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

  const handleEnroll = async (batchId: string) => {
    if (!session?.user?.email) return;
    const { error } = await supabase
      .from('enrollments')
      .insert([{ student_email: session.user.email, batch_id: batchId }]);
    if (!error || (error as any).code === '23505') {
      setEnrolledBatches(prev => [...prev, batchId]);
    }
  };

  if (status === "unauthenticated") redirect("/")
  if (status === "loading" || !mounted) return null;

  // BATCH DATA WITH NEW CRASH COURSE IMAGE
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
        // NEW IMPROVED IMAGE FOR CRASH COURSE
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
        .nav-center ul { display: flex; gap: 30px; list-style: none; align-items: center; }
        .nav-link { text-decoration: none; color: #444; font-weight: 600; font-size: 15px; transition: 0.2s; }
        .nav-link:hover { color: #5b6cfd; }
        .filter-btn { background: #fff; border: 1px solid #e2e8f0; padding: 10px 20px; cursor: pointer; font-weight: 600; color: #64748b; border-radius: 10px; text-transform: uppercase; font-size: 12px; transition: 0.2s; }
        .filter-btn.active { color: #fff; background: #5b6cfd; border-color: #5b6cfd; box-shadow: 0 4px 12px rgba(91, 108, 253, 0.2); }
        .resource-card { flex: 1; minWidth: 220px; padding: 20px; border-radius: 15px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; border: 1px solid #f1f5f9; transition: 0.3s; }
        
        /* PRICE SECTION STYLES LIKE PIC 2 */
        .price-container { display: flex; align-items: center; gap: 12px; margin: 15px 0; }
        .price-final { font-size: 28px; fontWeight: 900; color: #5b6cfd; }
        .price-original { font-size: 16px; color: #94a3b8; text-decoration: line-through; }
        .discount-badge { background: #eefcf1; color: #10b981; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 800; border: 1px solid #d1fae5; display: flex; align-items: center; gap: 4px; }
      `}} />

      <header>
        <Link href="/" style={{ textDecoration: 'none', fontWeight: 900, fontSize: '24px', color: '#5b6cfd' }}>StudyHub</Link>

        <nav className="nav-center">
          <ul>
            <Link href="/" className="nav-link">Home</Link>
            {isOwner ? (
                <Link href="/admin" className="nav-link" style={{color:'#ff4757', fontWeight: 800}}>Admin Panel</Link>
            ) : (
                <Link href="/neet" className="nav-link" style={{color:'#5b6cfd'}}>Dashboard</Link>
            )}
            <li className="nav-link">Books</li>
            <li className="nav-link">Results</li>
          </ul>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 15, justifySelf: 'end' }}>
          <Link href="/profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={session?.user?.image || ""} style={{ width: '42px', height: '42px', borderRadius: '50%', border: '2px solid #5b6cfd', objectFit: 'cover' }} />
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

        <h1 style={{ fontSize: '42px', fontWeight: '900', color: '#0f172a', marginBottom: '10px', letterSpacing: '-1px' }}>NEET Online Preparation</h1>
        <p style={{ color: '#64748b', marginBottom: '40px', fontSize: '18px', maxWidth: '850px', lineHeight: '1.6' }}>
            StudyHub brings together dedicated courses for every stage, thousands of practice questions and mock tests.
        </p>

        {/* RESOURCE CARDS */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '50px', flexWrap: 'wrap' }}>
            <motion.div whileHover={{y:-8}} className="resource-card" style={{background: '#f0f7ff'}}>
                <div><b style={{display:'block', fontSize:'17px'}}>Blogs</b><small style={{color:'#666'}}>Read latest updates</small></div>
                <div style={{background:'#fff', borderRadius:'50%', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>→</div>
            </motion.div>
            <motion.div whileHover={{y:-8}} className="resource-card" style={{background: '#fff1f2'}}>
                <div><b style={{display:'block', fontSize:'17px'}}>PDF Bank</b><small style={{color:'#666'}}>Access free notes</small></div>
                <div style={{background:'#fff', borderRadius:'50%', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>→</div>
            </motion.div>
            <motion.div whileHover={{y:-8}} className="resource-card" style={{background: '#f0fdf4'}}>
                <div><b style={{display:'block', fontSize:'17px'}}>Test Series</b><small style={{color:'#666'}}>Practice mocks</small></div>
                <div style={{background:'#fff', borderRadius:'50%', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>→</div>
            </motion.div>
            <motion.div whileHover={{y:-8}} className="resource-card" style={{background: '#f8fafc'}}>
                <div><b style={{display:'block', fontSize:'17px'}}>Books</b><small style={{color:'#666'}}>Find references</small></div>
                <div style={{background:'#fff', borderRadius:'50%', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>→</div>
            </motion.div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '40px', flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0', paddingBottom: '25px' }}>
          {["#all", "#class 11", "#class 12", "#dropper"].map(tag => (
            <button key={tag} onClick={() => setActiveFilter(tag)} className={`filter-btn ${activeFilter === tag ? 'active' : ''}`}>
                {tag.replace('#', '')}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '35px' }}>
          {filteredBatches.map((batch) => {
            const isEnrolled = isOwner || enrolledBatches.includes(batch.id);
            return (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={batch.id} style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
                <div style={{ height: '210px', position: 'relative' }}>
                  <img src={batch.banner} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="banner" />
                  <div style={{ position: 'absolute', top: '15px', left: '15px', background: batch.color, color: '#fff', padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: '900' }}>{batch.tag}</div>
                </div>

                <div style={{ padding: '25px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                    <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: 0 }}>{batch.name}</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '11px', padding: '4px 8px', borderRadius: '5px', fontWeight: 'bold' }}>Hinglish</span>
                        <img src="https://cdn-icons-png.flaticon.com/512/3670/3670051.png" style={{ width: '22px' }} alt="wa" />
                    </div>
                  </div>

                  <div style={{ color: '#64748b', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', fontWeight: '500' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>👥 For NEET Aspirants</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📅 Starts: 13 Apr, 2026</div>
                  </div>

                  {/* HASHTAGS FOR ADMIN */}
                  {isOwner && (
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
                      {batch.hashtags.map(t => <span key={t} style={{fontSize:'10px', background:'#f8fafc', color: '#5b6cfd', border: '1px solid #e2e8f0', padding:'3px 8px', borderRadius:'6px', fontWeight: '700'}}>{t}</span>)}
                    </div>
                  )}

                  {/* UPDATED PRICE SECTION PER PIC 2 */}
                  <div className="price-container">
                    <span className="price-final">₹0</span>
                    <span className="price-original">₹{batch.price}</span>
                    <div className="discount-badge">🏷️ Discount of 100% applied</div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <Link href={`/neet/${batch.id}`} style={{ flex: 1 }}>
                      <button style={{ width: '100%', padding: '15px', borderRadius: '14px', fontWeight: '900', background: '#fff', border: `2px solid ${batch.color}`, color: batch.color, cursor: 'pointer' }}>EXPLORE</button>
                    </Link>
                    <button 
                        onClick={!isEnrolled ? () => handleEnroll(batch.id) : undefined}
                        style={{ flex: 1, padding: '15px', borderRadius: '14px', fontWeight: '900', background: isEnrolled ? '#10b981' : batch.color, color: '#fff', border: 'none', cursor: isEnrolled ? 'default' : 'pointer' }}
                    >
                      {isEnrolled ? "ENROLLED" : "ENROLL NOW"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </main>

      <footer style={{padding:'60px 20px', textAlign:'center', background:'#1c252e', color:'white', marginTop: '80px'}}>
        <p style={{opacity: 0.5, fontSize: '15px'}}>© 2026 StudyHub | Made for future doctors | By Bhaswar Ray</p>
      </footer>
    </div>
  )
}