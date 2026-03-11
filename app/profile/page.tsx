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
    profilePic: "" // New field for the image
  })

  // Load existing data + image if they've saved it before
  useEffect(() => {
    const savedFirst = localStorage.getItem("userFirstName");
    const savedLast = localStorage.getItem("userLastName");
    const savedPhone = localStorage.getItem("userPhone");
    const savedClass = localStorage.getItem("userClass");
    const savedPic = localStorage.getItem("userProfilePic"); // Load the image
    
    if (savedFirst || savedPic) {
      setFormData(prev => ({ 
        ...prev, 
        firstName: savedFirst || "", 
        lastName: savedLast || "", 
        phone: savedPhone || "", 
        currentClass: savedClass || "Class 11",
        profilePic: savedPic || "" 
      }));
    }
  }, []);

  // Handle Image Selection and Conversion
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (optional but recommended for localStorage)
      if (file.size > 1048576) { // 1MB limit for localStorage reliability
        alert("File is too large! Please choose an image under 1MB.");
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
    localStorage.setItem("userProfilePic", formData.profilePic); // Save the image
    
    alert("Profile Updated Successfully!");
    window.location.href = "/"; 
  }

  if (!session) return <div style={{padding: '50px', textAlign: 'center'}}><h1>Please log in.</h1></div>

  return (
    <div style={{ padding: '40px', maxWidth: '500px', margin: '0 auto', fontFamily: 'Arial' }}>
      <Link href="/" style={{ color: '#6c63ff', textDecoration: 'none' }}>← Back to Home</Link>
      
      <h1 style={{ margin: '20px 0' }}>Student Profile</h1>
      
      {/* IMAGE UPLOAD SECTION */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{ 
          width: '120px', 
          height: '120px', 
          borderRadius: '50%', 
          backgroundColor: '#eee', 
          margin: '0 auto 15px', 
          overflow: 'hidden', 
          border: '3px solid #6c63ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {formData.profilePic ? (
            <img src={formData.profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: '#888', fontSize: '12px' }}>No Photo</span>
          )}
        </div>
        <label style={{ 
          background: '#f0eeff', 
          padding: '8px 15px', 
          borderRadius: '20px', 
          fontSize: '13px', 
          cursor: 'pointer',
          color: '#6c63ff',
          fontWeight: 'bold'
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
          style={{ padding: '15px', background: '#6c63ff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}
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
