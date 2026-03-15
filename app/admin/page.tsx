'use client'
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

  // Security: Kick out non-admins immediately
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
    const { data: batchData } = await supabase.from('batches').select('*').order('created_at', { ascending: false });
    const { data: enrollData } = await supabase.from('enrollments').select('*');
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
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif', background: '#fcfdfe', minHeight: '100vh' }}>
      
      {/* 1. DEBUG HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <Link href="/" style={{ color: '#5b6cfd', fontWeight: 'bold', textDecoration: 'none' }}>← Home</Link>
          <h1 style={{ fontSize: '32px', marginTop: '10px' }}>Admin Control Center</h1>
        </div>
        <div style={{ textAlign: 'right', padding: '15px', background: '#fff', borderRadius: '12px', border: '1px solid #eee' }}>
           <div style={{fontSize: '13px', fontWeight: 'bold', color: isOwner ? 'green' : 'red'}}>
            {isOwner ? "👑 OWNER ACCESS GRANTED" : "🚫 UNAUTHORIZED"}
           </div>
           <div style={{fontSize: '12px', color: '#666'}}>{session?.user?.email}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        
        {/* 2. ADD NEW BATCH FORM */}
        <div style={adminCard}>
          <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>🚀 Create New Batch</h2>
          <form onSubmit={handleAddBatch} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
              style={inputStyle} placeholder="Course Name (e.g. Yakeen NEET 2.0)" 
              value={newBatch.name} onChange={e => setNewBatch({...newBatch, name: e.target.value})} required 
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input 
                style={inputStyle} placeholder="Display Price (e.g. 6,000)" 
                value={newBatch.price} onChange={e => setNewBatch({...newBatch, price: e.target.value})} 
                />
                <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{fontSize: '12px'}}>Theme:</label>
                <input type="color" value={newBatch.color} style={{border:'none', width:'100%'}} onChange={e => setNewBatch({...newBatch, color: e.target.value})} />
                </div>
            </div>
            <input 
              style={inputStyle} placeholder="Tags (e.g. #all, #class 11, #dropper)" 
              value={newBatch.hashtags} onChange={e => setNewBatch({...newBatch, hashtags: e.target.value})} 
            />
            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? 'Processing...' : 'Deploy Batch to Website'}
            </button>
          </form>
        </div>

        {/* 3. STUDENT TRACKER */}
        <div style={adminCard}>
          <h2 style={{ marginBottom: '20px' }}>👨‍🎓 Enrolled Students ({students.length})</h2>
          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f0f0f0', textAlign: 'left', fontSize: '12px', color: '#999' }}>
                  <th style={{ padding: '10px' }}>STUDENT</th>
                  <th style={{ padding: '10px' }}>BATCH ID</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f9f9f9' }}>
                    <td style={{ padding: '12px', fontSize: '13px', fontWeight: '600' }}>{s.student_email}</td>
                    <td style={{ padding: '12px', fontSize: '11px', color: '#888' }}>{s.batch_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. ACTIVE BATCHES MANAGEMENT (NEW FEATURE) */}
        <div style={{ ...adminCard, gridColumn: 'span 2' }}>
          <h2 style={{ marginBottom: '20px' }}>📦 Live Website Batches</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {batches.map(b => (
              <div key={b.id} style={{ padding: '20px', borderRadius: '15px', border: `2px solid ${b.color}`, background: '#fff' }}>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{b.name}</div>
                <div style={{ fontSize: '12px', color: '#888', margin: '5px 0' }}>Price: ₹{b.price} | Tags: {b.hashtags?.join(', ')}</div>
                <button 
                  onClick={() => handleDelete(b.id)}
                  style={{ marginTop: '10px', background: '#fff0f0', color: '#ff4757', border: 'none', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                >
                  Delete Course
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