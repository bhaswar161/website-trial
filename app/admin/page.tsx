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
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // student, email, batch, cost
  
  const [removingStudent, setRemovingStudent] = useState<any | null>(null);
  const [removalReason, setRemovalReason] = useState("");

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
    setLoading(true);
    const { data: enrollData } = await supabase
      .from('enrollments')
      .select('*')
      .order('enrolled_at', { ascending: false });
    if (enrollData) setStudents(enrollData);
    setLoading(false);
  }

  const totalRevenue = useMemo(() => {
    return students.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [students]);

  // --- IMPROVED MULTI-FILTER LOGIC ---
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const query = searchQuery.toLowerCase();
      if (filterType === "student") return s.student_name?.toLowerCase().includes(query);
      if (filterType === "email") return s.student_email?.toLowerCase().includes(query);
      if (filterType === "batch") return s.batch_id?.toLowerCase().includes(query);
      if (filterType === "cost") return s.amount?.toString().includes(query);
      
      // Default "All" search
      return (
        s.student_name?.toLowerCase().includes(query) ||
        s.student_email?.toLowerCase().includes(query) ||
        s.batch_id?.toLowerCase().includes(query)
      );
    });
  }, [students, searchQuery, filterType]);

  async function handleRemoveStudent() {
    if (!removalReason) return alert("Please provide a reason.");
    try {
      await supabase.from('enrollments').delete().eq('id', removingStudent.id);
      alert(`✅ ${removingStudent.student_name} removed.`);
      setRemovingStudent(null);
      fetchAdminData();
    } catch (err: any) { alert(err.message); }
  }

  const theme = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    card: isDarkMode ? '#1e293b' : '#ffffff',
    text: isDarkMode ? '#f8fafc' : '#1c252e',
    subtext: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    input: isDarkMode ? '#0f172a' : '#f1f5f9'
  };

  const exportToExcel = () => {
    alert("Functionality triggered: Exporting data to Google Excel format...");
    // Logic for xlsx or csv download goes here
  };

  if (!mounted || status === "loading") return null;

  return (
    <div style={{ padding: '40px 5%', background: theme.bg, minHeight: '100vh', color: theme.text, transition: '0.4s', fontFamily: 'sans-serif' }}>
      
      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
           <Link href="/neet" style={{ color: '#5b6cfd', fontWeight: '800', textDecoration: 'none' }}>← BACK TO NEET</Link>
           <h1 style={{ fontSize: '36px', fontWeight: '900', marginTop: '5px' }}>Admin Dashboard</h1>
        </div>
        <Link href="/admin/payments" style={{ textDecoration: 'none' }}>
            <motion.button whileHover={{ scale: 1.05 }} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: '16px', fontWeight: '900', cursor: 'pointer' }}>
                💰 VERIFY PAYMENTS
            </motion.button>
        </Link>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '30px' }}>
        
        {/* LEFT SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: theme.card, padding: '20px', borderRadius: '24px', border: `1px solid ${theme.border}` }}>
                <p style={{ fontSize: '12px', fontWeight: 800, color: theme.subtext, marginBottom: '15px' }}>ACTIONS</p>
                <motion.button 
                    whileHover={{ x: 5 }}
                    onClick={exportToExcel}
                    style={{ width: '100%', background: '#1d6f42', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                >
                    📗 Excel
                </motion.button>
            </div>
            
            <StatCard label="Paid Revenue" value={`₹${totalRevenue}`} color="#10b981" theme={theme} small />
            <StatCard label="Total Students" value={new Set(students.map(s => s.student_email)).size} color="#5b6cfd" theme={theme} small />
        </div>

        {/* MAIN CONTENT */}
        <div style={{ background: theme.card, padding: '30px', borderRadius: '32px', border: `1px solid ${theme.border}`, boxShadow: '0 15px 35px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '900' }}>Recent Joinings</h2>
            
            <div style={{ display: 'flex', gap: '10px' }}>
                <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    style={{ padding: '10px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: theme.input, color: theme.text, fontWeight: 700, outline: 'none' }}
                >
                    <option value="all">All Fields</option>
                    <option value="student">Student Name</option>
                    <option value="email">Email ID</option>
                    <option value="batch">Batch Name</option>
                    <option value="cost">Amount</option>
                </select>
                <input 
                    style={{ padding: '12px 20px', borderRadius: '15px', border: `1px solid ${theme.border}`, background: theme.input, color: theme.text, width: '300px', outline: 'none' }} 
                    placeholder={`Search by ${filterType}...`} 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
          </div>
          
          <div style={{ maxHeight: '750px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', fontSize: '11px', color: theme.subtext, borderBottom: `2px solid ${theme.border}`, letterSpacing: '1px' }}>
                  <th style={{ padding: '15px' }}>STUDENT NAME</th>
                  <th>EMAIL ADDRESS</th>
                  <th>BATCH NAME</th>
                  <th>COST PAID</th>
                  <th>JOINED DATE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <td style={{ padding: '15px', fontWeight: '800', color: '#5b6cfd' }}>{s.student_name}</td>
                    <td style={{ fontSize: '12px', fontWeight: 600 }}>{s.student_email}</td>
                    <td style={{ fontSize: '12px', fontWeight: 800 }}>{s.batch_id}</td>
                    <td style={{ fontWeight: 900, color: '#10b981' }}>₹{s.amount || '0'}</td>
                    <td style={{ fontSize: '12px', opacity: 0.7 }}>{new Date(s.enrolled_at).toLocaleDateString()}</td>
                    <td>
                        <button onClick={() => setRemovingStudent(s)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: '900', cursor: 'pointer' }}>
                           REMOVE
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* REMOVAL MODAL */}
      <AnimatePresence>
          {removingStudent && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: theme.card, padding: '30px', borderRadius: '24px', width: '400px', border: `1px solid ${theme.border}` }}>
                   <h2 style={{ fontWeight: 900 }}>Remove Access</h2>
                   <p style={{ fontSize: '13px', color: theme.subtext, marginBottom: '15px' }}>Enter reason for removing {removingStudent.student_name}:</p>
                   <textarea style={{ width: '100%', height: '100px', borderRadius: '12px', background: theme.input, color: theme.text, padding: '10px', border: 'none', outline: 'none' }} value={removalReason} onChange={(e) => setRemovalReason(e.target.value)} />
                   <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                      <button onClick={() => setRemovingStudent(null)} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#ccc', border: 'none' }}>Cancel</button>
                      <button onClick={handleRemoveStudent} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#ef4444', color: '#fff', border: 'none', fontWeight: 800 }}>Remove</button>
                   </div>
                </div>
             </motion.div>
          )}
      </AnimatePresence>
    </div>
  )
}

function StatCard({ label, value, color, theme, small }: any) {
    return (
        <div style={{ background: theme.card, padding: small ? '15px' : '25px', borderRadius: '20px', border: `1px solid ${theme.border}`, borderLeft: `5px solid ${color}` }}>
            <div style={{ fontSize: '10px', fontWeight: '800', color: theme.subtext, textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: '18px', fontWeight: '900' }}>{value}</div>
        </div>
    );
}
