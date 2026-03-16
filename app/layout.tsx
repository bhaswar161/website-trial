import { NextAuthProvider } from "./providers";
import { ThemeProvider } from "../context/ThemeContext";
import "./globals.css"; // ⬅️ THIS LINE IS CRITICAL

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <NextAuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}