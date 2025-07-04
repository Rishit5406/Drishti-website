"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import {
  LayoutDashboard,
  Ticket,
  MessageSquare,
  Star,
  History,
  Settings,
  Menu,
  LogOut,
  Zap,
  Moon,
  Sun,
} from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    color: "from-cyan-500 to-blue-600",
  },
  {
    name: "Tickets",
    href: "/tickets",
    icon: Ticket,
    color: "from-red-500 to-pink-600",
  },
  {
    name: "Complaints",
    href: "/complaints",
    icon: MessageSquare,
    color: "from-orange-500 to-yellow-600",
  },
  {
    name: "Feedback",
    href: "/feedback",
    icon: Star,
    color: "from-emerald-500 to-teal-600",
  },
  {
    name: "History",
    href: "/history",
    icon: History,
    color: "from-purple-500 to-violet-600",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    color: "from-slate-500 to-gray-600",
  },
]

export function DashboardLayout({ children }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-purple-900 dark:to-violet-900">
      {/* Modern Animated Background */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-200/20 to-blue-300/20 dark:from-cyan-500/10 dark:to-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-200/20 to-pink-300/20 dark:from-purple-500/10 dark:to-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-r from-emerald-200/20 to-teal-300/20 dark:from-emerald-500/10 dark:to-teal-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>

        {/* Geometric patterns */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 border border-current rotate-45 animate-spin-slow"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 border border-current rotate-12 animate-bounce-slow"></div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/20 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl shadow-xl">
        <div className="container flex h-16 items-center">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden hover:bg-purple-100 dark:hover:bg-purple-900">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border-r border-white/20 dark:border-gray-800/50"
            >
              <nav className="flex flex-col gap-2 mt-8">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all duration-300 relative overflow-hidden group",
                        pathname === item.href
                          ? `bg-gradient-to-r ${item.color} text-white shadow-xl`
                          : "hover:bg-white/70 dark:hover:bg-gray-800/70 hover:shadow-lg",
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <div
                        className={cn(
                          "p-2 rounded-xl transition-all duration-300",
                          pathname === item.href ? "bg-white/20" : `bg-gradient-to-r ${item.color} text-white`,
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{item.name}</span>

                    </Link>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Drishti (दृष्टि)
              </h1>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hover:bg-purple-100 dark:hover:bg-purple-900 transition-all duration-300"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex relative z-10">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r border-white/20 dark:border-gray-800/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl">
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all duration-300 relative overflow-hidden group",
                      pathname === item.href
                        ? `bg-gradient-to-r ${item.color} text-white shadow-xl`
                        : "hover:bg-white/70 dark:hover:bg-gray-800/70 hover:shadow-lg",
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-xl transition-all duration-300",
                        pathname === item.href ? "bg-white/20" : `bg-gradient-to-r ${item.color} text-white`,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 w-full z-10 border-t border-white/20 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl">
        <div className="container flex h-12 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            © 2025{" "}
            <span className="font-semibold bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent">
              Drishti (दृष्टि) 
            </span>{" "}
            - Vehicle Monitoring System
          </p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
