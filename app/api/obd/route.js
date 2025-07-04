// app/api/obd/route.js
import { NextResponse } from 'next/server';
import { getLastCsvLines } from '@/lib/sshClient';

// IMPORTANT: Replace with the actual path to your obd.csv file on the remote server
const OBD_CSV_REMOTE_PATH = '/home/fast-and-furious/main/obd_data/trackLog.csv';

/**
 * Cleans and normalizes header names from the OBD CSV.
 * Removes special characters and units, converts to camelCase.
 * @param {string} header - The original header string.
 * @returns {string} The cleaned header string.
 */
function cleanObdHeader(header) {
  return header
    .replace(/[\(\)Â°%]/g, '') // Remove parentheses, degree symbol, percent sign
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove other non-alphanumeric characters (except space)
    .trim()
    .replace(/\s(.)/g, (match, p1) => p1.toUpperCase()) // Convert to camelCase
    .replace(/\s/g, ''); // Remove remaining spaces
}

/**
 * Parses CSV data for obd.csv into an array of objects.
 * Handles extensive headers and attempts type conversion.
 * @param {string} csvString - The raw CSV data as a string.
 * @returns {Array<Object>} An array of objects, where each object represents a row.
 */
function parseObdCsv(csvString) {
  const lines = csvString.trim().split('\n');
  if (lines.length <= 1) { // Account for header row
    return [];
  }

  const rawHeaders = lines[0].split(',').map(h => h.trim());
  const headers = rawHeaders.map(cleanObdHeader);

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',');
    if (values.length !== rawHeaders.length) {
      console.warn(`Skipping malformed OBD row: ${line}`);
      continue;
    }

    const row = {};
    headers.forEach((header, index) => {
      const rawValue = values[index] ? values[index].trim() : '';
      let parsedValue = rawValue;

      // Attempt to convert to number if it's a numeric string
      if (!isNaN(Number(rawValue)) && rawValue !== '') {
        parsedValue = Number(rawValue);
      } else if (header.toLowerCase().includes('time') || header.toLowerCase().includes('date')) {
        // Handle time/date fields specifically
        try {
          parsedValue = new Date(rawValue);
        } catch (e) {
          // Keep as string if date parsing fails
        }
      }
      row[header] = parsedValue;
    });
    // Add vehicleNumber placeholder if not present in CSV for consistency
    if (!row.vehicleNumber) {
      row.vehicleNumber = 'N/A'; // Or try to extract from image_name if pattern exists
    }
    data.push(row);
  }
  return data;
}

/**
 * Handles GET requests to /api/obd.
 * Fetches the latest OBD data from the remote CSV file.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleNumber = searchParams.get('vehicleNumber'); // For client-side filtering
    const startTimeParam = searchParams.get('startTime');
    const endTimeParam = searchParams.get('endTime');

    const csvData = await getLastCsvLines(OBD_CSV_REMOTE_PATH, 50); // Fetch latest 50 records
    let parsedData = parseObdCsv(csvData);

    // Client-side filtering if parameters are provided
    if (vehicleNumber || startTimeParam || endTimeParam) {
      const start = startTimeParam ? new Date(startTimeParam) : null;
      const end = endTimeParam ? new Date(endTimeParam) : null;

      parsedData = parsedData.filter(record => {
        const recordTime = new Date(record.GPSTime || record.DeviceTime); // Use appropriate time field
        const matchesVehicle = !vehicleNumber || (record.vehicleNumber && record.vehicleNumber.toLowerCase() === vehicleNumber.toLowerCase());
        const matchesTime = (!start || recordTime >= start) && (!end || recordTime <= end);
        return matchesVehicle && matchesTime;
      });
    }

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Error fetching OBD data:', error.message);
    return NextResponse.json(
      { message: 'Failed to fetch OBD data', error: error.message },
      { status: 500 }
    );
  }
}
