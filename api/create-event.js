// File: api/create-event.js
// This serverless function creates a new event in Google Calendar with complete customer details.

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
        console.log('=== CREATE EVENT REQUEST START ===');
        console.log('Received request body:', JSON.stringify(request.body, null, 2));

        const { date, slots, userData } = request.body;

        // Enhanced validation
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

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            console.error('Invalid date format:', date);
            return response.status(400).json({ message: 'Date must be in YYYY-MM-DD format.' });
        }

        // Validate slots are valid hour numbers
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

        // Initialize Google Calendar service
        const calendar = getGoogleCalendar();
        const calendarId = getCalendarId();
        const timeZone = getStudioTimezone();

        console.log('Configuration:');
        console.log('Using timezone:', timeZone);
        console.log('Using calendar ID:', calendarId);

        // Check for conflicts before creating the event
        console.log('Checking for existing events on this date...');
        const existingEventsResponse = await calendar.events.list({
            calendarId: calendarId,
            timeMin: `${date}T00:00:00`,
            timeMax: `${date}T23:59:59`,
            timeZone: timeZone,
            singleEvents: true,
        });

        const existingEvents = existingEventsResponse.data.items || [];
        const busySlots = [];

        // Extract busy hours from existing events
        for (const event of existingEvents) {
            if (event.start && event.start.dateTime) {
                const eventStart = new Date(event.start.dateTime);
                const hour = eventStart.getHours();
                busySlots.push(hour);
            } else if (event.start && event.start.date) {
                // All-day event - mark all hours as busy
                for (let h = 0; h < 24; h++) {
                    busySlots.push(h);
                }
            }
        }

        // Check for conflicts with requested slots
        const conflictingSlots = validSlots.filter(slot => busySlots.includes(slot));
        if (conflictingSlots.length > 0) {
            console.error('Slot conflicts detected:', conflictingSlots);
            return response.status(409).json({ 
                message: `Los siguientes horarios ya no están disponibles: ${conflictingSlots.map(h => `${h}:00-${h+1}:00`).join(', ')}. Por favor, selecciona otros horarios.`,
                conflictingSlots
            });
        }

        // Calculate start and end times
        const sortedSlots = [...validSlots].sort((a, b) => a - b);
        const startTime = sortedSlots[0];
        const endTime = sortedSlots[sortedSlots.length - 1] + 1;

        // Format times for Google Calendar API (RFC 3339)
        const startDateTime = `${date}T${String(startTime).padStart(2, '0')}:00:00`;
        const endDateTime = `${date}T${String(endTime).padStart(2, '0')}:00:00`;

        console.log('Computed event times:');
        console.log('Start:', startDateTime);
        console.log('End:', endDateTime);
        console.log('TimeZone:', timeZone);

        // Generate unique booking ID
        const bookingId = `SB-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

        // Create comprehensive event description with all customer details
        const eventDescription = `
🎵 RESERVA SPINBOOK 🎵

═══ DATOS DEL CLIENTE ═══
👤 Cliente: ${userData.name}
📧 Email: ${userData.email}
📱 Teléfono: ${userData.phone}

═══ DETALLES DE LA RESERVA ═══
📅 Fecha: ${date}
🕐 Horarios: ${sortedSlots.map(h => `${h.toString().padStart(2, '0')}:00-${(h+1).toString().padStart(2, '0')}:00`).join(', ')}
🆔 ID de Reserva: ${bookingId}

═══ SERVICIOS INCLUIDOS ═══
🎤 Sesión de grabación/producción musical
🎛️ Estudio profesional equipado
👨‍💼 Ingeniería básica incluida

═══ NOTAS IMPORTANTES ═══
• Llegar 10 minutos antes
• Cancelaciones con 24h de anticipación
• No reembolsos por inasistencias

