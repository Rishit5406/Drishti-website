// app/api/drowsiness/route.js
import { NextResponse } from 'next/server';
import { getLastCsvLines } from '@/lib/sshClient';

// IMPORTANT: Replace with the actual path to your drowsiness.csv file on the remote server
const DROWSINESS_CSV_REMOTE_PATH = '/home/fast-and-furious/main/section_2_test_drive/drowsiness_log.csv';

/**
 * Parses CSV data for drowsiness.csv into an array of objects.
 * Expected headers: image_name,timestamp,left_ear,right_ear,closed_ratio,state,alert
 * @param {string} csvString - The raw CSV data as a string.
 * @returns {Array<Object>} An array of objects, where each object represents a row.
 */
function parseDrowsinessCsv(csvString) {
  const lines = csvString.trim().split('\n');
  if (lines.length <= 1) { // Account for header row
    return [];
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',');
    if (values.length !== headers.length) {
      console.warn(`Skipping malformed drowsiness row: ${line}`);
      continue;
    }

    const row = {};
    headers.forEach((header, index) => {
      const rawValue = values[index] ? values[index].trim() : '';
      switch (header) {
        case 'left_ear':
        case 'right_ear':
        case 'closed_ratio':
          row[header] = parseFloat(rawValue);
          break;
        case 'timestamp':
          row[header] = new Date(rawValue); // Convert to Date object
          break;
        default:
          row[header] = rawValue;
      }
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
 * Handles GET requests to /api/drowsiness.
 * Fetches the latest drowsiness data from the remote CSV file.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleNumber = searchParams.get('vehicleNumber'); // For client-side filtering
    const startTimeParam = searchParams.get('startTime');
    const endTimeParam = searchParams.get('endTime');

    const csvData = await getLastCsvLines(DROWSINESS_CSV_REMOTE_PATH, 50); // Fetch latest 50 records
    let parsedData = parseDrowsinessCsv(csvData);

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
    console.error('Error fetching drowsiness data:', error.message);
    return NextResponse.json(
      { message: 'Failed to fetch drowsiness data', error: error.message },
      { status: 500 }
    );
  }
}
