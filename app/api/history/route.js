// app/api/history/route.js
import { NextResponse } from 'next/server';
import { getFileContent } from '@/lib/sshClient';

const HISTORY_CSV_REMOTE_PATH = '/home/fast-and-furious/main/master_log.csv';

function parseHistoryCsv(csvString) {
  const lines = csvString.trim().split('\n');
  if (lines.length <= 1) {
    return [];
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',');
    if (values.length !== headers.length) {
      console.warn(`Skipping malformed history row: ${line}`);
      continue;
    }

    const row = {};
    headers.forEach((header, index) => {
      const rawValue = values[index] ? values[index].trim() : '';
      if (header === 'datetime') {
        row[header] = new Date(rawValue);
      } else {
        row[header] = rawValue;
      }
    });
    if (!row.vehicleNumber) {
      row.vehicleNumber = 'N/A';
    }
    data.push(row);
  }
  return data;
}

export async function GET(request) {
  try {
    const csvData = await getFileContent(HISTORY_CSV_REMOTE_PATH);
    let parsedData = parseHistoryCsv(csvData);

    return NextResponse.json(parsedData);

  } catch (error) {
    console.error('Error fetching history data:', error.message);
    return NextResponse.json(
      { message: 'Failed to fetch history data', error: error.message },
      { status: 500 }
    );
  }
}