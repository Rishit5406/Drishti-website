// app/api/feedback/route.js
import { NextResponse } from 'next/server';
import { getFileContent } from '@/lib/sshClient';

// IMPORTANT: Replace with the actual path to your feedback.csv file on the remote server
const FEEDBACK_CSV_REMOTE_PATH = '/home/fast-and-furious/main/drishti/feedback/feedback.csv';

/**
 * Parses CSV data for feedback.csv into an array of objects.
 * Expected data format: "FDBK70511765","feedbacktype","feedbackmsg","2025-07-01T11:48:31.765Z"
 * @param {string} csvString - The raw CSV data as a string.
 * @returns {Array<Object>} An array of objects, where each object represents a row.
 */
function parseFeedbackCsv(csvString) {
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
    row.status = 'Received'; // Default status for feedback
    row.vehicleNumber = extractVehicleNumber(row.description) || 'N/A';
    row.title = row.category || 'Feedback';
    row.rating = extractRating(row.description) || generateRandomRating();
    row.date = row.timestamp;
    row.adminResponse = ''; // Default empty response
    
    // Additional feedback-specific fields
    row.type = row.category; // Feedback type
    row.message = row.description; // Feedback message

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
 * Extract rating from description if present
 * @param {string} description 
 * @returns {number|null}
 */
function extractRating(description) {
  // Look for patterns like "5 stars", "rating: 4", "4/5", etc.
  const patterns = [
    /(\d+)\s*stars?/i,
    /rating[:\s]*(\d+)/i,
    /(\d+)\/5/i,
    /(\d+)\s*out\s*of\s*5/i,
  ];
  
  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      const rating = parseInt(match[1]);
      if (rating >= 1 && rating <= 5) {
        return rating;
      }
    }
  }
  
  return null;
}

/**
 * @returns {number}
 */
function generateRandomRating() {
  
  return 5; // Default to 5 stars
}

/**
 * Categorize feedback based on keywords in the message
 * @param {string} message 
 * @returns {string}
 */
function categorizeFeedback(message) {
  const categories = {
    'Service Quality': ['service', 'quality', 'experience', 'satisfaction'],
    'Driver Behavior': ['driver', 'behavior', 'driving', 'rude', 'polite'],
    'Vehicle Condition': ['vehicle', 'car', 'condition', 'clean', 'dirty'],
    'Timeliness': ['time', 'late', 'early', 'punctual', 'delay'],
    'Pricing': ['price', 'cost', 'expensive', 'cheap', 'fare'],
    'General': ['general', 'overall', 'feedback']
  };
  
  const lowerMessage = message.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      return category;
    }
  }
  
  return 'General';
}

/**
 * Handles GET requests to /api/feedback.
 * Fetches feedback data directly from the CSV file.
 */
export async function GET(request) {
  try {
    console.log('Fetching feedback from:', FEEDBACK_CSV_REMOTE_PATH);
    
    const csvData = await getFileContent(FEEDBACK_CSV_REMOTE_PATH);
    
    if (!csvData || csvData.trim() === '') {
      console.log('No data found in CSV file');
      return NextResponse.json([]);
    }
    
    const feedbacks = parseFeedbackCsv(csvData);
    
    // Sort feedback by date (newest first)
    feedbacks.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    console.log(`Successfully parsed ${feedbacks.length} feedback entries`);
    return NextResponse.json(feedbacks);
    
  } catch (error) {
    console.error('Error fetching feedback data:', error.message);
    console.error('Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        message: 'Failed to fetch feedback data', 
        error: error.message,
        path: FEEDBACK_CSV_REMOTE_PATH
      },
      { status: 500 }
    );
  }
}