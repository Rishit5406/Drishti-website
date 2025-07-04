// app/api/complaints/route.js
import { NextResponse } from 'next/server';
import { getFileContent } from '@/lib/sshClient';

// IMPORTANT: Replace with the actual path to your complaints.csv file on the remote server
const COMPLAINTS_CSV_REMOTE_PATH = '/home/fast-and-furious/main/drishti/complaints/complaints.csv';

/**
 * Parses CSV data for complaints.csv into an array of objects.
 * Expected data format: "CMPLT70554799","complaintfeature","complaint msg","2025-07-01T11:49:14.800Z"
 * @param {string} csvString - The raw CSV data as a string.
 * @returns {Array<Object>} An array of objects, where each object represents a row.
 */
function parseComplaintsCsv(csvString) {
  const lines = csvString.trim().split('\n');
  if (lines.length === 0) {
    return [];
  }

  // Define headers based on the expected CSV structure
  const headers = ['id', 'category', 'description', 'timestamp'];
  const data = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV line - handle quoted fields properly
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last value
    if (current) {
      values.push(current.trim());
    }

    // Clean up quoted values
    const cleanValues = values.map(val => {
      // Remove surrounding quotes if present
      if (val.startsWith('"') && val.endsWith('"')) {
        return val.slice(1, -1);
      }
      return val;
    });

    // Ensure we have enough values for the defined headers
    while (cleanValues.length < headers.length) {
      cleanValues.push('');
    }

    const row = {};
    headers.forEach((header, index) => {
      const rawValue = cleanValues[index] || '';
      
      if (header === 'timestamp') {
        try {
          const date = new Date(rawValue);
          row[header] = isNaN(date.getTime()) ? new Date() : date;
        } catch (e) {
          row[header] = new Date();
        }
      } else {
        row[header] = rawValue;
      }
    });

    // Add required fields for the frontend
    row.status = 'Pending'; // Default status
    row.vehicleNumber = extractVehicleNumber(row.description) || 'N/A';
    row.title = row.category || 'Complaint';
    row.date = row.timestamp;
    row.adminResponse = ''; // Default empty response

    data.push(row);
  }

  return data;
}

/**
 * Extract vehicle number from description if present
 * @param {string} description 
 * @returns {string|null}
 */
function extractVehicleNumber(description) {
  // Common vehicle number patterns (adjust as needed)
  const patterns = [
    /[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}/g, // Standard Indian format
    /[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{1,4}/g, // Variations
  ];
  
  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return null;
}

/**
 * Handles GET requests to /api/complaints.
 * Fetches complaints data directly from the CSV file.
 */
export async function GET(request) {
  try {
    console.log('Fetching complaints from:', COMPLAINTS_CSV_REMOTE_PATH);
    
    const csvData = await getFileContent(COMPLAINTS_CSV_REMOTE_PATH);
    
    if (!csvData || csvData.trim() === '') {
      console.log('No data found in CSV file');
      return NextResponse.json([]);
    }
    
    const complaints = parseComplaintsCsv(csvData);
    
    console.log(`Successfully parsed ${complaints.length} complaints`);
    return NextResponse.json(complaints);
    
  } catch (error) {
    console.error('Error fetching complaints data:', error.message);
    console.error('Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        message: 'Failed to fetch complaints data', 
        error: error.message,
        path: COMPLAINTS_CSV_REMOTE_PATH
      },
      { status: 500 }
    );
  }
}