/**
 * src/app/layout.tsx
 *
 * Layout raíz de la aplicación Next.js.
 * Importa la fuente Inter de Google y aplica el fondo del dark mode institucional EAFIT.
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EAFIT Smart Parking",
  description:
    "Encuentra parqueadero en el campus EAFIT en tiempo real. Datos de ocupación, reportes crowdsourced y tráfico vehicular integrados.",
  keywords: ["EAFIT", "parqueadero", "Medellín", "campus", "estacionamiento"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-eafit-bg text-white antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
