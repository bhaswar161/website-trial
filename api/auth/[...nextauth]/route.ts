import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      // These names MUST match the "Keys" you typed into Vercel Settings
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  // This helps encrypt the user's session
  secret: process.env.NEXTAUTH_SECRET,
})

// This exports the logic so Vercel can run it
export { handler as GET, handler as POST }
