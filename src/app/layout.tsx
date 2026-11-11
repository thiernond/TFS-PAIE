import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TFS PAIE — Gestion & Paiement des Journaliers Agricoles",
  description:
    "Solution SaaS de pointage terrain, suivi des avances et décaissement Mobile Money (Wave, Orange Money, MTN MoMo, Espèces) pour exploitations agricoles.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#143D2B" />
      </head>
      <body className="h-full bg-[#FAF8F5] text-slate-900 antialiased selection:bg-emerald-200 selection:text-emerald-950">
        {children}
      </body>
    </html>
  );
}
