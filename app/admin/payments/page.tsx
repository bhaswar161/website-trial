"use client";
import { useState, useEffect, useMemo } from 'react';
import { useSession } from "next-auth/react";
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from "../../context/ThemeContext";
import Link from 'next/link';

export default function AdminPayments() {
  const { data: session } = useSession();
  const { isDarkMode } = useTheme();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

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
    // This fetches every detail you asked for: name, email, batch, amount, and ss_url
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
      // 1. Move to enrollments
      const { error: enrollError } = await supabase.from('enrollments').insert([{
        student_email: req.student_email,
        student_name: req.student_name,
        batch_id: req.batch_id,
        enrolled_at: new Date().toISOString()
      }]);

      if (enrollError) throw enrollError;

      // 2. Mark as approved
      await supabase.from('payment_requests').update({ status: 'approved' }).eq('id', req.id);
      
      alert("✅ Student access granted and enrollment confirmed.");
      fetchRequests();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const theme = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    card: isDarkMode ? '#1e293b' : '#ffffff',
    text: isDarkMode ? '#f8fafc' : '#1c252e',
    subtext: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
  };

  if (!isOwner) return <div style={{padding: '100px', color: '#fff', textAlign: 'center', background: '#0f172a', height: '100vh'}}>🚫 Access Denied</div>;

  return (
    <div style={{ padding: '40px 5%', background: theme.bg, minHeight: '100vh', color: theme.text, fontFamily: 'sans-serif', transition: '0.4s' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
           <Link href="/admin" style={{ color: '#5b6cfd', fontWeight: '800', textDecoration: 'none', fontSize: '14px' }}>← BACK TO ADMIN PANEL</Link>
           <h1 style={{ fontWeight: 900, fontSize: '32px', margin: '10px 0 0 0' }}>Payment Verifications</h1>
        </div>
        <button onClick={fetchRequests} style={{ background: theme.card, color: theme.text, border: `1px solid ${theme.border}`, padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: 700 }}>🔄 Refresh List</button>
      </div>

      <div style={{ background: theme.card, borderRadius: '28px', border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f9fafb', borderBottom: `1px solid ${theme.border}`, fontSize: '12px', color: theme.subtext }}>
              <th style={{ padding: '20px' }}>STUDENT DETAILS</th>
              <th>BATCH NAME</th>
              <th>AMOUNT PAID</th>
              <th>PAYMENT PROOF</th>
              <th style={{ paddingRight: '20px' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                {/* 1. Name & Email */}
                <td style={{ padding: '20px' }}>
                  <div style={{ fontWeight: 800, fontSize: '15px' }}>{req.student_name || "Unknown"}</div>
                  <div style={{ fontSize: '12px', color: '#5b6cfd', fontWeight: '600' }}>{req.student_email}</div>
                </td>
                
                {/* 2. Batch */}
                <td style={{ fontWeight: 700, fontSize: '14px' }}>
                   <span style={{ background: isDarkMode ? '#334155' : '#f1f5f9', padding: '4px 10px', borderRadius: '6px' }}>
                      {req.batch_id}
                   </span>
                </td>

                {/* 3. Amount */}
                <td style={{ fontWeight: 900, color: '#10b981', fontSize: '16px' }}>
                  ₹{req.amount}
                </td>

                {/* 4. Screenshot Button */}
                <td>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setSelectedImg(req.screenshot_url)}
                    style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '12px' }}
                  >
                    🔍 View Screenshot
                  </motion.button>
                </td>

                {/* 5. Approve Action */}
                <td style={{ paddingRight: '20px' }}>
                  <button 
                    onClick={() => handleApprove(req)} 
                    style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: 900, fontSize: '13px' }}
                  >
                    APPROVE
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {loading && <div style={{ padding: '40px', textAlign: 'center' }}>Loading requests...</div>}
        {!loading && requests.length === 0 && (
          <div style={{ padding: '80px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px' }}>🎉</div>
            <div style={{ fontWeight: 700, marginTop: '10px', opacity: 0.5 }}>No pending payments to verify!</div>
          </div>
        )}
      </div>

      {/* FULL SCREEN IMAGE VIEWER */}
      <AnimatePresence>
        {selectedImg && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedImg(null)}
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          >
            <motion.img 
              initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }}
              src={selectedImg} 
              style={{ maxHeight: '80vh', maxWidth: '90vw', borderRadius: '16px', boxShadow: '0 0 40px rgba(0,0,0,0.5)', border: '4px solid white' }} 
            />
            <div style={{ marginTop: '20px', color: '#fff', fontWeight: 800, background: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '30px' }}>
                Click anywhere to close
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
