// File: api/get-events.js
// This serverless function fetches existing events for a given date using the correct timezone.

import { getGoogleCalendar, getCalendarId, getStudioTimezone } from './_utils.js';

export default async function handler(request, response) {
    // CORS headers
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
        const timeZone = getStudioTimezone();

        // **FIX:** Define the time range for the entire day in the specified timezone.
        // Google Calendar API handles the conversion correctly when timeZone is provided.
        const timeMin = new Date(`${date}T00:00:00`).toISOString();
        const timeMax = new Date(`${date}T23:59:59`).toISOString();

        const res = await calendar.events.list({
            calendarId: calendarId,
            timeMin: timeMin,
            timeMax: timeMax,
            timeZone: timeZone, // Tell Google which timezone to use for filtering
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = res.data.items;

        // **FIX:** The returned dateTime is already in the correct local timezone,
        // so we can simply extract the hour.
        const busySlots = events.map(event => {
            // new Date() will parse the ISO string (e.g., '2024-08-12T17:00:00-04:00')
            // and getHours() will return the correct local hour.
            return new Date(event.start.dateTime).getHours();
        });
        
        return response.status(200).json(busySlots);

    } catch (error) {
        console.error('Error fetching calendar events:', error.message);
        return response.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}
