"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
// Corrected import path for DashboardLayout
import { DashboardLayout } from "@/components/dashboard-layout"
import { Search, Calendar, Clock, Car, Star } from "lucide-react" // Removed Edit, Save, X

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([])
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  // Removed editingFeedback state as it's view-only
  const [searchTerm, setSearchTerm] = useState("")
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);

  useEffect(() => {
    fetchFeedbacks();
  }, [])

  const fetchFeedbacks = async () => {
    setLoadingFeedbacks(true);
    try {
      const response = await fetch('/api/feedback');
      if (!response.ok) throw new Error('Failed to fetch feedback');
      const data = await response.json();
      setFeedbacks(data);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      // Handle error display
    } finally {
      setLoadingFeedbacks(false);
    }
  }

  const handleFeedbackSelect = (feedback) => {
    setSelectedFeedback(feedback);
    // No editing state to reset
  }

  // Removed handleEdit, handleCancelEdit, handleSave functions as it's view-only

  const filteredFeedbacks = feedbacks.filter(feedback =>
    feedback.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feedback.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || // vehicleNumber might be optional
    feedback.title?.toLowerCase().includes(searchTerm.toLowerCase()) || // title might be undefined
    feedback.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Reviewed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Actioned': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (rating >= 3) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 p-6">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-gray-900 dark:text-gray-50">
          Feedback Management
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Panel: Feedback List */}
          <Card className="md:col-span-1 shadow-lg rounded-xl flex flex-col h-full max-h-[calc(100vh-180px)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-bold">All Feedback</CardTitle>
              <CardDescription>Review customer feedback.</CardDescription>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search feedback..."
                  className="pl-10 pr-4 py-2 rounded-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden">
              {loadingFeedbacks ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <p className="ml-3 text-muted-foreground">Loading feedback...</p>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-380px)] pr-4">
                  {filteredFeedbacks.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No feedback found.</p>
                  ) : (
                    <div className="space-y-3">
                      {filteredFeedbacks.map(feedback => (
                        <Card
                          key={feedback.id}
                          className={`cursor-pointer transition-all duration-200 ${selectedFeedback?.id === feedback.id
                              ? 'border-purple-500 ring-2 ring-purple-500 shadow-md scale-[1.01]'
                              : 'border-transparent hover:border-gray-300 dark:hover:border-gray-700'
                            }`}
                          onClick={() => handleFeedbackSelect(feedback)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold text-base truncate">{feedback.title || feedback.category}</h3>
                              <Badge className={getRatingColor(feedback.rating)}>{feedback.rating} <Star className="h-3 w-3 ml-1 fill-current" /></Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {feedback.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Car className="h-3 w-3" />
                              <span>{feedback.vehicleNumber}</span>
                              <Calendar className="h-3 w-3 ml-auto" />
                              <span>{new Date(feedback.date).toLocaleDateString()}</span>
                              <Clock className="h-3 w-3" />
                              <span>{new Date(feedback.date).toLocaleTimeString()}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Right Panel: Feedback Details */}
          <div className="md:col-span-2">
            {selectedFeedback ? (
              <Card className="shadow-lg rounded-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-bold">{selectedFeedback.title || selectedFeedback.category}</CardTitle>
                    {/* Removed Edit/Save/Cancel buttons */}
                  </div>
                  <CardDescription className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4" /> {selectedFeedback.vehicleNumber}
                    <Badge className={getRatingColor(selectedFeedback.rating)}>{selectedFeedback.rating} <Star className="h-3 w-3 ml-1 fill-current" /></Badge>
                    {/* Removed save status messages */}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Feedback ID</Label>
                      <Input value={selectedFeedback.id} readOnly className="mt-1 bg-gray-50 dark:bg-gray-800" />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Input value={selectedFeedback.category} readOnly className="mt-1 bg-gray-50 dark:bg-gray-800" />
                    </div>
                    <div>
                      <Label>Date</Label>
                      <Input value={new Date(selectedFeedback.date).toLocaleDateString()} readOnly className="mt-1 bg-gray-50 dark:bg-gray-800" />
                    </div>
                    <div>
                      <Label>Time</Label>
                      <Input value={new Date(selectedFeedback.date).toLocaleTimeString()} readOnly className="mt-1 bg-gray-50 dark:bg-gray-800" />
                    </div>
                    <div>
                      <Label>Rating</Label>
                      <Input value={selectedFeedback.rating} readOnly className="mt-1 bg-gray-50 dark:bg-gray-800" />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input value={selectedFeedback.description} readOnly className="mt-1 bg-gray-50 dark:bg-gray-800" />
                    </div>
                  </div>

                  {/* Status display for feedback */}
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Input value={selectedFeedback.status || 'Pending'} readOnly className="mt-1 bg-gray-50 dark:bg-gray-800" /> {/* Always view-only */}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">Select feedback</p>
                  <p className="text-muted-foreground">Choose feedback from the list to view details</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
