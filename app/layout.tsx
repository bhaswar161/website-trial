import { NextAuthProvider } from "./providers";
import { ThemeProvider } from "../context/ThemeContext"; // Path to the file created in Step 1

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        {/* NextAuthProvider handles Login, ThemeProvider handles Dark/Light Mode */}
        <NextAuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}