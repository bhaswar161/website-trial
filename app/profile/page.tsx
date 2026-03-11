'use client'
import { useSession } from "next-auth/react"
import { useState } from "react"
import Link from "next/link"

export default function ProfilePage() {
  const { data: session } = useSession()
  
  // State for your specific fields
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    currentClass: "Class 11",
  })

  if (!session) return <div style={{padding: '50px', textAlign: 'center'}}><h1>Please log in.</h1></div>

  return (
    <div style={{ padding: '40px', maxWidth: '500px', margin: '0 auto', fontFamily: 'Arial' }}>
      <Link href="/" style={{ color: '#6c63ff', textDecoration: 'none' }}>← Back to Home</Link>
      
      <h1 style={{ margin: '20px 0' }}>Complete Your Profile</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label>First Name</label>
          <input 
            style={inputStyle} 
            type="text" 
            placeholder="Enter first name"
            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
          />
        </div>

        <div>
          <label>Last Name</label>
          <input 
            style={inputStyle} 
            type="text" 
            placeholder="Enter last name"
            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
          />
        </div>

        <div>
          <label>Phone Number</label>
          <input 
            style={inputStyle} 
            type="tel" 
            placeholder="+91 XXXXX XXXXX"
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>

        <div>
          <label>Current Class</label>
          <select style={inputStyle} onChange={(e) => setFormData({...formData, currentClass: e.target.value})}>
            <option>Class 11</option>
            <option>Class 12</option>
            <option>Dropper</option>
          </select>
        </div>

        <button 
          onClick={() => alert(`Saved! Hello ${formData.firstName}`)}
          style={{ padding: '15px', background: '#6c63ff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Save Profile
        </button>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '12px',
  marginTop: '5px',
  borderRadius: '8px',
  border: '1px solid #ddd',
  display: 'block'
}
