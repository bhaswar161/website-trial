'use client'
import { useSession, signOut } from "next-auth/react"
import { redirect, useRouter } from "next/navigation"
import Link from "next/link"
import { useState, useEffect, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from "../../context/ThemeContext"

// Expanded Country List
const countries = [
  { name: "India", code: "+91", flag: "🇮🇳" },
  { name: "USA", code: "+1", flag: "🇺🇸" },
  { name: "UK", code: "+44", flag: "🇬🇧" },
  { name: "Canada", code: "+1", flag: "🇨🇦" },
  { name: "Australia", code: "+61", flag: "🇦🇺" },
  { name: "United Arab Emirates", code: "+971", flag: "🇦🇪" },
  { name: "Saudi Arabia", code: "+966", flag: "🇸🇦" },
  { name: "Singapore", code: "+65", flag: "🇸🇬" },
  { name: "Germany", code: "+49", flag: "🇩🇪" },
  { name: "France", code: "+33", flag: "🇫🇷" },
];

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const { isDarkMode } = useTheme()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  const isOwner = session?.user?.email === "bhaswarray@gmail.com";

  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    currentClass: "Class 11",
    profilePic: "",
    guardianName: "",
    guardianPhone: ""
  })

  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  useEffect(() => {
    setMounted(true)
    const savedPhone = localStorage.getItem("userPhone") || "";
    const matchedCountry = countries.find(c => savedPhone.startsWith(c.code)) || countries[0];
    
    setSelectedCountry(matchedCountry);
    setFormData({
      firstName: localStorage.getItem("userFirstName") || "",
      lastName: localStorage.getItem("userLastName") || "",
      phone: savedPhone.replace(matchedCountry.code, "").trim(),
      currentClass: localStorage.getItem("userClass") || "Class 11",
      profilePic: localStorage.getItem("userProfilePic") || "",
      guardianName: localStorage.getItem("guardianName") || "",
      guardianPhone: localStorage.getItem("guardianPhone") || ""
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
    canvas.width = 300; canvas.height = 300;
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
    localStorage.setItem("userPhone", `${selectedCountry.code} ${formData.phone}`);
    localStorage.setItem("userClass", formData.currentClass);
    localStorage.setItem("userProfilePic", formData.profilePic);
    localStorage.setItem("guardianName", formData.guardianName);
    localStorage.setItem("guardianPhone", formData.guardianPhone);
    alert("🚀 Profile & Guardian Details Updated!");
    router.push("/neet"); 
  }

  const theme = {
    bg: isDarkMode ? '#0f172a' : '#fcfdfe',
    card: isDarkMode ? '#1e293b' : '#fff',
    text: isDarkMode ? '#f8fafc' : '#1c252e',
    subtext: isDarkMode ? '#94a3b8' : '#64748b',
    headerBg: isDarkMode ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.85)',
    border: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    inputBg: isDarkMode ? '#0f172a' : '#f9fafb'
  };

  if (status === "unauthenticated") redirect("/")
  if (!mounted) return null

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', transition: '0.4s', color: theme.text, fontFamily: 'sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        header { display: flex; justify-content: space-between; align-items: center; padding: 0 5%; background: ${theme.headerBg}; backdrop-filter: blur(15px); border-bottom: 1px solid ${theme.border}; position: sticky; top: 0; z-index: 1000; height: 80px; }
        .logo { font-weight: 900; fontSize: 24px; color: #5b6cfd; text-decoration: none !important; }
        .btn-logout { background: #ff4757; color: white; border: none; padding: 10px 22px; border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.3s; }
        .back-link { color: #5b6cfd; text-decoration: none; font-weight: 800; font-size: 18px; display: flex; align-items: center; gap: 8px; margin-bottom: 25px; cursor: pointer; border: none; background: none; }
        .profile-container { max-width: 650px; margin: 40px auto; padding: 0 20px; padding-bottom: 80px; }
        .glass-card { background: ${theme.card}; border-radius: 35px; padding: 45px; border: 1px solid ${theme.border}; box-shadow: 0 20px 50px rgba(0,0,0,0.05); }
        .input-box { width: 100%; padding: 15px; border-radius: 14px; border: 1px solid ${theme.border}; background: ${theme.inputBg}; color: ${theme.text}; font-size: 16px; outline: none; box-sizing: border-box; }
        .phone-wrapper { display: flex; gap: 10px; align-items: center; }
        .country-code { padding: 15px; background: ${theme.inputBg}; border: 1px solid ${theme.border}; border-radius: 14px; font-weight: 800; min-width: 75px; text-align: center; color: #5b6cfd; }
        .label-text { display: block; margin-bottom: 8px; font-weight: 700; font-size: 12px; color: ${theme.subtext}; text-transform: uppercase; letter-spacing: 1px; }
        .section-divider { margin: 30px 0 20px; border: 0; border-top: 1px solid ${theme.border}; position: relative; }
        .section-label { position: absolute; top: -10px; left: 20px; background: ${theme.card}; padding: 0 10px; font-size: 11px; font-weight: 900; color: #5b6cfd; }
        .primary-btn { width: 100%; padding: 18px; border-radius: 16px; background: #5b6cfd; color: #fff; border: none; font-weight: 900; font-size: 16px; cursor: pointer; transition: 0.3s; margin-top: 20px; }
      `}} />

      <AnimatePresence>
        {imageToCrop && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: theme.card, padding: '25px', borderRadius: '24px', width: '100%', maxWidth: '450px' }}>
              <div style={{ position: 'relative', width: '100%', height: '350px', borderRadius: '16px', overflow: 'hidden' }}>
                <Cropper image={imageToCrop} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button onClick={() => setImageToCrop(null)} style={{ flex: 1, padding: '15px', borderRadius: '12px', background: theme.border, color: theme.text, border: 'none', cursor:'pointer' }}>Cancel</button>
                <button onClick={generateCroppedImage} style={{ flex: 1, padding: '15px', borderRadius: '12px', background: '#5b6cfd', color: '#fff', border: 'none', cursor:'pointer' }}>Save Photo</button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <header>
        <Link href="/" className="logo">StudyHub</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', padding: '6px 16px', border: `1px solid ${theme.border}`, borderRadius: '50px' }}>
             <img src={formData.profilePic || session?.user?.image || ""} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
             <div style={{ lineHeight: 1.1 }}>
                <div style={{ fontWeight: 800, fontSize: 13 }}>Hi, {formData.firstName || "User"}</div>
                <div style={{ fontSize: 9, fontWeight: 900, color: '#5b6cfd' }}>{isOwner ? 'FACULTY' : 'STUDENT'}</div>
             </div>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/' })} className="btn-logout">Logout</button>
        </div>
      </header>

      <main className="profile-container">
        <button onClick={() => router.back()} className="back-link">
          <motion.span animate={{ x: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 1.5 }}>←</motion.span> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 15px' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '4px solid #5b6cfd' }}>
                <img src={formData.profilePic || session?.user?.image || ""} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <label style={{ position: 'absolute', bottom: '0', right: '0', background: '#5b6cfd', width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: `3px solid ${theme.card}`, color: '#fff', fontSize: '14px' }}>
                📷 <input type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
              </label>
            </div>
            <h2 style={{ margin: 0, fontWeight: 950, fontSize: '26px' }}>Student Profile</h2>
            <p style={{ color: theme.subtext, fontSize: '13px', marginTop: '5px' }}>{session?.user?.email}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label className="label-text">First Name</label>
                <input className="input-box" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
              </div>
              <div>
                <label className="label-text">Last Name</label>
                <input className="input-box" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label className="label-text">Country</label>
                <select className="input-box" value={selectedCountry.name} onChange={(e) => {
                  const country = countries.find(c => c.name === e.target.value) || countries[0];
                  setSelectedCountry(country);
                }}>
                  {countries.map(c => <option key={c.name} value={c.name}>{c.flag} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label-text">Student Phone</label>
                <div className="phone-wrapper">
                  <div className="country-code">{selectedCountry.code}</div>
                  <input className="input-box" type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="XXXXXXXXXX" />
                </div>
              </div>
            </div>

            <div>
              <label className="label-text">Current Grade</label>
              <select className="input-box" value={formData.currentClass} onChange={(e) => setFormData({...formData, currentClass: e.target.value})}>
                <option>Class 11</option>
                <option>Class 12</option>
                <option>Dropper</option>
              </select>
            </div>

            {/* GUARDIAN SECTION */}
            <div className="section-divider">
               <span className="section-label">GUARDIAN INFORMATION</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '15px' }}>
              <div>
                <label className="label-text">Guardian Name</label>
                <input className="input-box" placeholder="Father/Mother Name" value={formData.guardianName} onChange={(e) => setFormData({...formData, guardianName: e.target.value})} />
              </div>
              <div>
                <label className="label-text">Guardian Phone</label>
                <input className="input-box" type="tel" placeholder="Phone Number" value={formData.guardianPhone} onChange={(e) => setFormData({...formData, guardianPhone: e.target.value})} />
              </div>
            </div>

            <button onClick={handleSave} className="primary-btn">SAVE CHANGES</button>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
