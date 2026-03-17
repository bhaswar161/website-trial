"use client";
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from "../../context/ThemeContext";

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const { isDarkMode } = useTheme();
  
  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [newBatch, setNewBatch] = useState({ name: '', price: '', color: '#6c63ff', hashtags: '' });
  const [loading, setLoading] = useState(false);
  const [mailingId, setMailingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<any | null>(null);

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
    const { data: enrollData } = await supabase.from('enrollments').select('*').order('enrolled_at', { ascending: false });
    if (batchData) setBatches(batchData);
    if (enrollData) setStudents(enrollData);
  }

  // --- CALCULATED STATS ---
  const totalRevenue = useMemo(() => {
    return students.reduce((acc, curr) => acc + (Number(curr.amount) || 4500), 0);
  }, [students]);

  const uniqueStudentCount = useMemo(() => {
    const emails = students.map(s => s.student_email);
    return new Set(emails).size;
  }, [students]);

  const batchStats = useMemo(() => {
    return batches.map(batch => {
      const count = students.filter(s => s.batch_id === batch.id || s.batch_id === batch.name).length;
      return { ...batch, studentCount: count };
    });
  }, [batches, students]);

  async function handleSendMail(student: any) {
    setMailingId(student.id);
    try {
      const res = await fetch('/api/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: student.student_email,
          name: student.student_name,
          batch: student.batch_id
        }),
      });
      if (res.ok) alert(`✅ Mail sent to ${student.student_email}`);
      else throw new Error();
    } catch (err) {
      alert("❌ Mail API Error.");
    } finally { setMailingId(null); }
  }

  async function handleAddBatch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('batches').insert([{
      name: newBatch.name, price: newBatch.price, color: newBatch.color, hashtags: newBatch.hashtags.split(','), tag: 'ONLINE'
    }]);
    if (!error) {
      setNewBatch({ name: '', price: '', color: '#6c63ff', hashtags: '' });
      fetchAdminData();
      alert("🚀 Batch launched!");
    }
    setLoading(false);
  }

  const theme = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    card: isDarkMode ? '#1e293b' : '#ffffff',
    text: isDarkMode ? '#f8fafc' : '#1c252e',
    subtext: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    input: isDarkMode ? '#0f172a' : '#f1f5f9'
  };

  if (!mounted || status === "loading") return <div style={{background: '#0f172a', height: '100vh', color: '#fff', padding: '50px'}}>Loading Admin...</div>;

  return (
    <div style={{ padding: '40px 5%', background: theme.bg, minHeight: '100vh', color: theme.text, transition: '0.4s', fontFamily: 'sans-serif' }}>
      
      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <Link href="/neet" style={{ color: '#5b6cfd', fontWeight: '800', textDecoration: 'none', fontSize: '14px' }}>← BACK</Link>
          <h1 style={{ fontSize: '36px', fontWeight: '900', marginTop: '10px' }}>Control Center</h1>
        </div>
        <Link href="/admin/payments" style={{ textDecoration: 'none' }}>
            <motion.button whileHover={{ scale: 1.05 }} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '14px', fontWeight: '900', cursor: 'pointer' }}>
                💰 VERIFY PAYMENTS
            </motion.button>
        </Link>
      </header>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
         <StatCard label="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} icon="💎" color="#10b981" theme={theme} />
         <StatCard label="Unique Students" value={uniqueStudentCount} icon="👤" color="#5b6cfd" theme={theme} />
         <StatCard label="Total Enrollments" value={students.length} icon="👨‍🎓" color="#6366f1" theme={theme} />
         <StatCard label="Active Batches" value={batches.length} icon="📦" color="#f59e0b" theme={theme} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '30px' }}>
        
        {/* LEFT COLUMN: CREATE & BATCH LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ background: theme.card, padding: '30px', borderRadius: '28px', border: `1px solid ${theme.border}` }}>
              <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '900' }}>🚀 New Batch</h2>
              <form onSubmit={handleAddBatch} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input style={{ ...inputStyle, background: theme.input, color: theme.text, border: `1px solid ${theme.border}` }} placeholder="Batch Name" value={newBatch.name} onChange={e => setNewBatch({...newBatch, name: e.target.value})} required />
                <input style={{ ...inputStyle, background: theme.input, color: theme.text, border: `1px solid ${theme.border}` }} placeholder="Price (Numeric)" value={newBatch.price} onChange={e => setNewBatch({...newBatch, price: e.target.value})} />
                <input style={{ ...inputStyle, background: theme.input, color: theme.text, border: `1px solid ${theme.border}` }} placeholder="Tags (Physics, Bio)" value={newBatch.hashtags} onChange={e => setNewBatch({...newBatch, hashtags: e.target.value})} />
                <button type="submit" disabled={loading} style={{ ...btnStyle, background: '#5b6cfd' }}>LAUNCH</button>
              </form>
            </div>

            {/* BATCH WISE DISTRIBUTION */}
            <div style={{ background: theme.card, padding: '30px', borderRadius: '28px', border: `1px solid ${theme.border}` }}>
                <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '900' }}>📦 Batch Wise Analytics</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {batchStats.map((b, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderRadius: '14px', background: theme.input }}>
                            <span style={{ fontWeight: 700 }}>{b.name}</span>
                            <span style={{ fontWeight: 900, color: '#5b6cfd' }}>{b.studentCount} Students</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: ENROLLMENTS */}
        <div style={{ background: theme.card, padding: '30px', borderRadius: '28px', border: `1px solid ${theme.border}` }}>
          <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '900' }}>👨‍🎓 Recent Joinings</h2>
          <div style={{ maxHeight: '700px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', fontSize: '11px', color: theme.subtext, borderBottom: `1px solid ${theme.border}` }}>
                  <th style={{ padding: '15px' }}>STUDENT</th>
                  <th style={{ padding: '15px' }}>BATCH</th>
                  <th style={{ padding: '15px' }}>JOINED ON</th>
                  <th style={{ padding: '15px' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <td style={{ padding: '15px' }}>
                        <div onClick={() => setViewingProfile(s)} style={{ fontWeight: '800', cursor: 'pointer', color: '#5b6cfd' }}>{s.student_name} 👤</div>
                        <div style={{ fontSize: '11px', opacity: 0.6 }}>{s.student_email}</div>
                    </td>
                    <td style={{ padding: '15px' }}>
                        <span style={{ background: isDarkMode ? '#334155' : '#eef2ff', color: '#5b6cfd', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '900' }}>
                            {s.batch_id}
                        </span>
                    </td>
                    <td style={{ padding: '15px', fontSize: '12px', fontWeight: 600 }}>
                        {new Date(s.enrolled_at || s.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '15px' }}>
                        <button 
                          onClick={() => handleSendMail(s)}
                          disabled={mailingId === s.id}
                          style={{ background: '#5b6cfd', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: '900', cursor: 'pointer' }}
                        >
                          {mailingId === s.id ? "..." : "📩 MAIL"}
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PROFILE MODAL */}
      <AnimatePresence>
        {viewingProfile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewingProfile(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ background: theme.card, padding: '40px', borderRadius: '30px', width: '450px', border: `1px solid ${theme.border}` }}>
                <h2 style={{ fontWeight: 900, marginBottom: '20px' }}>Student Profile</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                   <p><b>Name:</b> {viewingProfile.student_name}</p>
                   <p><b>Email:</b> {viewingProfile.student_email}</p>
                   <p><b>Batch:</b> {viewingProfile.batch_id}</p>
                   <p><b>Joined:</b> {new Date(viewingProfile.enrolled_at).toLocaleString()}</p>
                </div>
                <button onClick={() => setViewingProfile(null)} style={{ width: '100%', padding: '15px', borderRadius: '15px', background: '#5b6cfd', color: '#fff', border: 'none', fontWeight: 800, marginTop: '20px', cursor: 'pointer' }}>Close</button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StatCard({ label, value, icon, color, theme }: any) {
    return (
        <div style={{ background: theme.card, padding: '25px', borderRadius: '24px', border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ fontSize: '30px', background: `${color}15`, padding: '15px', borderRadius: '18px' }}>{icon}</div>
            <div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: theme.subtext }}>{label}</div>
                <div style={{ fontSize: '24px', fontWeight: '900' }}>{value}</div>
            </div>
        </div>
    );
}

const inputStyle: any = { padding: '15px', borderRadius: '12px', outline: 'none' };
const btnStyle: any = { padding: '15px', borderRadius: '12px', color: '#fff', border: 'none', fontWeight: '900', cursor: 'pointer' };
