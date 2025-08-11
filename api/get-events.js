// File: api/get-events.js
// This serverless function fetches existing events for a given date from Google Calendar.

import { getGoogleCalendar, getCalendarId } from './_utils.js';

export default async function handler(request, response) {
    // Allow requests from any origin. For production, you might want to restrict this.
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }
    
    if (request.method !== 'GET') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { date } = request.query;
        if (!date) {
            return response.status(400).json({ message: 'Date parameter is required.' });
        }

        const calendar = getGoogleCalendar();
        const calendarId = getCalendarId();

        // Set timeMin and timeMax to cover the entire booking window for the given date
        const timeMin = new Date(`${date}T17:00:00.000Z`);
        // We set it to 23:00 to catch the 21:00-22:00 slot correctly.
        const timeMax = new Date(`${date}T23:00:00.000Z`);

        const res = await calendar.events.list({
            calendarId: calendarId,
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = res.data.items;
        // Extract the starting hour (in UTC) of each busy slot
        const busySlots = events.map(event => new Date(event.start.dateTime).getUTCHours());
        
        return response.status(200).json(busySlots);

    } catch (error) {
        console.error('Error fetching calendar events:', error);
        return response.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}
