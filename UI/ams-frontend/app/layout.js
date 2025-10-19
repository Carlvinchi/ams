import { Inter, Poppins, Lusitana  } from "next/font/google";
import "./globals.css";
import "./providers";
import Providers from "./providers";

const inter = Inter({
  variable: "--font-inter",
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

const lusitana = Lusitana({
  variable: "--font-lusitana",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata = {
  title: "Athlete Management System",
  description: "This is a proof of concept web application for my MSc project.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${poppins.variable} ${lusitana.variable} antialiased`}
      >
        <Providers>
        {children}
        </Providers>
      </body>
    </html>
  );
}
