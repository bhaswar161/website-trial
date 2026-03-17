"use client";
import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { useTheme } from "../../../context/ThemeContext";
import Link from 'next/link';

// 1. Created a separate component for the logic
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

  const supabase = useMemo(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  useEffect(() => { setMounted(true); }, []);

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
    if (!file || !session?.user) return alert("❌ Please upload the payment screenshot first!");
    
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

      alert("🚀 Proof Submitted! Your batch will be unlocked after verification.");
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
    text: isDarkMode ? '#f8fafc' : '#1c252e',
    subtext: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    input: isDarkMode ? '#0f172a' : '#f1f5f9'
  };

  const upiString = `upi://pay?pa=6291644161@fam&pn=StudyHub&am=${amount}&cu=INR`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiString)}`;

  if (!mounted) return null;

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', transition: '0.4s', color: theme.text, fontFamily: 'sans-serif' }}>
      <header style={{ height: '80px', display: 'flex', alignItems: 'center', padding: '0 5%', borderBottom: `1px solid ${theme.border}` }}>
        <Link href="/neet" style={{ textDecoration: 'none', fontWeight: 800, color: '#5b6cfd', fontSize: '18px' }}>← Back to Batches</Link>
      </header>

      <main style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px' }}>
        <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ background: theme.card, padding: '40px', borderRadius: '32px', border: `1px solid ${theme.border}`, textAlign: 'center' }}>
          <h2 style={{ fontWeight: 900, fontSize: '28px', marginBottom: '10px' }}>Scan & Pay</h2>
          <p style={{ color: theme.subtext, marginBottom: '30px' }}>Scan this QR and pay <b>₹{amount}</b></p>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '24px', display: 'inline-block', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <img src={qrUrl} alt="UPI QR" style={{ width: '220px', height: '220px' }} />
          </div>
          <div style={{ marginTop: '30px', padding: '20px', borderRadius: '16px', background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
            <div style={{ fontSize: '12px', fontWeight: 900, color: '#5b6cfd', marginBottom: '5px' }}>AMOUNT TO PAY</div>
            <div style={{ fontSize: '32px', fontWeight: 950 }}>₹{amount}</div>
          </div>
        </motion.div>

        <motion.div initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ background: theme.card, padding: '40px', borderRadius: '32px', border: `1px solid ${theme.border}` }}>
          <h2 style={{ fontWeight: 900, fontSize: '28px', marginBottom: '10px' }}>Upload Proof</h2>
          <p style={{ color: theme.subtext, marginBottom: '30px' }}>Upload your payment screenshot.</p>
          <label style={{ display: 'block', width: '100%', height: '200px', border: `2px dashed ${theme.border}`, borderRadius: '20px', cursor: 'pointer', position: 'relative', overflow: 'hidden', background: theme.input }}>
            {!preview ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: theme.subtext }}>
                <span style={{ fontSize: '40px' }}>📷</span>
                <span style={{ fontWeight: 700, marginTop: '10px' }}>Click to upload</span>
              </div>
            ) : (
              <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="preview" />
            )}
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
          </label>
          <button onClick={handleUpload} disabled={uploading || !file} style={{ width: '100%', padding: '20px', borderRadius: '18px', background: '#5b6cfd', color: '#fff', border: 'none', fontWeight: '900', fontSize: '16px', cursor: file ? 'pointer' : 'not-allowed', marginTop: '30px', transition: '0.3s', opacity: file ? 1 : 0.5 }}>
            {uploading ? "SUBMITTING..." : "CONFIRM & SUBMIT"}
          </button>
        </motion.div>
      </main>
    </div>
  );
}

// 2. The main page now just wraps the content in a Suspense boundary
export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Loading Checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
