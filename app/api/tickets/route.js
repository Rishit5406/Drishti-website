import { NextResponse } from 'next/server';
import { getFileContent, overwriteFileContent } from '@/lib/sshClient';

const TICKETS_CSV_REMOTE_PATH = '/home/fast-and-furious/main/drishti/tickets/tickets.csv';

/**
 * Unescapes a CSV field by removing surrounding quotes and unescaping double quotes.
 * @param {string} value
 * @returns {string}
 */
function unescapeCsvValue(value) {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/""/g, '"');
  }
  return value;
}

/**
 * Parses CSV data for tickets.csv into an array of objects.
 * Expected headers: id,vehicleNumber,issueType,title,description,incidentDate,incidentTime,status,priority,createdAt,adminResponse
 * @param {string} csvString - The raw CSV data as a string.
 * @returns {{headers: string[], data: Array<Object>}} An object containing headers and parsed data.
 */
function parseTicketsCsv(csvString) {
  const lines = csvString.trim().split('\n');
  if (lines.length <= 1) {
    return { headers: [], data: [] };
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(','); // Still basic CSV parsing
    while (values.length < headers.length) {
      values.push('');
    }

    const row = {};
    headers.forEach((header, index) => {
      let rawValue = values[index] ? unescapeCsvValue(values[index].trim()) : '';
      if (header === 'createdAt' || header === 'incidentDate' || header === 'updatedAt') {
        try {
          const date = new Date(rawValue);
          row[header] = isNaN(date.getTime()) ? rawValue : date;
        } catch (e) {
          row[header] = rawValue;
        }
      } else {
        row[header] = rawValue;
      }
    });

    data.push(row);
  }

  return { headers, data };
}

/**
 * Converts an array of objects back into a CSV string.
 * @param {string[]} headers - Array of CSV headers.
 * @param {Array<Object>} data - Array of data objects.
 * @returns {string} CSV formatted string.
 */
function toCsvString(headers, data) {
  const headerLine = headers.join(',');
  const dataLines = data.map(row => {
    return headers.map(header => {
      let value = row[header];
      if (value instanceof Date) {
        if (header === 'incidentDate') {
          value = value.toISOString().split('T')[0];
        } else if (header === 'incidentTime') {
          value = row[header];
        } else {
          value = value.toISOString();
        }
      }

      value = value === undefined || value === null ? '' : String(value);

      if (value.includes(',') || value.includes('\n') || value.includes('"')) {
        return `"${value.replace(/"/g, '""')}"`;
      }

      return value;
    }).join(',');
  });

  return [headerLine, ...dataLines].join('\n');
}

/**
 * Handles GET requests to /api/tickets.
 */
export async function GET(request) {
  try {
    const csvData = await getFileContent(TICKETS_CSV_REMOTE_PATH);
    const { data: tickets } = parseTicketsCsv(csvData);

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets data:', error.message);
    return NextResponse.json(
      { message: 'Failed to fetch tickets data', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handles PUT requests to /api/tickets/[id].
 */
export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('id');

    if (!ticketId) {
      return NextResponse.json({ message: 'Ticket ID is required' }, { status: 400 });
    }

    const { status, priority, adminResponse } = await request.json();

    if ([status, priority, adminResponse].every(v => v === undefined)) {
      return NextResponse.json({ message: 'No update data provided' }, { status: 400 });
    }

    const currentCsvContent = await getFileContent(TICKETS_CSV_REMOTE_PATH);
    const { headers, data: tickets } = parseTicketsCsv(currentCsvContent);

    let updated = false;
    const updatedTickets = tickets.map(ticket => {
      if (ticket.id === ticketId) {
        updated = true;
        return {
          ...ticket,
          status: status ?? ticket.status,
          priority: priority ?? ticket.priority,
          adminResponse: adminResponse ?? ticket.adminResponse,
          updatedAt: new Date(),
        };
      }
      return ticket;
    });

    if (!updated) {
      return NextResponse.json({ message: 'Ticket not found' }, { status: 404 });
    }

    if (!headers.includes('updatedAt')) {
      headers.push('updatedAt');
      updatedTickets.forEach(ticket => {
        if (!('updatedAt' in ticket)) {
          ticket.updatedAt = '';
        }
      });
    }

    const newCsvContent = toCsvString(headers, updatedTickets);
    await overwriteFileContent(TICKETS_CSV_REMOTE_PATH, newCsvContent);

    return NextResponse.json({ message: 'Ticket updated successfully' });
  } catch (error) {
    console.error('Error updating ticket:', error.message);
    return NextResponse.json(
      { message: 'Failed to update ticket', error: error.message },
      { status: 500 }
    );
  }
}
