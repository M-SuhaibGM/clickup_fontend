import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ClickUp Clone — Manage Projects, Tasks & Teams",
    template: "%s | ClickUp Clone",
  },
  description:
    "A modern, real-time project management app. Organize workspaces, projects, lists, and tasks with Kanban boards, drag-and-drop, subtasks, comments, and team collaboration.",
  keywords: [
    "project management",
    "task manager",
    "kanban board",
    "team collaboration",
    "workspace",
    "clickup clone",
  ],
  authors: [{ name: "Muhammad Suhaib" }],
  creator: "Muhammad Suhaib",
  openGraph: {
    title: "ClickUp Clone — Manage Projects, Tasks & Teams",
    description:
      "Real-time project management with workspaces, Kanban boards, and team collaboration.",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}