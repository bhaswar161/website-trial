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
  callbacks: {
    // This forces the redirect to use your main production URL
    async redirect({ baseUrl }) {
      return "https://studyhub-chi-eight.vercel.app/api/auth/callback/google"
    },
  },
})

export { handler as GET, handler as POST }
