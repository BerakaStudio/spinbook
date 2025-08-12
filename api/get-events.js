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
        const timeZone = getStudioTimezone(); // **FIX: Get the studio's timezone**

        // **FIX: Use local time strings and specify the timezone in the API call**
        const timeMin = `${date}T00:00:00`;
        const timeMax = `${date}T23:59:59`;

        const res = await calendar.events.list({
            calendarId: calendarId,
            timeMin: new Date(timeMin).toISOString(),
            timeMax: new Date(timeMax).toISOString(),
            timeZone: timeZone, // **FIX: Tell Google which timezone to use for filtering**
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = res.data.items;

        // **FIX: Convert event start time to the studio's timezone before extracting the hour**
        const busySlots = events.map(event => {
            const localStartTime = new Date(event.start.dateTime);
            // Format the date to the studio's timezone to get the correct local hour
            const timeInStudioZone = new Intl.DateTimeFormat('en-GB', {
                timeZone: timeZone,
                hour: 'numeric',
                hour12: false
            }).format(localStartTime);
            
            return parseInt(timeInStudioZone, 10);
        });
        
        return response.status(200).json(busySlots);

    } catch (error) {
        console.error('Error fetching calendar events:', error.message);
        return response.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}
