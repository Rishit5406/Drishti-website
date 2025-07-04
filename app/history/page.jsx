"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Search, Download, FileText, Calendar, Clock, Car, Zap, AlertTriangle, Sparkles, History as HistoryIcon } from "lucide-react"

export default function HistoryPage() {
  const [vehicleNumber, setVehicleNumber] = useState("")
  const [vehicleData, setVehicleData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!vehicleNumber.trim()) {
      setError("Please enter a vehicle number.");
      setVehicleData(null);
      return;
    }

    setLoading(true);
    setError(null);
    setVehicleData(null);

    try {
      const encodedVehicleNumber = encodeURIComponent(vehicleNumber.trim());

      const historyApiUrl = `/api/history`;
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

      const combinedRecords = [
        ...historyData.map(d => ({ ...d, type: 'alert', source: 'History CSV', displayTimestamp: d.datetime })),
        ...obdData.map(d => ({ ...d, type: 'obd', source: 'OBD CSV', displayTimestamp: d.GPSTime || d.DeviceTime, vehicleNumber: d.vehicleNumber || 'N/A' })),
        ...alcoholData.map(d => ({ ...d, type: 'alcohol', source: 'Alcohol CSV', displayTimestamp: d.timestamp, vehicleNumber: d.vehicleNumber || 'N/A' })),
        ...drowsinessData.map(d => ({ ...d, type: 'drowsiness', source: 'Drowsiness CSV', displayTimestamp: d.timestamp, vehicleNumber: d.vehicleNumber || 'N/A' })),
        ...visibilityData.map(d => ({ ...d, type: 'visibility', source: 'Visibility CSV', displayTimestamp: d.timestamp, vehicleNumber: d.vehicleNumber || 'N/A' })),
      ];

      setVehicleData({
        vehicleNumber: vehicleNumber.trim(),
        records: combinedRecords.sort((a, b) => new Date(b.displayTimestamp) - new Date(a.displayTimestamp)),
        photos: [],
      });

    } catch (err) {
      console.error("Failed to fetch vehicle history:", err);
      setError("Failed to fetch vehicle data. Please check the vehicle number and try again.");
      setVehicleData(null);
    } finally {
      setLoading(false);
    }
  }

  const getRecordTypeColor = (type) => {
    switch (type) {
      case 'alert': return 'secondary';
      case 'obd': return 'default';
      case 'alcohol': return 'destructive';
      case 'drowsiness': return 'warning';
      case 'visibility': return 'info';
      default: return 'secondary';
    }
  }

  const renderRecordDetails = (record) => {
    switch (record.source) {
      case 'History CSV':
        return (
          <>
            {record.fault_type && <p className="text-sm text-gray-700 dark:text-gray-300">Fault Type: {record.fault_type}</p>}
            {record.severity && <p className="text-sm text-gray-700 dark:text-gray-300">Severity: {record.severity}</p>}
            {record.location && <p className="text-sm text-gray-700 dark:text-gray-300">Location: {record.location}</p>}
            {record.description && <p className="text-sm text-gray-700 dark:text-gray-300">Description: {record.description}</p>}
          </>
        );
      case 'OBD CSV':
        return (
          <>
            {record.speed && <p className="text-sm text-gray-700 dark:text-gray-300">Speed: {record.speed} km/h</p>}
            {record.rpm && <p className="text-sm text-gray-700 dark:text-gray-300">RPM: {record.rpm}</p>}
            {record.fuelLevel && <p className="text-sm text-gray-700 dark:text-gray-300">Fuel Level: {record.fuelLevel}%</p>}
            {record.engineLoad && <p className="text-sm text-gray-700 dark:text-gray-300">Engine Load: {record.engineLoad}%</p>}
            {record.throttlePos && <p className="text-sm text-gray-700 dark:text-gray-300">Throttle Position: {record.throttlePos}%</p>}
            {record.DTCs && record.DTCs !== 'No Faults' && <p className="text-sm text-red-600 dark:text-red-400">DTCs: {record.DTCs}</p>}
          </>
        );
      case 'Alcohol CSV':
        return (
          <>
            {record.alcoholLevel && <p className="text-sm text-gray-700 dark:text-gray-300">Alcohol Level: {record.alcoholLevel}</p>}
            {record.status && <p className="text-sm text-gray-700 dark:text-gray-300">Status: {record.status}</p>}
          </>
        );
      case 'Drowsiness CSV':
        return (
          <>
            {record.drowsinessDetected && <p className="text-sm text-gray-700 dark:text-gray-300">Drowsiness Detected: {record.drowsinessDetected ? 'Yes' : 'No'}</p>}
            {record.status && <p className="text-sm text-gray-700 dark:text-gray-300">Status: {record.status}</p>}
          </>
        );
      case 'Visibility CSV':
        return (
          <>
            {record.visibilityLevel && <p className="text-sm text-gray-700 dark:text-gray-300">Visibility Level: {record.visibilityLevel}</p>}
            {record.weatherCondition && <p className="text-sm text-gray-700 dark:text-gray-300">Weather: {record.weatherCondition}</p>}
          </>
        );
      default:
        return (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Details: {record.description || record.message || "No specific details available."}
          </p>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 p-6">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-gray-900 dark:text-gray-50">
          Vehicle History Lookup
        </h1>

        <Card className="shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle>Search Vehicle</CardTitle>
            <CardDescription>Enter a vehicle number to retrieve its historical data.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-grow w-full">
                <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                <Input
                  id="vehicleNumber"
                  placeholder="e.g., MH12AB1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleSearch} disabled={loading || !vehicleNumber.trim()}>
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-white/30 rounded-full animate-spin mr-2" />
                    Searching...
                  </div>
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" /> Search
                  </>
                )}
              </Button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </CardContent>
        </Card>

        {vehicleData && (
          <div className="space-y-6">
            <Card className="shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HistoryIcon className="h-6 w-6 text-blue-600" /> History Records for {vehicleData.vehicleNumber}
                </CardTitle>
                <CardDescription>All recorded events and sensor data.</CardDescription>
              </CardHeader>
              <CardContent>
                {vehicleData.records.length > 0 ? (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {vehicleData.records.map((record, index) => (
                        <Card key={index} className="p-4 flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {record.source === 'History CSV' && <HistoryIcon className="h-5 w-5 text-blue-500" />}
                            {record.source === 'OBD CSV' && <Car className="h-5 w-5 text-green-500" />}
                            {record.source === 'Alcohol CSV' && <Zap className="h-5 w-5 text-red-500" />}
                            {record.source === 'Drowsiness CSV' && <AlertTriangle className="h-5 w-5 text-orange-500" />}
                            {record.source === 'Visibility CSV' && <Sparkles className="h-5 w-5 text-purple-500" />}
                          </div>
                          <div className="flex-grow">
                            <div className="flex justify-between items-center mb-1">
                              <p className="font-medium text-sm">{record.event || record.title || record.imageName || record.category || 'Sensor Data'}</p>
                              <Badge variant={getRecordTypeColor(record.type)} className="text-xs">{record.source.replace(' CSV', '')}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3 inline-block mr-1" />
                              {new Date(record.displayTimestamp).toLocaleDateString()}
                              <Clock className="h-3 w-3 inline-block ml-2 mr-1" />
                              {new Date(record.displayTimestamp).toLocaleTimeString()}
                            </p>
                            {/* Display vehicle number if available for clarity in demo */}
                            {record.vehicleNumber && record.vehicleNumber !== 'N/A' && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">Vehicle: {record.vehicleNumber}</p>
                            )}
                            <div className="mt-2 text-sm">
                                {renderRecordDetails(record)}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <HistoryIcon className="h-12 w-12 mx-auto mb-4" />
                    <p>No history records found for this vehicle.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}