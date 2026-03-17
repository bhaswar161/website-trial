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
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [mailingId, setMailingId] = useState<string | null>(null);
  
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
    // Fetch batches to get correct prices
    const { data: bData } = await supabase.from('batches').select('*');
    if (bData) setBatches(bData);

    const { data: enrollData } = await supabase
      .from('enrollments')
      .select('*')
      .order('enrolled_at', { ascending: false });
    
    if (enrollData) {
      // Merge batch prices into enrollment data if 'amount' is missing
      const enrichedData = enrollData.map(enroll => {
        const batchInfo = bData?.find(b => b.id === enroll.batch_id || b.name === enroll.batch_id);
        return {
          ...enroll,
          displayPrice: enroll.amount || batchInfo?.price || "0"
        };
      });
      setStudents(enrichedData);
    }
    setLoading(false);
  }

  const totalRevenue = useMemo(() => {
    return students.reduce((acc, curr) => acc + (Number(curr.displayPrice) || 0), 0);
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const query = searchQuery.toLowerCase();
      if (filterType === "student") return s.student_name?.toLowerCase().includes(query);
      if (filterType === "email") return s.student_email?.toLowerCase().includes(query);
      if (filterType === "batch") return s.batch_id?.toLowerCase().includes(query);
      if (filterType === "cost") return s.displayPrice?.toString().includes(query);
      return (
        s.student_name?.toLowerCase().includes(query) ||
        s.student_email?.toLowerCase().includes(query) ||
        s.batch_id?.toLowerCase().includes(query)
      );
    });
  }, [students, searchQuery, filterType]);

  const handleSendMail = async (student: any) => {
    setMailingId(student.id);
    try {
      const res = await fetch('/api/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: student.student_email, name: student.student_name, batch: student.batch_id }),
      });
      if (res.ok) alert(`✅ Mail sent to ${student.student_email}`);
    } catch (err) { alert("❌ Mail Error"); }
    finally { setMailingId(null); }
  };

  async function handleRemoveStudent() {
    if (!removalReason) return alert("Please provide a reason.");
    try {
      // 1. Send Removal Mail first
      await fetch('/api/send-removal-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: removingStudent.student_email, name: removingStudent.student_name, batch: removingStudent.batch_id, reason: removalReason }),
      });
      // 2. Delete from DB
      await supabase.from('enrollments').delete().eq('id', removingStudent.id);
      alert(`✅ ${removingStudent.student_name} removed and notified.`);
      setRemovingStudent(null);
      setRemovalReason("");
      fetchAdminData();
    } catch (err: any) { alert(err.message); }
  }

  const exportToExcel = () => {
    const headers = "Student Name,Email,Batch,Cost,Date\n";
    const csvContent = filteredStudents.map(s => 
      `${s.student_name},${s.student_email},${s.batch_id},${s.displayPrice},${new Date(s.enrolled_at).toLocaleDateString()}`
    ).join("\n");
    
    const blob = new Blob([headers + csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Enrolled_Students_${new Date().toLocaleDateString()}.csv`;
    a.click();
  };

  const theme = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    card: isDarkMode ? '#1e293b' : '#ffffff',
    text: isDarkMode ? '#f8fafc' : '#1c252e',
    subtext: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    input: isDarkMode ? '#0f172a' : '#f1f5f9'
  };

  if (!mounted || status === "loading") return null;

  return (
    <div style={{ padding: '40px 5%', background: theme.bg, minHeight: '100vh', color: theme.text, transition: '0.4s', fontFamily: 'sans-serif' }}>
      
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
         <StatCard label="True Revenue" value={`₹${totalRevenue.toLocaleString()}`} color="#10b981" theme={theme} />
         <StatCard label="Total Students" value={new Set(students.map(s => s.student_email)).size} color="#5b6cfd" theme={theme} />
      </div>

      <div style={{ background: theme.card, padding: '30px', borderRadius: '32px', border: `1px solid ${theme.border}`, boxShadow: '0 15px 35px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '900' }}>Recent Joinings</h2>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button onClick={exportToExcel} style={{ background: '#1d6f42', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📗 Excel
              </button>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ padding: '10px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: theme.input, color: theme.text, fontWeight: 700 }}>
                  <option value="all">All Fields</option>
                  <option value="student">Name</option>
                  <option value="email">Email</option>
                  <option value="batch">Batch</option>
                  <option value="cost">Cost</option>
              </select>
              <input style={{ padding: '12px 20px', borderRadius: '15px', border: `1px solid ${theme.border}`, background: theme.input, color: theme.text, width: '250px', outline: 'none' }} placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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
                <th style={{ textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <td style={{ padding: '15px', fontWeight: '800', color: '#5b6cfd' }}>{s.student_name}</td>
                  <td style={{ fontSize: '12px', opacity: 0.8 }}>{s.student_email}</td>
                  <td style={{ fontSize: '12px', fontWeight: 800 }}>{s.batch_id}</td>
                  <td style={{ fontWeight: 900, color: '#10b981' }}>₹{s.displayPrice}</td>
                  <td style={{ fontSize: '12px', opacity: 0.7 }}>{new Date(s.enrolled_at).toLocaleDateString()}</td>
                  <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => handleSendMail(s)} disabled={mailingId === s.id} style={{ background: '#5b6cfd', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: '900', cursor: 'pointer' }}>
                           {mailingId === s.id ? "..." : "📩 MAIL"}
                        </button>
                        <button onClick={() => setRemovingStudent(s)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: '900', cursor: 'pointer' }}>
                           REMOVE
                        </button>
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REMOVAL MODAL */}
      <AnimatePresence>
          {removingStudent && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: theme.card, padding: '30px', borderRadius: '24px', width: '400px', border: `1px solid ${theme.border}` }}>
                   <h2 style={{ fontWeight: 900, color: '#ef4444' }}>Revoke Access</h2>
                   <p style={{ fontSize: '13px', color: theme.subtext, marginBottom: '15px' }}>Enter reason (will be sent to student):</p>
                   <textarea style={{ width: '100%', height: '100px', borderRadius: '12px', background: theme.input, color: theme.text, padding: '15px', border: 'none', outline: 'none' }} value={removalReason} onChange={(e) => setRemovalReason(e.target.value)} />
                   <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                      <button onClick={() => setRemovingStudent(null)} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#ccc', border: 'none', fontWeight: 800 }}>Cancel</button>
                      <button onClick={handleRemoveStudent} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#ef4444', color: '#fff', border: 'none', fontWeight: 800 }}>Remove</button>
                   </div>
                </div>
             </motion.div>
          )}
      </AnimatePresence>
    </div>
  )
}

function StatCard({ label, value, color, theme }: any) {
    return (
        <div style={{ background: theme.card, padding: '25px', borderRadius: '20px', border: `1px solid ${theme.border}`, borderLeft: `6px solid ${color}` }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: theme.subtext, textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: '24px', fontWeight: '950' }}>{value}</div>
        </div>
    );
}
