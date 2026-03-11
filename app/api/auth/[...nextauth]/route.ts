import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  // This FORCES Google to always use your main link
  redirectProxyUrl: "https://studyhub-chi-eight.vercel.app/api/auth/callback/google",
})

export { handler as GET, handler as POST }
