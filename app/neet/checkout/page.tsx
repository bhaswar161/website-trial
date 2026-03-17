"use client";
import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { useTheme } from "../../../context/ThemeContext";
import Link from 'next/link';

function CheckoutContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDarkMode } = useTheme();
  
  const batchId = searchParams.get('batchId') || "unknown";
  const amount = searchParams.get('amount') || "0";

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [profilePic, setProfilePic] = useState("");

  const supabase = useMemo(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  useEffect(() => { 
    setMounted(true);
    setProfilePic(localStorage.getItem("userProfilePic") || "");
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selected);
    }
  };

  const handleUpload = async () => {
    if (!file || !session?.user) return alert("❌ Mandatory: Please upload the payment screenshot to proceed!");
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const userId = (session.user as any).id;
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      
      const { data: storageData, error: storageError } = await supabase.storage
        .from('screenshots')
        .upload(fileName, file);

      if (storageError) throw storageError;

      const { data: { publicUrl } } = supabase.storage.from('screenshots').getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('payment_requests').insert([{
        user_id: userId,
        student_email: session.user.email,
        student_name: localStorage.getItem("userFirstName") || session.user.name,
        batch_id: batchId,
        amount: amount,
        screenshot_url: publicUrl,
        status: 'pending'
      }]);

      if (dbError) throw dbError;

      alert("🎉 Payment Successful!\nYou will be added in the batch within 24 hours after reviewing of payment.");
      router.push('/neet');
    } catch (err: any) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const theme = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    card: isDarkMode ? '#1e293b' : '#ffffff',
    text: isDarkMode ? '#f8fafc' : '#ffffff',
    subtext: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    input: isDarkMode ? '#0f172a' : '#f1f5f9'
  };

  const upiString = `upi://pay?pa=6291644161@fam&pn=StudyHub&am=${amount}&cu=INR`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiString)}`;

  if (!mounted) return null;

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', transition: '0.4s', color: theme.text, fontFamily: 'sans-serif' }}>
      
      {/* HEADER WITH PROFILE & LOGOUT */}
      <header style={{ height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 5%', background: isDarkMode ? 'rgba(30, 41, 59, 0.85)' : '#ffffff', borderBottom: `1px solid ${theme.border}`, position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ textDecoration: 'none', fontWeight: 900, fontSize: '26px', color: '#5b6cfd' }}>StudyHub</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)', padding: '6px 16px 6px 6px', borderRadius: '50px' }}>
             <img src={profilePic || session?.user?.image || ""} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} />
             <div style={{ lineHeight: 1.1 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: isDarkMode ? '#fff' : '#1c252e' }}>Hi, {session?.user?.name?.split(' ')[0]}</div>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#5b6cfd' }}>STUDENT</div>
             </div>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/' })} style={{ background: '#ff4757', color: 'white', border: 'none', padding: '10px 22px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>Logout</button>
        </div>
      </header>

      <main style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 20px' }}>
        
        {/* BACK BUTTON & CENTERED HEADING */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px' }}>
          <button onClick={() => router.push('/neet')} style={{ position: 'absolute', left: 0, background: 'none', border: 'none', color: '#5b6cfd', fontWeight: 800, fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ← Back
          </button>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: isDarkMode ? '#fff' : '#1c252e', margin: 0 }}>PAYMENT PAGE</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px' }}>
          {/* SCAN & PAY */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ background: theme.card, padding: '40px', borderRadius: '32px', border: `1px solid ${theme.border}`, textAlign: 'center' }}>
            <h2 style={{ fontWeight: 900, fontSize: '24px', marginBottom: '10px', color: isDarkMode ? '#fff' : '#1c252e' }}>Scan & Pay</h2>
            <p style={{ color: theme.subtext, marginBottom: '30px' }}>Scan this QR and pay <b>₹{amount}</b></p>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '24px', display: 'inline-block', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
              <img src={qrUrl} alt="UPI QR" style={{ width: '220px', height: '220px' }} />
            </div>
            <div style={{ marginTop: '30px', padding: '20px', borderRadius: '16px', background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
              <div style={{ fontSize: '12px', fontWeight: 900, color: '#5b6cfd', marginBottom: '5px' }}>AMOUNT TO PAY</div>
              <div style={{ fontSize: '32px', fontWeight: 950, color: isDarkMode ? '#fff' : '#1c252e' }}>₹{amount}</div>
            </div>
          </motion.div>

          {/* UPLOAD PROOF */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} style={{ background: theme.card, padding: '40px', borderRadius: '32px', border: `1px solid ${theme.border}` }}>
            <h2 style={{ fontWeight: 900, fontSize: '24px', marginBottom: '10px', color: isDarkMode ? '#fff' : '#1c252e' }}>Upload Proof</h2>
            <p style={{ color: theme.subtext, marginBottom: '30px' }}>Upload your payment screenshot.</p>
            
            <label style={{ display: 'block', width: '100%', height: '220px', border: `2px dashed ${theme.border}`, borderRadius: '24px', cursor: 'pointer', position: 'relative', overflow: 'hidden', background: theme.input }}>
              {!preview ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: theme.subtext }}>
                  <span style={{ fontSize: '48px' }}>📸</span>
                  <span style={{ fontWeight: 800, marginTop: '12px' }}>Click to upload screenshot</span>
                </div>
              ) : (
                <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="preview" />
              )}
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>

            <button onClick={handleUpload} disabled={uploading} style={{ width: '100%', padding: '20px', borderRadius: '18px', background: '#5b6cfd', color: '#fff', border: 'none', fontWeight: '900', fontSize: '16px', cursor: 'pointer', marginTop: '30px', transition: '0.3s', boxShadow: '0 10px 20px rgba(91,108,253,0.3)' }}>
              {uploading ? "SUBMITTING..." : "CONFIRM & SUBMIT"}
            </button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Loading Payment Details...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