Generado: ${new Date().toLocaleString('es-ES', { timeZone })}
        `.trim();

        // Create the event object with all details
        const event = {
            summary: `🎵 SpinBook - ${userData.name} | ${sortedSlots.map(h => `${h}:00`).join(', ')}`,
            description: eventDescription,
            start: {
                dateTime: startDateTime,
                timeZone: timeZone,
            },
            end: {
                dateTime: endDateTime,
                timeZone: timeZone,
            },
            location: 'SpinBook Studio',
            colorId: '5', // Yellow color for easy identification
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'popup', minutes: 1440 }, // 24 hours before
                    { method: 'popup', minutes: 60 },   // 1 hour before
                ],
            },
            extendedProperties: {
                private: {
                    bookingId: bookingId,
                    customerName: userData.name,
                    customerEmail: userData.email,
                    customerPhone: userData.phone,
                    selectedSlots: JSON.stringify(sortedSlots),
                    bookingDate: date,
                    createdAt: new Date().toISOString(),
                    source: 'SpinBook'
                }
            },
            visibility: 'private', // Keep customer data private
        };

        console.log('Event object to be created:', JSON.stringify(event, null, 2));

        // Create the event in Google Calendar
        console.log('Creating event in Google Calendar...');
        const createdEvent = await calendar.events.insert({
            calendarId: calendarId,
            resource: event,
            sendNotifications: false,
        });

        console.log('✅ Event created successfully:', createdEvent.data.id);
        console.log('Event HTML Link:', createdEvent.data.htmlLink);

        return response.status(201).json({ 
            message: '¡Reserva confirmada con éxito! Tu reserva ha sido registrada en el calendario.',
            event: {
                id: bookingId, // Return our custom booking ID instead of Google's ID
                googleEventId: createdEvent.data.id,
                htmlLink: createdEvent.data.htmlLink,
                summary: createdEvent.data.summary,
                startTime: startDateTime,
                endTime: endDateTime,
                timeZone: timeZone
            }
        });

    } catch (error) {
        console.error('=== CREATE EVENT ERROR ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Log specific Google API errors
        if (error.response) {
            console.error('Google API Error Status:', error.response.status);
            console.error('Google API Error Details:', JSON.stringify(error.response.data, null, 2));
            
            // Handle specific Google API errors
            if (error.response.status === 409) {
                return response.status(409).json({ 
                    message: 'Conflicto de horario detectado. Por favor, refresca la página y selecciona otros horarios.',
                    code: 'SLOT_CONFLICT'
                });
            }
            
            if (error.response.status === 403) {
                return response.status(500).json({ 
                    message: 'Error de permisos del calendario. Contacta al administrador.',
                    code: 'CALENDAR_PERMISSION_ERROR'
                });
            }
            
            if (error.response.status === 404) {
                return response.status(500).json({ 
                    message: 'Calendario no encontrado. Verifica la configuración.',
                    code: 'CALENDAR_NOT_FOUND'
                });
            }
        }

        // Handle authentication errors
        if (error.message?.includes('credentials') || 
            error.message?.includes('authentication') ||
            error.message?.includes('unauthorized')) {
            return response.status(500).json({ 
                message: 'Error de configuración del servidor. Contacta al administrador.',
                code: 'AUTH_ERROR'
            });
        }

        // Handle quota/rate limit errors
        if (error.message?.includes('quota') || 
            error.message?.includes('limit') ||
            error.message?.includes('rate')) {
            return response.status(429).json({ 
                message: 'Límite de API excedido. Por favor, inténtalo en unos minutos.',
                code: 'RATE_LIMIT_EXCEEDED'
            });
        }

        // Handle timezone errors
        if (error.message?.includes('timezone') || 
            error.message?.includes('Invalid timezone')) {
            return response.status(500).json({ 
                message: 'Error de configuración de zona horaria. Contacta al administrador.',
                code: 'TIMEZONE_ERROR'
            });
        }

        // Generic server error
        return response.status(500).json({ 
            message: 'Error interno del servidor. Por favor, inténtalo de nuevo.',
            code: 'INTERNAL_ERROR',
            debug: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}