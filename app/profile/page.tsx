'use client'
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { useState, useEffect, useCallback } from 'react'
import Cropper from 'react-easy-crop'

export default function ProfilePage() {
  const { data: session, status } = useSession()
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

    // Create a 300x300 square for the profile pic (good balance of quality/size)
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');

    const { x, y, width, height } = croppedAreaPixels as any;

    ctx?.drawImage(img, x, y, width, height, 0, 0, 300, 300);

    const base64Image = canvas.toDataURL('image/jpeg', 0.8);
    setFormData(prev => ({ ...prev, profilePic: base64Image }));
    setImageToCrop(null); // Close the cropper
  };

  const handleSave = () => {
    localStorage.setItem("userFirstName", formData.firstName);
    localStorage.setItem("userLastName", formData.lastName);
    localStorage.setItem("userPhone", formData.phone);
    localStorage.setItem("userClass", formData.currentClass);
    localStorage.setItem("userProfilePic", formData.profilePic); 
    window.dispatchEvent(new Event("storage"));
    alert("Profile Updated Successfully!");
    window.location.href = "/"; 
  }

  if (status === "unauthenticated") redirect("/api/auth/signin")
  if (!mounted) return null

  return (
    <div style={{ padding: '40px', maxWidth: '500px', margin: '0 auto', fontFamily: 'Arial' }}>
      
      {/* --- CROPPER MODAL OVERLAY --- */}
      {imageToCrop && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px', height: '400px', borderRadius: '15px', overflow: 'hidden' }}>
            <Cropper
              image={imageToCrop}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div style={{ marginTop: '20px', width: '100%', maxWidth: '400px' }}>
            <input 
              type="range" min={1} max={3} step={0.1} value={zoom} 
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#6c63ff' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
            <button onClick={() => setImageToCrop(null)} style={secondaryBtnStyle}>Cancel</button>
            <button onClick={generateCroppedImage} style={primaryBtnStyle}>Apply Crop</button>
          </div>
        </div>
      )}

      <Link href="/" style={{ color: '#6c63ff', textDecoration: 'none', fontWeight: 'bold' }}>← Back to Home</Link>
      <h1 style={{ margin: '20px 0' }}>Student Profile</h1>
      
      {/* Profile Picture Preview */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{ 
          width: '140px', height: '140px', borderRadius: '50%', backgroundColor: '#eee', 
          margin: '0 auto 15px', overflow: 'hidden', border: '4px solid #6c63ff',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {formData.profilePic ? (
            <img src={formData.profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: '#888', fontSize: '14px' }}>No Photo</span>
          )}
        </div>
        <label style={{ 
          background: '#f0eeff', padding: '10px 20px', borderRadius: '25px', 
          fontSize: '14px', cursor: 'pointer', color: '#6c63ff', fontWeight: 'bold'
        }}>
          Change Photo
          <input type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
        </label>
      </div>

      {/* Form Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <input style={inputStyle} type="text" value={formData.firstName} placeholder="First Name" onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
        <input style={inputStyle} type="text" value={formData.lastName} placeholder="Last Name" onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
        <input style={inputStyle} type="tel" value={formData.phone} placeholder="Phone Number" onChange={(e) => setFormData({...formData, phone: e.target.value})} />
        
        <select style={inputStyle} value={formData.currentClass} onChange={(e) => setFormData({...formData, currentClass: e.target.value})}>
          <option>Class 11</option>
          <option>Class 12</option>
          <option>Dropper</option>
        </select>

        <button onClick={handleSave} style={primaryBtnStyle}>Update Profile</button>
      </div>
    </div>
  )
}

const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px' }
const primaryBtnStyle = { padding: '15px 30px', background: '#6c63ff', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' as const }
const secondaryBtnStyle = { padding: '15px 30px', background: '#444', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }