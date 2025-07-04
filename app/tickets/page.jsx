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
import { Progress } from "@/components/ui/progress"
// Corrected import path for DashboardLayout
import { DashboardLayout } from "@/components/dashboard-layout"
import { Search, Calendar, Clock, Car, AlertTriangle, Edit, Save, X, Zap, Trophy, Target, Sparkles, History } from "lucide-react"

export default function TicketsPage() {
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [editingTicket, setEditingTicket] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [historyRecords, setHistoryRecords] = useState([])
  const [resolvedToday, setResolvedToday] = useState(0) // Will be updated from fetched data
  const [targetResolutions, setTargetResolutions] = useState(12) // Static for now, can be dynamic
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // 'saving', 'saved', 'error'

  // Fetch tickets on component mount
  useEffect(() => {
    fetchTickets();
  }, [])

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const response = await fetch('/api/tickets');
      if (!response.ok) throw new Error('Failed to fetch tickets');
      const data = await response.json();
      setTickets(data);
      // Calculate resolved today
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of today
      const resolvedCount = data.filter(ticket =>
        ticket.status === 'Resolved' && new Date(ticket.updatedAt || ticket.createdAt) >= today
      ).length;
      setResolvedToday(resolvedCount);

    } catch (error) {
      console.error("Error fetching tickets:", error);
      // Handle error display to user
    } finally {
      setLoadingTickets(false);
    }
  }

  const handleTicketSelect = async (ticket) => {
    setSelectedTicket(ticket);
    setEditingTicket(null); // Reset editing state
    setHistoryRecords([]); // Clear previous history
    if (ticket.vehicleNumber && ticket.incidentDate && ticket.incidentTime) {
      // Fetch history for the selected ticket
      await fetchTicketHistory(ticket.vehicleNumber, ticket.incidentDate, ticket.incidentTime);
    }
  }

  const fetchTicketHistory = async (vehicleNumber, incidentDate, incidentTime) => {
    setLoadingHistory(true);
    try {
      // Ensure incidentDate is a valid date string (YYYY-MM-DD)
      const datePart = new Date(incidentDate).toISOString().split('T')[0];
      const incidentDateTime = new Date(`${datePart}T${incidentTime}`);

      const startTime = new Date(incidentDateTime.getTime() - 30 * 60 * 1000).toISOString(); // -30 minutes
      const endTime = new Date(incidentDateTime.getTime() + 30 * 60 * 1000).toISOString();   // +30 minutes

      // Backend /api/history supports filtering by vehicleNumber and time.
      // Other sensor APIs (obd, alcohol, drowsiness, visibility) currently fetch latest 50
      // and will be filtered client-side for vehicleNumber and time range.
      const historyApiUrl = `/api/history?vehicleNumber=${encodeURIComponent(vehicleNumber)}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`;
      const obdApiUrl = `/api/obd`;
      const alcoholApiUrl = `/api/alcohol`;
      const drowsinessApiUrl = `/api/drowsiness`;
      const visibilityApiUrl = `/api/visibility`;

      const [historyRes, obdRes, alcoholRes, drowsinessRes, visibilityRes] = await Promise.all([
        fetch(historyApiUrl),
        fetch(obdApiUrl),
        fetch(alcoholApiUrl),
        fetch(drowsinessApiUrl),
        fetch(visibilityApiUrl),
      ]);

      const historyData = historyRes.ok ? await historyRes.json() : [];
      const obdData = obdRes.ok ? await obdRes.json() : [];
      const alcoholData = alcoholRes.ok ? await alcoholRes.json() : [];
      const drowsinessData = drowsinessRes.ok ? await drowsinessRes.json() : [];
      const visibilityData = visibilityRes.ok ? await visibilityRes.json() : [];

      // Combine all historical data, adding a 'source' field for clarity
      // Filter client-side for sensor data to match vehicleNumber and time window
      const combinedHistory = [
        ...historyData.map(d => ({ ...d, source: 'History CSV', displayTimestamp: d.datetime })),
        ...obdData.filter(d => d.vehicleNumber && d.vehicleNumber.toLowerCase() === vehicleNumber.toLowerCase() && new Date(d.GPSTime || d.DeviceTime) >= new Date(startTime) && new Date(d.GPSTime || d.DeviceTime) <= new Date(endTime)).map(d => ({ ...d, source: 'OBD CSV', displayTimestamp: d.GPSTime || d.DeviceTime })),
        ...alcoholData.filter(d => d.vehicleNumber && d.vehicleNumber.toLowerCase() === vehicleNumber.toLowerCase() && new Date(d.timestamp) >= new Date(startTime) && new Date(d.timestamp) <= new Date(endTime)).map(d => ({ ...d, source: 'Alcohol CSV', displayTimestamp: d.timestamp })),
        ...drowsinessData.filter(d => d.vehicleNumber && d.vehicleNumber.toLowerCase() === vehicleNumber.toLowerCase() && new Date(d.timestamp) >= new Date(startTime) && new Date(d.timestamp) <= new Date(endTime)).map(d => ({ ...d, source: 'Drowsiness CSV', displayTimestamp: d.timestamp })),
        ...visibilityData.filter(d => d.vehicleNumber && d.vehicleNumber.toLowerCase() === vehicleNumber.toLowerCase() && new Date(d.timestamp) >= new Date(startTime) && new Date(d.timestamp) <= new Date(endTime)).map(d => ({ ...d, source: 'Visibility CSV', displayTimestamp: d.timestamp })),
      ];

      // Sort by timestamp for better readability
      combinedHistory.sort((a, b) => {
        const timeA = new Date(a.displayTimestamp);
        const timeB = new Date(b.displayTimestamp);
        return timeA.getTime() - timeB.getTime();
      });

      setHistoryRecords(combinedHistory);

    } catch (error) {
      console.error("Error fetching ticket history:", error);
      setHistoryRecords([]); // Clear history on error
    } finally {
      setLoadingHistory(false);
    }
  }

  const handleEdit = () => {
    setEditingTicket({ ...selectedTicket });
  }

  const handleCancelEdit = () => {
    setEditingTicket(null);
  }

  const handleSave = async () => {
    if (!editingTicket) return;
    setSaveStatus('saving');
    try {
      const response = await fetch(`/api/tickets?id=${editingTicket.id}`, { // Use .id as per CSV
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: editingTicket.status,
          priority: editingTicket.priority,
          adminResponse: editingTicket.adminResponse,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save ticket');
      }

      // Re-fetch all tickets to ensure the data is consistent with the CSV
      await fetchTickets();
      // Find the updated ticket in the new list to ensure selectedTicket is up-to-date
      const updatedSelected = tickets.find(t => t.id === editingTicket.id);
      setSelectedTicket(updatedSelected || editingTicket); // Fallback to editingTicket if not found
      setEditingTicket(null);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000); // Clear status after 2 seconds
    } catch (error) {
      console.error("Error saving ticket:", error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000); // Clear status after 3 seconds
    }
  }

  const filteredTickets = tickets.filter(ticket =>
    ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) || // Use ticket.id
    ticket.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'High': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 p-6">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-gray-900 dark:text-gray-50">
          Ticket Management
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Panel: Ticket List */}
          <Card className="md:col-span-1 shadow-lg rounded-xl flex flex-col h-full max-h-[calc(100vh-180px)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-bold">All Tickets</CardTitle>
              <CardDescription>Manage and respond to vehicle tickets.</CardDescription>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  className="pl-10 pr-4 py-2 rounded-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden">
              {loadingTickets ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <p className="ml-3 text-muted-foreground">Loading tickets...</p>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-450px)] pr-4">
                  {filteredTickets.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No tickets found.</p>
                  ) : (
                    <div className="space-y-3">
                      {filteredTickets.map(ticket => (
                        <Card
                          key={ticket.id} // Use ticket.id
                          className={`cursor-pointer transition-all duration-200 ${
                            selectedTicket?.id === ticket.id // Use ticket.id
                              ? 'border-purple-500 ring-2 ring-purple-500 shadow-md scale-[1.01]'
                              : 'border-transparent hover:border-gray-300 dark:hover:border-gray-700'
                          }`}
                          onClick={() => handleTicketSelect(ticket)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold text-base truncate">{ticket.title}</h3>
                              <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {ticket.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Car className="h-3 w-3" />
                              <span>{ticket.vehicleNumber}</span>
                              <Calendar className="h-3 w-3 ml-auto" />
                              <span>{new Date(ticket.incidentDate).toLocaleDateString()}</span>
                              <Clock className="h-3 w-3" />
                              <span>{ticket.incidentTime}</span>
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

          {/* Right Panel: Ticket Details & History */}
          <div className="md:col-span-2 space-y-6">
            {selectedTicket ? (
              <Card className="shadow-lg rounded-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-bold">{selectedTicket.title}</CardTitle>
                    {editingTicket ? (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={saveStatus === 'saving'}>
                          <X className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={saveStatus === 'saving'}>
                          {saveStatus === 'saving' ? (
                            <div className="flex items-center">
                              <div className="w-4 h-4 border-2 border-white border-t-white/30 rounded-full animate-spin mr-2" />
                              Saving...
                            </div>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-1" /> Save
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={handleEdit}>
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    )}
                  </div>
                  <CardDescription className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4" /> {selectedTicket.vehicleNumber}
                    <Badge className={getStatusColor(selectedTicket.status)}>{selectedTicket.status}</Badge>
                    <Badge className={getPriorityColor(selectedTicket.priority)}>{selectedTicket.priority}</Badge>
                    {saveStatus === 'saved' && <span className="text-green-500 text-sm ml-2">Saved!</span>}
                    {saveStatus === 'error' && <span className="text-red-500 text-sm ml-2">Save Failed!</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Ticket ID</Label>
                      <Input value={selectedTicket.id} readOnly className="mt-1 bg-gray-50 dark:bg-gray-800" />
                    </div>
                    <div>
                      <Label>Issue Type</Label>
                      <Input value={selectedTicket.issueType} readOnly className="mt-1 bg-gray-50 dark:bg-gray-800" />
                    </div>
                    <div>
                      <Label>Incident Date</Label>
                      <Input value={new Date(selectedTicket.incidentDate).toLocaleDateString()} readOnly className="mt-1 bg-gray-50 dark:bg-gray-800" />
                    </div>
                    <div>
                      <Label>Incident Time</Label>
                      <Input value={selectedTicket.incidentTime} readOnly className="mt-1 bg-gray-50 dark:bg-gray-800" />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      {editingTicket ? (
                        <Select
                          value={editingTicket.status}
                          onValueChange={(value) => setEditingTicket(prev => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger className="w-full mt-1">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Processing">Processing</SelectItem>
                            <SelectItem value="Resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={selectedTicket.status} readOnly className="mt-1 bg-gray-50 dark:bg-gray-800" />
                      )}
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      {editingTicket ? (
                        <Select
                          value={editingTicket.priority}
                          onValueChange={(value) => setEditingTicket(prev => ({ ...prev, priority: value }))}
                        >
                          <SelectTrigger className="w-full mt-1">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={selectedTicket.priority} readOnly className="mt-1 bg-gray-50 dark:bg-gray-800" />
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <p className="text-sm mt-1">{selectedTicket.description}</p> {/* Always view-only */}
                  </div>

                  <div>
                    <Label>Admin Response</Label>
                    {editingTicket ? (
                      <Textarea
                        value={editingTicket.adminResponse}
                        onChange={(e) =>
                          setEditingTicket((prev) => (prev ? { ...prev, adminResponse: e.target.value } : null))
                        }
                        placeholder="Enter your response..."
                        className="mt-1"
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm mt-1">{selectedTicket.adminResponse || "No response yet"}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-[400px] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <AlertTriangle className="h-12 w-12 text-white" />
                  </div>
                  <p className="text-lg font-medium">Select a ticket to start earning XP!</p>
                  <p className="text-muted-foreground">
                    Choose a ticket from the list to view details and resolve issues
                  </p>
                </div>
              </Card>
            )}

            {/* History Records Card */}
            {selectedTicket && (
              <Card className="shadow-lg rounded-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <History className="h-6 w-6" /> Related Sensor History
                  </CardTitle>
                  <CardDescription>
                    Sensor data and events around the incident time (±30 min).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingHistory ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <p className="ml-3 text-muted-foreground">Loading history...</p>
                    </div>
                  ) : historyRecords.length > 0 ? (
                    <ScrollArea className="h-64 pr-4">
                      <div className="space-y-4">
                        {historyRecords.map((record, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                            <div className="flex-shrink-0">
                              {record.source === 'History CSV' && <History className="h-5 w-5 text-blue-500" />}
                              {record.source === 'OBD CSV' && <Car className="h-5 w-5 text-green-500" />}
                              {record.source === 'Alcohol CSV' && <Zap className="h-5 w-5 text-red-500" />}
                              {record.source === 'Drowsiness CSV' && <AlertTriangle className="h-5 w-5 text-orange-500" />}
                              {record.source === 'Visibility CSV' && <Sparkles className="h-5 w-5 text-purple-500" />}
                            </div>
                            <div className="flex-grow">
                              <div className="flex justify-between items-center mb-1">
                                <p className="font-medium text-sm">{record.event || record.title || record.imageName || record.category || 'Sensor Data'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(record.displayTimestamp).toLocaleString()}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                {JSON.stringify(record, null, 2)}
                              </p>
                              <Badge variant="secondary" className="mt-2 text-xs">{record.source}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <History className="h-12 w-12 mx-auto mb-4" />
                      <p>No related sensor history found for this ticket.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Daily Resolution Progress */}
            <Card className="shadow-lg rounded-xl bg-gradient-to-br from-green-50 to-teal-100 dark:from-green-950/20 dark:to-teal-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-green-600" /> Daily Resolution Progress
                </CardTitle>
                <CardDescription>
                  Track your progress towards daily ticket resolution targets.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-lg font-medium">
                  <span>Tickets Resolved Today:</span>
                  <span className="text-green-600 dark:text-green-400">{resolvedToday} / {targetResolutions}</span>
                </div>
                <Progress value={(resolvedToday / targetResolutions) * 100} className="h-4 bg-green-200 dark:bg-green-800" indicatorClassName="bg-green-600" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>Keep up the great work!</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
