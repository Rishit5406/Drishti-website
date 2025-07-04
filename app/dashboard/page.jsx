"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Ticket,
  MessageSquare,
  Star,
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
  Users,
  BarChart3,
  Activity,
} from "lucide-react"
// Corrected import path for DashboardLayout
import { DashboardLayout } from "@/components/dashboard-layout"

export default function DashboardPage() {
  const [stats, setStats] = useState({
    tickets: { total: 0, pending: 0, processing: 0, resolved: 0 },
    complaints: { total: 0, pending: 0 },
    feedback: { total: 0, pending: 0 },
  })
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch tickets
        const ticketsRes = await fetch('/api/tickets');
        if (!ticketsRes.ok) throw new Error('Failed to fetch tickets');
        const ticketsData = await ticketsRes.json();
        const pendingTickets = ticketsData.filter(t => t.status === 'pending').length;
        const processingTickets = ticketsData.filter(t => t.status === 'Processing').length;
        const resolvedTickets = ticketsData.filter(t => t.status === 'Resolved').length;

        // Fetch complaints
        const complaintsRes = await fetch('/api/complaints');
        if (!complaintsRes.ok) throw new Error('Failed to fetch complaints');
        const complaintsData = await complaintsRes.json();
        const pendingComplaints = complaintsData.filter(c => c.status === 'Pending').length; // Assuming complaints can also have a 'Pending' status

        // Fetch feedback
        const feedbackRes = await fetch('/api/feedback');
        if (!feedbackRes.ok) throw new Error('Failed to fetch feedback');
        const feedbackData = await feedbackRes.json();
        const pendingFeedback = feedbackData.filter(f => f.status === 'Pending').length; // Assuming feedback can also have a 'Pending' status


        setStats({
          tickets: {
            total: ticketsData.length,
            pending: pendingTickets,
            processing: processingTickets,
            resolved: resolvedTickets,
          },
          complaints: {
            total: complaintsData.length,
            pending: pendingComplaints,
          },
          feedback: {
            total: feedbackData.length,
            pending: pendingFeedback,
          },
        })
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="ml-4 text-lg text-muted-foreground">Loading dashboard data...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 text-red-500">
          <AlertTriangle className="w-16 h-16 mb-4" />
          <p className="text-xl font-semibold">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-gray-900 dark:text-gray-50">
          Admin Dashboard
        </h1>

        {/* Overview Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Tickets Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/20 dark:to-indigo-950/20 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-xl font-bold text-blue-800 dark:text-blue-300">Tickets</CardTitle>
              <div className="relative">
                <Ticket className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full animate-pulse" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-4xl font-bold text-blue-700 dark:text-blue-300">{stats.tickets.total}</div>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{stats.tickets.pending}</span>
                </div>
                <Progress value={(stats.tickets.pending / stats.tickets.total) * 100} className="h-3 bg-blue-200 dark:bg-blue-800" indicatorClassName="bg-blue-600" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Processing</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">{stats.tickets.processing}</span>
                </div>
                <Progress value={(stats.tickets.processing / stats.tickets.total) * 100} className="h-3 bg-indigo-200 dark:bg-indigo-800" indicatorClassName="bg-indigo-600" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Resolved</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">{stats.tickets.resolved}</span>
                </div>
                <Progress value={(stats.tickets.resolved / stats.tickets.total) * 100} className="h-3 bg-green-200 dark:bg-green-800" indicatorClassName="bg-green-600" />
              </div>
            </CardContent>
          </Card>

          {/* Complaints Card */}
          <Card className="bg-gradient-to-br from-red-50 to-orange-100 dark:from-red-950/20 dark:to-orange-950/20 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-xl font-bold text-red-800 dark:text-red-300">Complaints</CardTitle>
              <div className="relative">
                <MessageSquare className="h-8 w-8 text-red-600 dark:text-red-400" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full animate-pulse" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-4xl font-bold text-red-700 dark:text-red-300">{stats.complaints.total}</div>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Filed</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">{stats.complaints.pending}</span>
                </div>
                <Progress value={(stats.complaints.pending / stats.complaints.total) * 100} className="h-3 bg-red-200 dark:bg-red-800" indicatorClassName="bg-red-600" />
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs px-3 py-1">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    High Priority
                  </Badge>
                  <Badge variant="destructive" className="text-xs px-3 py-1">
                    <Clock className="w-3 h-3 mr-1" />
                    Overdue
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feedback Card */}
          <Card className="bg-gradient-to-br from-emerald-50 to-lime-100 dark:from-emerald-950/20 dark:to-lime-950/20 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-xl font-bold text-emerald-800 dark:text-emerald-300">Feedback</CardTitle>
              <div className="relative">
                <Star className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-pulse" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-4xl font-bold text-emerald-700 dark:text-emerald-300">{stats.feedback.total}</div>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Satisfaction Score</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">5/5 ⭐</span>
                </div>
                <Progress value={96} className="h-3" />
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs px-3 py-1">
                    <Clock className="w-3 h-3 mr-1" />
                    {stats.feedback.pending} To Review
                  </Badge>
                  <Badge variant="default" className="text-xs px-3 py-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Trending Up
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Placeholder for Recent Activity / Charts - you can expand this later */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates on tickets, complaints, and feedback.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No recent activity to display.</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Key performance indicators over time.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No metrics to display.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </DashboardLayout>
  )
}
