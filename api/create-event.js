// File: api/create-event.js
// This serverless function creates a new event in Google Calendar.

import { getGoogleCalendar, getCalendarId } from './_utils.js';

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

        // Create a single event for all contiguous selected slots
        slots.sort((a, b) => a - b);
        const startTime = slots[0];
        const endTime = slots[slots.length - 1] + 1; // End time is exclusive

        // **FIX:** Construct the date string with 'Z' to explicitly specify UTC timezone.
        // This prevents the server's local timezone from affecting the date.
        const startDateTime = new Date(`${date}T${String(startTime).padStart(2, '0')}:00:00.000Z`);
        const endDateTime = new Date(`${date}T${String(endTime).padStart(2, '0')}:00:00.000Z`);

        const event = {
            summary: `Reserva SpinBook - ${userData.name}`,
            description: `<b>Datos de la Reserva:</b>\nNombre: ${userData.name}\nEmail: ${userData.email}\nTeléfono: ${userData.phone}`,
            start: {
                dateTime: startDateTime.toISOString(),
                timeZone: 'UTC',
            },
            end: {
                dateTime: endDateTime.toISOString(),
                timeZone: 'UTC',
            },
            attendees: [
                { email: userData.email } // Add user as an attendee to send an invitation
            ],
            reminders: {
                useDefault: true,
            },
        };

        const createdEvent = await calendar.events.insert({
            calendarId: calendarId,
            resource: event,
            sendNotifications: true, // This sends the email invitation
        });

        return response.status(201).json({ message: 'Booking successful!', event: createdEvent.data });

    } catch (error) {
        console.error('Error creating event:', error);
        // Check for specific API errors if needed
        if (error.code === 409) {
            return response.status(409).json({ message: 'Uno de los horarios seleccionados ya no está disponible. Por favor, refresca la página.' });
        }
        return response.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}
