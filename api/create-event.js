// File: api/create-event.js
// This serverless function creates a new event in Google Calendar using the correct timezone.

import { getGoogleCalendar, getCalendarId, getStudioTimezone } from './_utils.js';

export default async function handler(request, response) {
    // CORS headers
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { date, slots, userData } = request.body;

        if (!date || !slots || !Array.isArray(slots) || slots.length === 0 || !userData) {
            return response.status(400).json({ message: 'Invalid booking data provided.' });
        }

        const calendar = getGoogleCalendar();
        const calendarId = getCalendarId();
        const timeZone = getStudioTimezone();

        slots.sort((a, b) => a - b);
        const startTime = slots[0];
        const endTime = slots[slots.length - 1] + 1;

        // **FIX:** Construct local time strings. Google's API will combine these with the timeZone.
        const startDateTime = `${date}T${String(startTime).padStart(2, '0')}:00:00`;
        const endDateTime = `${date}T${String(endTime).padStart(2, '0')}:00:00`;

        const event = {
            summary: `Reserva SpinBook - ${userData.name}`,
            description: `<b>Datos de la Reserva:</b>\nNombre: ${userData.name}\nEmail: ${userData.email}\nTeléfono: ${userData.phone}`,
            start: {
                dateTime: startDateTime,
                timeZone: timeZone,
            },
            end: {
                dateTime: endDateTime,
                timeZone: timeZone,
            },
            attendees: [
                { email: userData.email }
            ],
            reminders: {
                useDefault: true,
            },
        };

        // Diagnostic log: This will show the exact object sent to Google in Vercel logs.
        console.log('Attempting to create event:', JSON.stringify(event, null, 2));

        const createdEvent = await calendar.events.insert({
            calendarId: calendarId,
            resource: event,
            sendNotifications: true,
        });

        return response.status(201).json({ message: 'Booking successful!', event: createdEvent.data });

    } catch (error) {
        console.error('Error creating event:', error.message);
        // Log the full error from Google API if available
        if (error.response && error.response.data) {
            console.error('Google API Error Details:', JSON.stringify(error.response.data, null, 2));
        }
        
        if (error.code === 409) {
            return response.status(409).json({ message: 'Uno de los horarios seleccionados ya no está disponible. Por favor, refresca la página.' });
        }
        return response.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}
