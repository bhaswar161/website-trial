"use client";
import { useState, useEffect, useMemo } from 'react';
import { useSession } from "next-auth/react";
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from "../../../context/ThemeContext";
import Link from 'next/link';

export default function AdminPayments() {
  const { data: session } = useSession();
  const { isDarkMode } = useTheme();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [viewingProfile, setViewingProfile] = useState<any | null>(null);
  
  const [rejectingReq, setRejectingReq] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const supabase = useMemo(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const isOwner = session?.user?.email === "bhaswarray@gmail.com";

  useEffect(() => {
    if (isOwner) fetchRequests();
  }, [isOwner]);

  const fetchRequests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    setRequests(data || []);
    setLoading(false);
  };

  const handleApprove = async (req: any) => {
    if (!confirm(`Approve ${req.student_name} for batch ${req.batch_id}?`)) return;
    try {
      const { error: enrollError } = await supabase.from('enrollments').insert([{
        student_email: req.student_email,
        student_name: req.student_name,
        batch_id: req.batch_id,
        enrolled_at: new Date().toISOString()
      }]);
      if (enrollError) throw enrollError;
      await supabase.from('payment_requests').update({ status: 'approved' }).eq('id', req.id);
      alert("✅ Enrollment confirmed!");
      fetchRequests();
    } catch (err: any) { alert("Error: " + err.message); }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason) return alert("Please provide a reason.");
    try {
      const { error } = await supabase.from('payment_requests').update({ 
        status: 'rejected', rejection_reason: rejectReason 
      }).eq('id', rejectingReq.id);
      if (error) throw error;
      setRejectingReq(null); setRejectReason("");
      fetchRequests();
    } catch (err: any) { alert("Error: " + err.message); }
  };

  const theme = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    card: isDarkMode ? '#1e293b' : '#ffffff',
    text: isDarkMode ? '#f8fafc' : '#1c252e',
    subtext: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    input: isDarkMode ? '#0f172a' : '#f1f5f9'
  };

  if (!isOwner) return <div style={{padding: '100px', textAlign: 'center', background: '#0f172a', height: '100vh', color: '#fff'}}>🚫 Access Denied</div>;

  return (
    <div style={{ padding: '40px 5%', background: theme.bg, minHeight: '100vh', color: theme.text, fontFamily: 'sans-serif', transition: '0.4s' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
           <Link href="/admin" style={{ color: '#5b6cfd', fontWeight: '800', textDecoration: 'none', fontSize: '14px' }}>← BACK TO ADMIN PANEL</Link>
           <h1 style={{ fontWeight: 900, fontSize: '32px', margin: '10px 0 0 0' }}>Payment Verifications</h1>
        </div>
        <button onClick={fetchRequests} style={{ background: theme.card, color: theme.text, border: `1px solid ${theme.border}`, padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: 700 }}>🔄 Refresh</button>
      </div>

      <div style={{ background: theme.card, borderRadius: '28px', border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f9fafb', borderBottom: `1px solid ${theme.border}`, fontSize: '12px', color: theme.subtext }}>
              <th style={{ padding: '20px' }}>STUDENT (Click name for info)</th>
              <th>BATCH & AMOUNT</th>
              <th>PAYMENT PROOF</th>
              <th style={{ paddingRight: '20px' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                <td style={{ padding: '20px' }}>
                  <motion.div whileHover={{ x: 5 }} onClick={() => setViewingProfile(req)} style={{ cursor: 'pointer' }}>
                    <div style={{ fontWeight: 800, fontSize: '15px', color: '#5b6cfd' }}>{req.student_name || "Unknown"} 👤</div>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>{req.student_email}</div>
                  </motion.div>
                </td>
                <td>
                   <div style={{ fontWeight: 700 }}>{req.batch_id}</div>
                   <div style={{ fontWeight: 900, color: '#10b981' }}>₹{req.amount}</div>
                </td>
                <td>
                  <button onClick={() => setSelectedImg(req.screenshot_url)} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 }}>🔍 VIEW SS</button>
                </td>
                <td style={{ paddingRight: '20px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleApprove(req)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: 900 }}>APPROVE</button>
                    <button onClick={() => setRejectingReq(req)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: 900 }}>REJECT</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* STUDENT PROFILE MODAL */}
      <AnimatePresence>
        {viewingProfile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 3500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ background: theme.card, padding: '35px', borderRadius: '30px', width: '450px', border: `1px solid ${theme.border}` }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                   <div style={{ fontSize: '50px', marginBottom: '10px' }}>🎓</div>
                   <h2 style={{ fontWeight: 900 }}>Student Profile</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                   <InfoRow label="Full Name" value={viewingProfile.student_name} theme={theme} />
                   <InfoRow label="Email Address" value={viewingProfile.student_email} theme={theme} isCopy />
                   <InfoRow label="User UUID" value={viewingProfile.user_id || "N/A"} theme={theme} />
                   <InfoRow label="Request ID" value={viewingProfile.id} theme={theme} />
                   <InfoRow label="Submission Date" value={new Date(viewingProfile.created_at).toLocaleString()} theme={theme} />
                </div>
                <button onClick={() => setViewingProfile(null)} style={{ width: '100%', padding: '15px', borderRadius: '15px', background: '#5b6cfd', color: '#fff', border: 'none', fontWeight: 800, marginTop: '30px', cursor: 'pointer' }}>Close Details</button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REJECTION MODAL */}
      <AnimatePresence>
        {rejectingReq && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ background: theme.card, padding: '30px', borderRadius: '24px', maxWidth: '450px', width: '100%', border: `1px solid ${theme.border}` }}>
              <h2 style={{ fontWeight: 900 }}>Reject Payment</h2>
              <textarea style={{ width: '100%', height: '120px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: theme.input, color: theme.text, padding: '15px', marginTop: '20px' }} placeholder="Reason for rejection..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button onClick={() => setRejectingReq(null)} style={{ flex: 1, padding: '15px', borderRadius: '12px', background: '#ccc', fontWeight: 800 }}>Cancel</button>
                <button onClick={handleRejectSubmit} style={{ flex: 1, padding: '15px', borderRadius: '12px', background: '#ef4444', color: '#fff', fontWeight: 800 }}>Confirm Reject</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SS VIEWER */}
      <AnimatePresence>
        {selectedImg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedImg(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={selectedImg} style={{ maxHeight: '80vh', maxWidth: '90vw', borderRadius: '16px', border: '4px solid white' }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoRow({ label, value, theme, isCopy }: any) {
  return (
    <div style={{ borderBottom: `1px solid ${theme.border}`, paddingBottom: '10px' }}>
      <div style={{ fontSize: '11px', fontWeight: 900, color: '#5b6cfd', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: 700, wordBreak: 'break-all' }}>{value}</div>
      {isCopy && <button onClick={() => {navigator.clipboard.writeText(value); alert("Copied!")}} style={{ background: 'none', border: 'none', color: '#5b6cfd', fontSize: '10px', padding: 0, cursor: 'pointer', fontWeight: 800 }}>📋 Click to copy</button>}
    </div>
  );
}
