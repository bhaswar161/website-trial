"use client";
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function NeetPage() {
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const [enrolledBatches, setEnrolledBatches] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Memoized Supabase Client
  // This ensures the client is only created when the session changes
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, key, {
      global: {
        headers: {
          Authorization: `Bearer ${session?.user ? 'authenticated' : ''}`,
        },
      },
    });
  }, [session]);

  const isOwner = session?.user?.email === "bhaswarray@gmail.com"

  useEffect(() => {
    setMounted(true)
    if (!session?.user?.email) return;

    const fetchData = async () => {
      const { data: enrolls, error } = await supabase
        .from('enrollments')
        .select('batch_id')
        .eq('student_email', session.user.email);
      
      if (enrolls) setEnrolledBatches(enrolls.map(e => e.batch_id));
    };

    fetchData();
  }, [session, supabase]);

  const handleEnroll = async (batchId: string) => {
    if (!session?.user?.email) return alert("Please sign in to enroll");
    
    const { error } = await supabase
      .from('enrollments')
      .insert([{ student_email: session.user.email, batch_id: batchId }]);
    
    if (!error || (error as any).code === '23505') {
      setEnrolledBatches(prev => [...prev, batchId]);
    } else {
      alert("Enrollment failed. Please try again.");
    }
  };

  // Auth Protection
  if (status === "unauthenticated") redirect("/api/auth/signin")
  if (status === "loading" || !mounted) return <div style={{textAlign:'center', marginTop:'50px'}}>Loading NEET Portal...</div>

  const batches = [
    { id: "ultimate-2026", name: "Yakeen NEET 2026", color: "#6c63ff", originalPrice: "6,000", starts: "14 Apr, 2026" },
    { id: "crash-course", name: "NEET Crash Course 2026", color: "#ff4ecd", originalPrice: "5,500", starts: "15 May, 2026" }
  ]

  const filteredBatches = batches.filter(batch => 
    batch.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '40px 5%', background: '#f5f7fb', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      <header style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <div>
                <h1 style={{ margin: 0, fontSize: '32px', color: '#333' }}>NEET Study Portal</h1>
                <Link href="/" style={{color:'#6c63ff', textDecoration:'none', fontSize: '14px'}}>← Home</Link>
            </div>
            {isOwner && (
              <div style={{ color: '#2e7d32', fontWeight: 'bold', background: '#e8f5e9', padding: '8px 15px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                Faculty Mode Active
              </div>
            )}
        </div>

        <div style={{ position: 'relative', maxWidth: '500px' }}>
          <input 
            type="text" 
            placeholder="Search for your batch..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '16px 20px', 
              borderRadius: '15px', 
              border: '1px solid #ddd', 
              fontSize: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              outline: 'none'
            }} 
          />
          <span style={{ position: 'absolute', right: '20px', top: '16px', color: '#999' }}>🔍</span>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 450px))', gap: '30px' }}>
        {filteredBatches.map((batch) => {
          const isEnrolled = enrolledBatches.includes(batch.id) || isOwner;
          
          return (
            <div key={batch.id} style={{ background: '#fff', borderRadius: '25px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
              <div style={{ height: '100px', background: batch.color, padding: '0 30px', color: '#fff', display: 'flex', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '22px' }}>{batch.name}</h2>
              </div>

              <div style={{ padding: '30px' }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ color: '#666', fontSize: '14px', marginBottom: '12px' }}>🎓 For NEET Aspirants | 📅 Starts: {batch.starts}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '25px' }}>
                    <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>FREE</span>
                    <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '18px' }}>₹{batch.originalPrice}</span>
                    <span style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '16px' }}>100% OFF</span>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    {isEnrolled ? (
                      <Link href={`/neet/${batch.id}`} style={{ textDecoration: 'none' }}>
                        <button style={{ 
                            width: '100%', padding: '16px', borderRadius: '15px', border: `2px solid ${batch.color}`, 
                            color: batch.color, background: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', textTransform: 'uppercase'
                        }}>
                          Explore Batch
                        </button>
                      </Link>
                    ) : (
                      <button 
                        onClick={() => handleEnroll(batch.id)} 
                        style={{ 
                            width: '100%', padding: '16px', borderRadius: '15px', border: 'none', 
                            background: batch.color, color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', 
                            textTransform: 'uppercase', boxShadow: `0 4px 15px ${batch.color}44`
                        }}
                      >
                        Enroll Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}