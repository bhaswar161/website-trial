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
  })

  // Load existing data if they've saved it before
  useEffect(() => {
    const savedFirst = localStorage.getItem("userFirstName");
    const savedLast = localStorage.getItem("userLastName");
    const savedPhone = localStorage.getItem("userPhone");
    const savedClass = localStorage.getItem("userClass");
    
    if (savedFirst) setFormData(prev => ({ ...prev, firstName: savedFirst, lastName: savedLast || "", phone: savedPhone || "", currentClass: savedClass || "Class 11" }));
  }, []);

  const handleSave = () => {
    localStorage.setItem("userFirstName", formData.firstName);
    localStorage.setItem("userLastName", formData.lastName);
    localStorage.setItem("userPhone", formData.phone);
    localStorage.setItem("userClass", formData.currentClass);
    alert("Profile Updated Successfully!");
    window.location.href = "/"; // Go back to home to see the change
  }

  if (!session) return <div style={{padding: '50px', textAlign: 'center'}}><h1>Please log in.</h1></div>

  return (
    <div style={{ padding: '40px', maxWidth: '500px', margin: '0 auto', fontFamily: 'Arial' }}>
      <Link href="/" style={{ color: '#6c63ff', textDecoration: 'none' }}>← Back to Home</Link>
      
      <h1 style={{ margin: '20px 0' }}>Student Profile</h1>
      <p style={{marginBottom: '20px', color: '#666'}}>Logged in as: {session.user?.email}</p>
      
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
          style={{ padding: '15px', background: '#6c63ff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Update Profile
        </button>
      </div>
    </div>
  )
}

const labelStyle = { fontWeight: 'bold', fontSize: '14px' }
const inputStyle = {
  width: '100%',
  padding: '12px',
  marginTop: '5px',
  borderRadius: '8px',
  border: '1px solid #ddd',
  display: 'block'
}
