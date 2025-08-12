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
        console.log('Received request body:', JSON.stringify(request.body, null, 2));

        const { date, slots, userData } = request.body;

        // Validación más robusta
        if (!date || typeof date !== 'string') {
            console.error('Invalid date:', date);
            return response.status(400).json({ message: 'Date is required and must be a string.' });
        }

        if (!slots || !Array.isArray(slots) || slots.length === 0) {
            console.error('Invalid slots:', slots);
            return response.status(400).json({ message: 'Slots are required and must be a non-empty array.' });
        }

        if (!userData || !userData.name || !userData.email || !userData.phone) {
            console.error('Invalid userData:', userData);
            return response.status(400).json({ message: 'User data is incomplete.' });
        }

        // Validar formato de fecha (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            console.error('Invalid date format:', date);
            return response.status(400).json({ message: 'Date must be in YYYY-MM-DD format.' });
        }

        // Validar que las slots sean números válidos
        const validSlots = slots.filter(slot => 
            typeof slot === 'number' && 
            Number.isInteger(slot) && 
            slot >= 0 && 
            slot <= 23
        );

        if (validSlots.length !== slots.length) {
            console.error('Invalid slots format:', slots);
            return response.status(400).json({ message: 'All slots must be valid hour numbers (0-23).' });
        }

        const calendar = getGoogleCalendar();
        const calendarId = getCalendarId();
        const timeZone = getStudioTimezone();

        console.log('Using timezone:', timeZone);
        console.log('Using calendar ID:', calendarId);

        // Ordenar slots y calcular horarios
        const sortedSlots = [...validSlots].sort((a, b) => a - b);
        const startTime = sortedSlots[0];
        const endTime = sortedSlots[sortedSlots.length - 1] + 1;

        // **FIX PRINCIPAL:** Formato correcto para Google Calendar API
        // Google Calendar requiere formato RFC 3339 con timezone explícito
        const startDateTime = `${date}T${String(startTime).padStart(2, '0')}:00:00`;
        const endDateTime = `${date}T${String(endTime).padStart(2, '0')}:00:00`;

        console.log('Computed times:');
        console.log('Start:', startDateTime);
        console.log('End:', endDateTime);
        console.log('TimeZone:', timeZone);

        const event = {
            summary: `Reserva SpinBook - ${userData.name}`,
            description: `Datos de la Reserva:\nNombre: ${userData.name}\nEmail: ${userData.email}\nTeléfono: ${userData.phone}\nHorarios: ${sortedSlots.map(h => `${h}:00-${h+1}:00`).join(', ')}`,
            start: {
                dateTime: startDateTime,
                timeZone: timeZone,
            },
            end: {
                dateTime: endDateTime,
                timeZone: timeZone,
            },
            // NOTE: Removed attendees because service accounts cannot invite attendees
            // without Domain-Wide Delegation. The user info is included in the description instead.
            reminders: {
                useDefault: false, // Changed to false since we can't send to attendees
            },
        };

        // Log detallado del evento que se va a crear
        console.log('Event object to be created:', JSON.stringify(event, null, 2));

        // Verificar credenciales antes de la llamada
        console.log('Calendar service initialized');

        const createdEvent = await calendar.events.insert({
            calendarId: calendarId,
            resource: event,
            sendNotifications: false, // Changed to false since we have no attendees
        });

        console.log('Event created successfully:', createdEvent.data.id);

        return response.status(201).json({ 
            message: 'Reserva confirmada con éxito! Tu reserva ha sido registrada en el calendario.',
            event: {
                id: createdEvent.data.id,
                htmlLink: createdEvent.data.htmlLink,
                summary: createdEvent.data.summary
            }
        });

    } catch (error) {
        console.error('=== DETAILED ERROR LOG ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Log específico de errores de Google API
        if (error.response) {
            console.error('Google API Error Status:', error.response.status);
            console.error('Google API Error Details:', JSON.stringify(error.response.data, null, 2));
        }

        if (error.code) {
            console.error('Error code:', error.code);
        }

        // Manejar tipos específicos de error
        if (error.message?.includes('credentials') || error.message?.includes('authentication')) {
            return response.status(500).json({ 
                message: 'Error de configuración del servidor. Contacta al administrador.',
                debug: 'Authentication error'
            });
        }
        
        if (error.code === 409 || error.message?.includes('conflict')) {
            return response.status(409).json({ 
                message: 'Uno de los horarios seleccionados ya no está disponible. Por favor, refresca la página.' 
            });
        }

        if (error.message?.includes('Calendar not found') || error.message?.includes('calendarId')) {
            return response.status(500).json({ 
                message: 'Error de configuración del calendario. Contacta al administrador.',
                debug: 'Calendar configuration error'
            });
        }

        // Error genérico
        return response.status(500).json({ 
            message: 'Error interno del servidor. Por favor, inténtalo de nuevo.',
            debug: error.message
        });
    }
}