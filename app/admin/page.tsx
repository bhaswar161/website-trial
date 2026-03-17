"use client";
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from "../context/ThemeContext";

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const { isDarkMode } = useTheme();
  
  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [newBatch, setNewBatch] = useState({ name: '', price: '', color: '#6c63ff', hashtags: '' });
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const supabase = useMemo(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const isOwner = session?.user?.email === "bhaswarray@gmail.com";

  useEffect(() => {
    setMounted(true);
    if (status === "unauthenticated" || (status === "authenticated" && !isOwner)) {
      redirect("/");
    }
  }, [status, isOwner]);

  useEffect(() => {
    if (isOwner) fetchAdminData();
  }, [isOwner]);

  async function fetchAdminData() {
    const { data: batchData } = await supabase.from('batches').select('*').order('created_at', { ascending: false });
    const { data: enrollData } = await supabase.from('enrollments').select('*').order('created_at', { ascending: false });
    if (batchData) setBatches(batchData);
    if (enrollData) setStudents(enrollData);
  }

  async function handleAddBatch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const tagsArray = newBatch.hashtags.split(',').map(t => t.trim().toLowerCase());
    const { error } = await supabase.from('batches').insert([{
      name: newBatch.name, price: newBatch.price, color: newBatch.color, hashtags: tagsArray, tag: 'ONLINE'
    }]);
    if (!error) {
      setNewBatch({ name: '', price: '', color: '#6c63ff', hashtags: '' });
      fetchAdminData();
      alert("🚀 Batch launched successfully!");
    } else alert(error.message);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (confirm("🚨 Dangerous Action: Delete this batch?")) {
      await supabase.from('batches').delete().eq('id', id);
      fetchAdminData();
    }
  }

  // Theme logic
  const theme = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    card: isDarkMode ? '#1e293b' : '#ffffff',
    text: isDarkMode ? '#f8fafc' : '#1c252e',
    subtext: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    input: isDarkMode ? '#0f172a' : '#f1f5f9'
  };

  if (!mounted || status === "loading") return <div style={{background: '#0f172a', height: '100vh', color: '#fff', padding: '50px'}}>Checking Authorization...</div>;

  return (
    <div style={{ padding: '40px 5%', background: theme.bg, minHeight: '100vh', color: theme.text, transition: '0.4s', fontFamily: 'sans-serif' }}>
      
      {/* 1. HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <Link href="/neet" style={{ color: '#5b6cfd', fontWeight: '800', textDecoration: 'none', fontSize: '14px' }}>← BACK TO NEET PAGE</Link>
          <h1 style={{ fontSize: '36px', fontWeight: '900', marginTop: '10px', letterSpacing: '-1px' }}>Control Center</h1>
        </div>
        
        <div style={{ display: 'flex', gap: '15px' }}>
            <Link href="/admin/payments" style={{ textDecoration: 'none' }}>
                <motion.button whileHover={{ scale: 1.05 }} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '14px', fontWeight: '900', cursor: 'pointer' }}>
                   💰 VERIFY PAYMENTS
                </motion.button>
            </Link>
            <div style={{ textAlign: 'right', padding: '12px 20px', background: theme.card, borderRadius: '16px', border: `1px solid ${theme.border}` }}>
                <div style={{ fontSize: '11px', fontWeight: '900', color: '#5b6cfd' }}>ADMIN LOGGED IN</div>
                <div style={{ fontSize: '13px', fontWeight: '700' }}>{session?.user?.email}</div>
            </div>
        </div>
      </header>

      {/* 2. STATS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
         <StatCard label="Total Revenue" value={`₹${(students.length * 4500).toLocaleString()}`} icon="💎" color="#10b981" theme={theme} />
         <StatCard label="Enrolled Students" value={students.length} icon="👨‍🎓" color="#5b6cfd" theme={theme} />
         <StatCard label="Live Batches" value={batches.length} icon="📦" color="#f59e0b" theme={theme} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '30px' }}>
        
        {/* 3. CREATE BATCH */}
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ background: theme.card, padding: '35px', borderRadius: '28px', border: `1px solid ${theme.border}`, height: 'fit-content' }}>
          <h2 style={{ marginBottom: '25px', fontSize: '22px', fontWeight: '900' }}>🚀 Launch Batch</h2>
          <form onSubmit={handleAddBatch} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '800', color: theme.subtext }}>COURSE NAME</label>
                <input style={{ ...inputStyle, background: theme.input, color: theme.text, border: `1px solid ${theme.border}` }} placeholder="e.g. Yakeen NEET 2026" value={newBatch.name} onChange={e => setNewBatch({...newBatch, name: e.target.value})} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '800', color: theme.subtext }}>PRICE (₹)</label>
                    <input style={{ ...inputStyle, background: theme.input, color: theme.text, border: `1px solid ${theme.border}` }} placeholder="4500" value={newBatch.price} onChange={e => setNewBatch({...newBatch, price: e.target.value})} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '800', color: theme.subtext }}>THEME COLOR</label>
                    <input type="color" value={newBatch.color} style={{ width: '100%', height: '48px', border: 'none', borderRadius: '12px', cursor: 'pointer', background: 'none' }} onChange={e => setNewBatch({...newBatch, color: e.target.value})} />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '800', color: theme.subtext }}>TAGS (COMMA SEPARATED)</label>
                <input style={{ ...inputStyle, background: theme.input, color: theme.text, border: `1px solid ${theme.border}` }} placeholder="neet, biology, physics" value={newBatch.hashtags} onChange={e => setNewBatch({...newBatch, hashtags: e.target.value})} />
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} style={{ padding: '20px', borderRadius: '16px', background: '#5b6cfd', color: '#fff', border: 'none', fontWeight: '900', cursor: 'pointer', fontSize: '16px', marginTop: '10px' }}>
              {loading ? 'Processing...' : 'DEPLOY BATCH'}
            </motion.button>
          </form>
        </motion.div>

        {/* 4. RECENT ENROLLMENTS */}
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ background: theme.card, padding: '35px', borderRadius: '28px', border: `1px solid ${theme.border}` }}>
          <h2 style={{ marginBottom: '25px', fontSize: '22px', fontWeight: '900' }}>👨‍🎓 Latest Enrollments</h2>
          <div style={{ maxHeight: '550px', overflowY: 'auto', borderRadius: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: theme.card, zIndex: 10 }}>
                <tr style={{ textAlign: 'left', fontSize: '11px', color: theme.subtext, borderBottom: `1px solid ${theme.border}` }}>
                  <th style={{ padding: '15px' }}>STUDENT</th>
                  <th style={{ padding: '15px' }}>BATCH</th>
                  <th style={{ padding: '15px' }}>DATE</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <td style={{ padding: '15px' }}>
                        <div style={{ fontWeight: '800', fontSize: '14px' }}>{s.student_name}</div>
                        <div style={{ fontSize: '12px', color: '#5b6cfd', fontWeight: '700' }}>{s.student_email}</div>
                    </td>
                    <td style={{ padding: '15px' }}>
                        <span style={{ background: isDarkMode ? '#1e293b' : '#eef2ff', color: '#5b6cfd', padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', border: isDarkMode ? '1px solid #5b6cfd' : 'none' }}>
                            {s.batch_id.toUpperCase()}
                        </span>
                    </td>
                    <td style={{ padding: '15px', fontSize: '12px', color: theme.subtext, fontWeight: '700' }}>
                        {new Date(s.enrolled_at || s.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* 5. BATCH MANAGEMENT GRID */}
        <div style={{ gridColumn: 'span 2', marginTop: '20px' }}>
          <h2 style={{ marginBottom: '25px', fontSize: '22px', fontWeight: '900' }}>📦 Live Website Batches</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {batches.map(b => (
              <motion.div whileHover={{ y: -5 }} key={b.id} style={{ padding: '25px', borderRadius: '24px', border: `1px solid ${theme.border}`, borderLeft: `8px solid ${b.color}`, background: theme.card, position: 'relative' }}>
                <div style={{ fontWeight: '900', fontSize: '18px' }}>{b.name}</div>
                <div style={{ fontSize: '13px', color: theme.subtext, margin: '10px 0', fontWeight: '700' }}>
                    PRICE: <span style={{color: '#10b981'}}>₹{b.price}</span> <br/>
                    TAGS: {b.hashtags?.join(', ')}
                </div>
                <button onClick={() => handleDelete(b.id)} style={{ marginTop: '15px', background: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : '#fff0f0', color: '#ef4444', border: `1px solid ${isDarkMode ? '#ef4444' : '#ffdada'}`, padding: '10px 18px', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '12px', width: '100%' }}>
                  REMOVE FROM WEBSITE
                </button>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

// Helper Components
function StatCard({ label, value, icon, color, theme }: any) {
    return (
        <motion.div whileHover={{ y: -5 }} style={{ background: theme.card, padding: '25px', borderRadius: '24px', border: `1px solid theme.border`, borderBottom: `4px solid ${color}`, display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ fontSize: '32px', background: `${color}15`, padding: '15px', borderRadius: '18px' }}>{icon}</div>
            <div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: theme.subtext, textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: '24px', fontWeight: '900' }}>{value}</div>
            </div>
        </motion.div>
    );
}

const inputStyle: any = { padding: '15px', borderRadius: '12px', fontSize: '14px', outline: 'none', transition: '0.3s' };
