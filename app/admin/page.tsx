"use client";
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
// FIXED PATH: Adjust the number of dots based on your folder structure
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

  // --- EMAIL CONFIRMATION LOGIC ---
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

      if (res.ok) {
        alert(`✅ Confirmation mail sent to ${student.student_email}`);
      } else {
        throw new Error("Failed to send mail");
      }
    } catch (err) {
      alert("❌ Error sending mail. Make sure your API route is set up.");
    } finally {
      setMailingId(null);
    }
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
      alert("🚀 Batch launched!");
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (confirm("🚨 Delete this batch?")) {
      await supabase.from('batches').delete().eq('id', id);
      fetchAdminData();
    }
  }

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
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <Link href="/neet" style={{ color: '#5b6cfd', fontWeight: '800', textDecoration: 'none', fontSize: '14px' }}>← BACK</Link>
          <h1 style={{ fontSize: '36px', fontWeight: '900', marginTop: '10px' }}>Control Center</h1>
        </div>
        
        <div style={{ display: 'flex', gap: '15px' }}>
            <Link href="/admin/payments" style={{ textDecoration: 'none' }}>
                <motion.button whileHover={{ scale: 1.05 }} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '14px', fontWeight: '900', cursor: 'pointer' }}>
                   💰 VERIFY PAYMENTS
                </motion.button>
            </Link>
            <div style={{ textAlign: 'right', padding: '12px 20px', background: theme.card, borderRadius: '16px', border: `1px solid ${theme.border}` }}>
                <div style={{ fontSize: '11px', fontWeight: '900', color: '#5b6cfd' }}>ADMIN</div>
                <div style={{ fontSize: '13px', fontWeight: '700' }}>{session?.user?.email}</div>
            </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
         <StatCard label="Revenue" value={`₹${(students.length * 4500).toLocaleString()}`} icon="💎" color="#10b981" theme={theme} />
         <StatCard label="Students" value={students.length} icon="👨‍🎓" color="#5b6cfd" theme={theme} />
         <StatCard label="Live" value={batches.length} icon="📦" color="#f59e0b" theme={theme} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
        
        {/* CREATE BATCH FORM */}
        <div style={{ background: theme.card, padding: '30px', borderRadius: '28px', border: `1px solid ${theme.border}`, height: 'fit-content' }}>
          <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '900' }}>🚀 New Batch</h2>
          <form onSubmit={handleAddBatch} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input style={{ ...inputStyle, background: theme.input, color: theme.text, border: `1px solid ${theme.border}` }} placeholder="Name" value={newBatch.name} onChange={e => setNewBatch({...newBatch, name: e.target.value})} required />
            <input style={{ ...inputStyle, background: theme.input, color: theme.text, border: `1px solid ${theme.border}` }} placeholder="Price" value={newBatch.price} onChange={e => setNewBatch({...newBatch, price: e.target.value})} />
            <input style={{ ...inputStyle, background: theme.input, color: theme.text, border: `1px solid ${theme.border}` }} placeholder="Tags" value={newBatch.hashtags} onChange={e => setNewBatch({...newBatch, hashtags: e.target.value})} />
            <button type="submit" disabled={loading} style={{ ...btnStyle, background: '#5b6cfd' }}>LAUNCH</button>
          </form>
        </div>

        {/* ENROLLMENTS TABLE */}
        <div style={{ background: theme.card, padding: '30px', borderRadius: '28px', border: `1px solid ${theme.border}` }}>
          <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '900' }}>👨‍🎓 Enrollments</h2>
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', fontSize: '11px', color: theme.subtext, borderBottom: `1px solid ${theme.border}` }}>
                  <th style={{ padding: '15px' }}>STUDENT</th>
                  <th style={{ padding: '15px' }}>BATCH</th>
                  <th style={{ padding: '15px' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <td style={{ padding: '15px' }}>
                        <div style={{ fontWeight: '800' }}>{s.student_name}</div>
                        <div style={{ fontSize: '11px', color: '#5b6cfd' }}>{s.student_email}</div>
                    </td>
                    <td style={{ padding: '15px', fontSize: '12px' }}>{s.batch_id}</td>
                    <td style={{ padding: '15px' }}>
                        <button 
                          onClick={() => handleSendMail(s)}
                          disabled={mailingId === s.id}
                          style={{ 
                            background: mailingId === s.id ? '#ccc' : '#5b6cfd', 
                            color: '#fff', border: 'none', padding: '8px 12px', 
                            borderRadius: '8px', fontSize: '10px', fontWeight: '900', cursor: 'pointer' 
                          }}
                        >
                          {mailingId === s.id ? "SENDING..." : "📩 SEND MAIL"}
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color, theme }: any) {
    return (
        <div style={{ background: theme.card, padding: '20px', borderRadius: '24px', border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ fontSize: '24px', background: `${color}15`, padding: '10px', borderRadius: '12px' }}>{icon}</div>
            <div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: theme.subtext }}>{label}</div>
                <div style={{ fontSize: '20px', fontWeight: '900' }}>{value}</div>
            </div>
        </div>
    );
}

const inputStyle: any = { padding: '12px', borderRadius: '10px', outline: 'none' };
const btnStyle: any = { padding: '15px', borderRadius: '12px', color: '#fff', border: 'none', fontWeight: '900', cursor: 'pointer' };
