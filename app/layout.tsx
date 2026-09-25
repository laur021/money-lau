import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Roboto } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PwaRegister } from "@/components/pwa-register";
import { IonicProvider } from "@/components/ionic/ionic-provider";
import "@ionic/react/css/core.css";
import "./globals.css";
import { cn } from "@/lib/utils";

const roboto = Roboto({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MoneyLau - Personal Finance Manager",
  description: "Manage your income, expenses, accounts, and financial activity in one place.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  applicationName: "MoneyLau",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MoneyLau",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#047857",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", roboto.variable)}>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}>
        <IonicProvider />
        <TooltipProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            {children}
            <Toaster position="top-center" richColors visibleToasts={3} />
            <PwaRegister />
          </ThemeProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
