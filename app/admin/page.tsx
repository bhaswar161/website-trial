"use client";
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [newBatch, setNewBatch] = useState({ name: '', price: '', color: '#6c63ff', hashtags: '' });
  const [loading, setLoading] = useState(false);

  const supabase = useMemo(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const isOwner = session?.user?.email === "bhaswarray@gmail.com";

  useEffect(() => {
    if (status === "unauthenticated" || (status === "authenticated" && !isOwner)) {
      redirect("/");
    }
  }, [status, isOwner]);

  useEffect(() => {
    if (isOwner) {
      fetchAdminData();
    }
  }, [isOwner]);

  async function fetchAdminData() {
    // Fetch batches
    const { data: batchData } = await supabase.from('batches').select('*').order('created_at', { ascending: false });
    // Fetch enrollments with full details
    const { data: enrollData } = await supabase.from('enrollments').select('*').order('created_at', { ascending: false });
    
    if (batchData) setBatches(batchData);
    if (enrollData) setStudents(enrollData);
  }

  async function handleAddBatch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const tagsArray = newBatch.hashtags.split(',').map(t => t.trim().toLowerCase());
    
    const { error } = await supabase.from('batches').insert([{
      name: newBatch.name,
      price: newBatch.price,
      color: newBatch.color,
      hashtags: tagsArray,
      tag: 'ONLINE'
    }]);

    if (!error) {
      setNewBatch({ name: '', price: '', color: '#6c63ff', hashtags: '' });
      fetchAdminData();
      alert("Batch successfully launched!");
    } else {
      alert("Error: " + error.message);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (confirm("Are you sure? This will remove the course for everyone.")) {
      await supabase.from('batches').delete().eq('id', id);
      fetchAdminData();
    }
  }

  if (status === "loading") return <div style={{padding:'50px'}}>Checking Authorization...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'sans-serif', background: '#fcfdfe', minHeight: '100vh' }}>
      
      {/* 1. HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <Link href="/neet" style={{ color: '#5b6cfd', fontWeight: 'bold', textDecoration: 'none' }}>← Back to Neet Page</Link>
          <h1 style={{ fontSize: '32px', marginTop: '10px', fontWeight: '900' }}>Admin Control Center</h1>
        </div>
        <div style={{ textAlign: 'right', padding: '15px', background: '#fff', borderRadius: '12px', border: '1px solid #eee' }}>
            <div style={{fontSize: '13px', fontWeight: 'bold', color: isOwner ? 'green' : 'red'}}>
             {isOwner ? "👑 OWNER ACCESS GRANTED" : "🚫 UNAUTHORIZED"}
            </div>
            <div style={{fontSize: '12px', color: '#666'}}>{session?.user?.email}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '30px' }}>
        
        {/* 2. ADD NEW BATCH FORM */}
        <div style={adminCard}>
          <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>🚀 Create New Batch</h2>
          <form onSubmit={handleAddBatch} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
              style={inputStyle} placeholder="Course Name (e.g. Yakeen NEET 2.0)" 
              value={newBatch.name} onChange={e => setNewBatch({...newBatch, name: e.target.value})} required 
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input 
                style={inputStyle} placeholder="Price (e.g. 6,000)" 
                value={newBatch.price} onChange={e => setNewBatch({...newBatch, price: e.target.value})} 
                />
                <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{fontSize: '11px'}}>Color:</label>
                <input type="color" value={newBatch.color} style={{border:'none', width:'100%', height:'20px', cursor:'pointer'}} onChange={e => setNewBatch({...newBatch, color: e.target.value})} />
                </div>
            </div>
            <input 
              style={inputStyle} placeholder="Tags (comma separated)" 
              value={newBatch.hashtags} onChange={e => setNewBatch({...newBatch, hashtags: e.target.value})} 
            />
            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? 'Processing...' : 'Deploy Batch'}
            </button>
          </form>
        </div>

        {/* 3. STUDENT TRACKER (DETAILED VERSION) */}
        <div style={adminCard}>
          <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>👨‍🎓 Recent Enrollments ({students.length})</h2>
          <div style={{ maxHeight: '600px', overflowY: 'auto', borderRadius: '12px', border: '1px solid #f0f0f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f9f9fb', zIndex: 10 }}>
                <tr style={{ textAlign: 'left', fontSize: '12px', color: '#999', borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '15px' }}>STUDENT NAME</th>
                  <th style={{ padding: '15px' }}>BATCH ENROLLED</th>
                  <th style={{ padding: '15px' }}>DATE & TIME</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <motion.tr 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    key={i} 
                    style={{ borderBottom: '1px solid #f6f6f6' }}
                  >
                    <td style={{ padding: '15px' }}>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a1a1a' }}>{s.student_name || "New Student"}</div>
                        <div style={{ fontSize: '12px', color: '#5b6cfd' }}>{s.student_email}</div>
                    </td>
                    <td style={{ padding: '15px' }}>
                        <span style={{ background: '#eef2ff', color: '#5b6cfd', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                            {s.batch_name || s.batch_id}
                        </span>
                    </td>
                    <td style={{ padding: '15px', fontSize: '13px', color: '#777' }}>
                        {new Date(s.created_at).toLocaleString('en-IN', { 
                            day: '2-digit', 
                            month: 'short', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. ACTIVE BATCHES MANAGEMENT */}
        <div style={{ ...adminCard, gridColumn: 'span 2' }}>
          <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>📦 Live Website Batches</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {batches.map(b => (
              <div key={b.id} style={{ padding: '20px', borderRadius: '18px', border: `1px solid #eee`, borderLeft: `6px solid ${b.color}`, background: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <div style={{ fontWeight: '900', fontSize: '18px', color: '#1a1a1a' }}>{b.name}</div>
                <div style={{ fontSize: '13px', color: '#666', margin: '8px 0' }}>Price: <b>₹{b.price}</b> | Tags: {b.hashtags?.join(', ')}</div>
                <button 
                  onClick={() => handleDelete(b.id)}
                  style={{ marginTop: '10px', background: '#fff0f0', color: '#ff4757', border: '1px solid #ffdada', padding: '8px 15px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                >
                  Remove from Website
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

const adminCard: any = { background: '#fff', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0' };
const inputStyle: any = { padding: '15px', borderRadius: '12px', border: '1px solid #eee', fontSize: '14px', background: '#f9f9fb', outline: 'none' };
const btnStyle: any = { padding: '18px', borderRadius: '14px', background: '#5b6cfd', color: '#fff', border: 'none', fontWeight: '900', cursor: 'pointer', transition: '0.3s' };