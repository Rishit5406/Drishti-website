// app/api/alcohol/route.js
import { NextResponse } from 'next/server';
import { getLastCsvLines } from '@/lib/sshClient'; // Use getLastCsvLines for efficiency

// IMPORTANT: Replace with the actual path to your alcohol.csv file on the remote server
const ALCOHOL_CSV_REMOTE_PATH = '/home/fast-and-furious/main/section_4_test_drive/mq3_data.csv';

/**
 * Parses CSV data for alcohol.csv into an array of objects.
 * Expected data: 2025-07-01T13:16:08.723716+05:30,Sensor Value: 323
 * Assumes no explicit header row, first line is data.
 * @param {string} csvString - The raw CSV data as a string.
 * @returns {Array<Object>} An array of objects, where each object represents a row.
 */
function parseAlcoholCsv(csvString) {
  const lines = csvString.trim().split('\n');
  if (lines.length === 0) {
    return [];
  }

  const data = [];
  for (let i = 0; i < lines.length; i++) { // Start from 0 as no explicit header
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const parts = line.split(',');
    if (parts.length !== 2) {
      console.warn(`Skipping malformed alcohol row: ${line}`);
      continue;
    }

    const row = {
      timestamp: parts[0].trim(),
      sensorValue: parseInt(parts[1].replace('Sensor Value:', '').trim(), 10), // Parse integer
      vehicleNumber: 'N/A' // Placeholder, as vehicleNumber is not in this CSV
    };
    data.push(row);
  }
  return data;
}

/**
 * Handles GET requests to /api/alcohol.
 * Fetches the latest alcohol data from the remote CSV file.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleNumber = searchParams.get('vehicleNumber'); // For client-side filtering
    const startTimeParam = searchParams.get('startTime');
    const endTimeParam = searchParams.get('endTime');

    const csvData = await getLastCsvLines(ALCOHOL_CSV_REMOTE_PATH, 50); // Fetch latest 50 records
    let parsedData = parseAlcoholCsv(csvData);

    // Client-side filtering if parameters are provided (as backend doesn't filter this CSV)
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
    console.error('Error fetching alcohol data:', error.message);
    return NextResponse.json(
      { message: 'Failed to fetch alcohol data', error: error.message },
      { status: 500 }
    );
  }
}
