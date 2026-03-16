'use client'
import { useSession } from "next-auth/react"
import { redirect, useRouter } from "next/navigation"
import Link from "next/link"
import { useState, useEffect, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from "../../context/ThemeContext"

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const { isDarkMode, toggleTheme } = useTheme()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  // States for Profile Data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    currentClass: "Class 11",
    profilePic: "" 
  })

  // States for Cropping
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  useEffect(() => {
    setMounted(true)
    setFormData({
      firstName: localStorage.getItem("userFirstName") || "",
      lastName: localStorage.getItem("userLastName") || "",
      phone: localStorage.getItem("userPhone") || "",
      currentClass: localStorage.getItem("userClass") || "Class 11",
      profilePic: localStorage.getItem("userProfilePic") || "" 
    });
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageToCrop(reader.result as string));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = useCallback((_: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const generateCroppedImage = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    const canvas = document.createElement('canvas');
    const img = new Image();
    img.src = imageToCrop;
    await new Promise((res) => (img.onload = res));

    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    const { x, y, width, height } = croppedAreaPixels as any;
    ctx?.drawImage(img, x, y, width, height, 0, 0, 300, 300);

    const base64Image = canvas.toDataURL('image/jpeg', 0.8);
    setFormData(prev => ({ ...prev, profilePic: base64Image }));
    setImageToCrop(null); 
  };

  const handleSave = () => {
    localStorage.setItem("userFirstName", formData.firstName);
    localStorage.setItem("userLastName", formData.lastName);
    localStorage.setItem("userPhone", formData.phone);
    localStorage.setItem("userClass", formData.currentClass);
    localStorage.setItem("userProfilePic", formData.profilePic); 
    
    // Sync with NEET page display name logic
    localStorage.setItem("displayName", formData.firstName);
    
    alert("🚀 Profile Updated Successfully!");
    router.push("/neet"); 
  }

  const theme = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    card: isDarkMode ? '#1e293b' : '#fff',
    text: isDarkMode ? '#f8fafc' : '#0f172a',
    subtext: isDarkMode ? '#94a3b8' : '#64748b',
    headerBg: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    inputBg: isDarkMode ? '#0f172a' : '#f9fafb'
  };

  if (status === "unauthenticated") redirect("/")
  if (!mounted) return null

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', transition: '0.4s', color: theme.text, fontFamily: 'sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        header { display: flex; justify-content: space-between; align-items: center; padding: 0 5%; background: ${theme.headerBg}; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-bottom: 1px solid ${theme.border}; position: sticky; top: 0; z-index: 1000; height: 80px; }
        .profile-container { max-width: 550px; margin: 40px auto; padding: 0 20px; }
        .glass-card { background: ${theme.card}; border-radius: 32px; padding: 40px; border: 1px solid ${theme.border}; box-shadow: 0 20px 40px rgba(0,0,0,0.05); }
        .input-box { width: 100%; padding: 15px; border-radius: 14px; border: 1px solid ${theme.border}; background: ${theme.inputBg}; color: ${theme.text}; font-size: 16px; outline: none; transition: 0.2s; box-sizing: border-box; }
        .input-box:focus { border-color: #5b6cfd; box-shadow: 0 0 0 4px rgba(91, 108, 253, 0.1); }
        .label-text { display: block; margin-bottom: 8px; font-weight: 700; font-size: 13px; color: ${theme.subtext}; text-transform: uppercase; letter-spacing: 1px; }
        .primary-btn { width: 100%; padding: 18px; border-radius: 16px; background: #5b6cfd; color: #fff; border: none; font-weight: 900; font-size: 16px; cursor: pointer; transition: 0.3s; margin-top: 10px; }
        .primary-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(91, 108, 253, 0.3); }
      `}} />

      {/* --- CROPPER MODAL --- */}
      <AnimatePresence>
        {imageToCrop && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(8px)' }}
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} style={{ background: theme.card, padding: '25px', borderRadius: '24px', width: '100%', maxWidth: '450px' }}>
              <h3 style={{ margin: '0 0 20px 0', textAlign: 'center' }}>Crop Profile Picture</h3>
              <div style={{ position: 'relative', width: '100%', height: '350px', borderRadius: '16px', overflow: 'hidden' }}>
                <Cropper image={imageToCrop} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
              </div>
              <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} style={{ width: '100%', margin: '20px 0', accentColor: '#5b6cfd' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setImageToCrop(null)} style={{ flex: 1, padding: '15px', borderRadius: '12px', background: theme.border, color: theme.text, border: 'none', fontWeight: 'bold', cursor:'pointer' }}>Cancel</button>
                <button onClick={generateCroppedImage} style={{ flex: 1, padding: '15px', borderRadius: '12px', background: '#5b6cfd', color: '#fff', border: 'none', fontWeight: 'bold', cursor:'pointer' }}>Apply</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header>
        <Link href="/neet" style={{ textDecoration: 'none', fontWeight: 900, fontSize: '24px', color: '#5b6cfd' }}>StudyHub</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={toggleTheme} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px' }}>{isDarkMode ? "☀️" : "🌙"}</button>
          <Link href="/neet" style={{ border: `2px solid #5b6cfd`, color: '#5b6cfd', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', textDecoration: 'none', fontSize: '14px' }}>← Back</Link>
        </div>
      </header>

      <main className="profile-container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0 auto 20px' }}>
              <motion.div whileHover={{ scale: 1.05 }} style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '4px solid #5b6cfd', background: theme.inputBg }}>
                {formData.profilePic || session?.user?.image ? (
                  <img src={formData.profilePic || session?.user?.image || ""} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.subtext }}>No Photo</div>
                )}
              </motion.div>
              <label style={{ position: 'absolute', bottom: '0', right: '0', background: '#5b6cfd', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: `4px solid ${theme.card}`, color: '#fff' }}>
                📷 <input type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
              </label>
            </div>
            <h2 style={{ margin: 0, fontWeight: 900 }}>{session?.user?.name}</h2>
            <p style={{ color: theme.subtext, fontSize: '14px' }}>{session?.user?.email}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label className="label-text">First Name</label>
                <input className="input-box" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} placeholder="First Name" />
              </div>
              <div>
                <label className="label-text">Last Name</label>
                <input className="input-box" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} placeholder="Last Name" />
              </div>
            </div>

            <div>
              <label className="label-text">Phone Number</label>
              <input className="input-box" type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+91 XXXXX XXXXX" />
            </div>

            <div>
              <label className="label-text">Current Class</label>
              <select className="input-box" value={formData.currentClass} onChange={(e) => setFormData({...formData, currentClass: e.target.value})}>
                <option>Class 11</option>
                <option>Class 12</option>
                <option>Dropper</option>
              </select>
            </div>

            <button onClick={handleSave} className="primary-btn">UPDATE PROFILE</button>
          </div>
        </motion.div>
      </main>
    </div>
  )
}