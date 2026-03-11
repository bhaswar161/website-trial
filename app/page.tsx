import Link from 'next/link'

export default function Home() {
  return (
    <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
      <h1>Welcome to StudyHub</h1>
      <p>Click below to test your new login system:</p>
      <Link href="/login" style={{ color: 'blue', fontSize: '20px' }}>
        Go to Login Page
      </Link>
    </div>
  )
}
