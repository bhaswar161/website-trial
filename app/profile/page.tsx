'use client'
import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import Link from "next/link"

export default function ProfilePage() {
  const { data: session } = useSession()
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    currentClass: "Class 11",
    profilePic: "" 
  })

  useEffect(() => {
    // Load existing data from localStorage
    setFormData({
      firstName: localStorage.getItem("userFirstName") || "",
      lastName: localStorage.getItem("userLastName") || "",
      phone: localStorage.getItem("userPhone") || "",
      currentClass: localStorage.getItem("userClass") || "Class 11",
      profilePic: localStorage.getItem("userProfilePic") || "" 
    });
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1.5MB limit to prevent localStorage overflow
      if (file.size > 1572864) { 
        alert("File is too large! Please choose an image under 1.5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({ ...prev, profilePic: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    localStorage.setItem("userFirstName", formData.firstName);
    localStorage.setItem("userLastName", formData.lastName);
    localStorage.setItem("userPhone", formData.phone);
    localStorage.setItem("userClass", formData.currentClass);
    localStorage.setItem("userProfilePic", formData.profilePic); 
    
    // 🔥 FIX 1: Trigger storage event so HomePage updates immediately
    window.dispatchEvent(new Event("storage"));
    
    alert("Profile Updated Successfully!");
    window.location.href = "/"; 
  }

  if (!session) return <div style={{padding: '50px', textAlign: 'center'}}><h1>Please log in.</h1></div>

  return (
    <div style={{ padding: '40px', maxWidth: '500px', margin: '0 auto', fontFamily: 'Arial' }}>
      <Link href="/" style={{ color: '#6c63ff', textDecoration: 'none', fontWeight: 'bold' }}>← Back to Home</Link>
      
      <h1 style={{ margin: '20px 0' }}>Student Profile</h1>
      
      {/* 🔥 FIX 2: Better Circular "Crop" Preview */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{ 
          width: '140px', 
          height: '140px', 
          borderRadius: '50%', 
          backgroundColor: '#eee', 
          margin: '0 auto 15px', 
          overflow: 'hidden', 
          border: '4px solid #6c63ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(108, 99, 255, 0.3)'
        }}>
          {formData.profilePic ? (
            /* object-fit: cover acts as an automatic center-crop */
            <img src={formData.profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: '#888', fontSize: '14px' }}>No Photo</span>
          )}
        </div>
        <label style={{ 
          background: '#f0eeff', 
          padding: '10px 20px', 
          borderRadius: '25px', 
          fontSize: '14px', 
          cursor: 'pointer',
          color: '#6c63ff',
          fontWeight: 'bold',
          transition: '0.2s'
        }}>
          Change Photo
          <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
        </label>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={labelStyle}>First Name</label>
          <input 
            style={inputStyle} 
            type="text" 
            value={formData.firstName}
            placeholder="Your First Name"
            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
          />
        </div>

        <div>
          <label style={labelStyle}>Last Name</label>
          <input 
            style={inputStyle} 
            type="text" 
            value={formData.lastName}
            placeholder="Your Last Name"
            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
          />
        </div>

        <div>
          <label style={labelStyle}>Phone Number</label>
          <input 
            style={inputStyle} 
            type="tel" 
            value={formData.phone}
            placeholder="+91"
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>

        <div>
          <label style={labelStyle}>Current Class</label>
          <select 
            style={inputStyle} 
            value={formData.currentClass}
            onChange={(e) => setFormData({...formData, currentClass: e.target.value})}
          >
            <option>Class 11</option>
            <option>Class 12</option>
            <option>Dropper</option>
          </select>
        </div>

        <button 
          onClick={handleSave}
          style={{ padding: '15px', background: '#6c63ff', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px', fontSize: '16px' }}
        >
          Update Profile
        </button>
      </div>
    </div>
  )
}

const labelStyle = { fontWeight: 'bold', fontSize: '14px', color: '#444' }
const inputStyle = {
  width: '100%',
  padding: '12px',
  marginTop: '5px',
  borderRadius: '8px',
  border: '1px solid #ddd',
  display: 'block',
  fontSize: '15px'
}
