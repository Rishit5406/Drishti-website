// app/api/visibility/route.js
import { NextResponse } from 'next/server';
import { getLastCsvLines } from '@/lib/sshClient';

// IMPORTANT: Replace with the actual path to your visibility.csv file on the remote server
const VISIBILITY_CSV_REMOTE_PATH = '/home/fast-and-furious/main/section_1_test_drive/visibility_log.csv';

/**
 * Parses CSV data for visibility.csv into an array of objects.
 * Expected data: 2025-06-24,15:15:49,image_20250624_151549.jpg,69.28,78.33
 * Assumes no explicit header row, first line is data.
 * @param {string} csvString - The raw CSV data as a string.
 * @returns {Array<Object>} An array of objects, where each object represents a row.
 */
function parseVisibilityCsv(csvString) {
  const lines = csvString.trim().split('\n');
  if (lines.length === 0) {
    return [];
  }

  const headers = ['date', 'time', 'imageName', 'metric1', 'metric2']; // Defined based on example
  const data = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim());
    if (values.length !== headers.length) {
      console.warn(`Skipping malformed visibility row: ${line}`);
      continue;
    }

    const row = {
      date: values[0],
      time: values[1],
      imageName: values[2],
      metric1: parseFloat(values[3]),
      metric2: parseFloat(values[4]),
      timestamp: new Date(`${values[0]}T${values[1]}`), // Combine date and time for a full timestamp
      vehicleNumber: 'N/A' // Placeholder, as vehicleNumber is not in this CSV
    };
    data.push(row);
  }
  return data;
}

/**
 * Handles GET requests to /api/visibility.
 * Fetches the latest visibility data from the remote CSV file.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleNumber = searchParams.get('vehicleNumber'); // For client-side filtering
    const startTimeParam = searchParams.get('startTime');
    const endTimeParam = searchParams.get('endTime');

    const csvData = await getLastCsvLines(VISIBILITY_CSV_REMOTE_PATH, 50); // Fetch latest 50 records
    let parsedData = parseVisibilityCsv(csvData);

    // Client-side filtering if parameters are provided
    if (vehicleNumber || startTimeParam || endTimeParam) {
      const start = startTimeParam ? new Date(startTimeParam) : null;
      const end = endTimeParam ? new Date(endTimeParam) : null;

      parsedData = parsedData.filter(record => {
        const recordTime = new Date(record.timestamp);
        const matchesVehicle = !vehicleNumber || (record.vehicleNumber && record.vehicleNumber.toLowerCase() === vehicleNumber.toLowerCase());
        const matchesTime = (!start || recordTime >= start) && (!end || recordTime <= end);
        return matchesVehicle && matchesTime;
      });
    }

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Error fetching visibility data:', error.message);
    return NextResponse.json(
      { message: 'Failed to fetch visibility data', error: error.message },
      { status: 500 }
    );
  }
}
