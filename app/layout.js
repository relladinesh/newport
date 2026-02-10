import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

export const metadata = {
  title: 'Rella"s Portfolio',
  description: 'Animated hero with pop-up character, orbit icons and polished UI',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
