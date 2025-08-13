// File: api/create-event.js
// This serverless function creates a new event in Google Calendar using the correct timezone.
// Updated to include detailed booking information in the calendar event.

import { getGoogleCalendar, getCalendarId, getStudioTimezone } from './_utils.js';

// MEJORA: Configuración del estudio como variable modificable
const STUDIO_CONFIG = {
    name: process.env.STUDIO_NAME || 'SpinBook Studio',
    address: process.env.STUDIO_ADDRESS || 'Pasaje Las Hortensias 2703, Portal San Francisco, Temuco',
    contact: {
        email: process.env.STUDIO_EMAIL || 'info@spinbook.com',
        phone: process.env.STUDIO_PHONE || '+56 9 1234 5678'
    }
};

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
        console.log('Using studio config:', STUDIO_CONFIG);

        // MEJORA: Verificar conflictos antes de crear el evento
        try {
            console.log('Checking for existing bookings...');
            const checkResponse = await calendar.events.list({
                calendarId: calendarId,
                timeMin: `${date}T00:00:00`,
                timeMax: `${date}T23:59:59`,
                timeZone: timeZone,
                singleEvents: true,
                orderBy: 'startTime',
            });

            const existingEvents = checkResponse.data.items || [];
            const existingSlots = [];

            existingEvents.forEach(event => {
                if (event.start && event.start.dateTime) {
                    const eventStart = new Date(event.start.dateTime);
                    const hour = eventStart.getHours();
                    existingSlots.push(hour);
                }
            });

            // Verificar si alguno de los slots solicitados ya está ocupado
            const conflictingSlots = validSlots.filter(slot => existingSlots.includes(slot));
            if (conflictingSlots.length > 0) {
                console.error('Slot conflicts detected:', conflictingSlots);
                return response.status(409).json({ 
                    message: `Los siguientes horarios ya no están disponibles: ${conflictingSlots.map(h => `${h}:00-${h+1}:00`).join(', ')}. Por favor, refresca la página y selecciona otros horarios.`
                });
            }

            console.log('No conflicts detected, proceeding with booking...');

        } catch (checkError) {
            console.error('Error checking for conflicts:', checkError.message);
            // Continue with booking but log the error
        }

        // Ordenar slots y calcular horarios
        const sortedSlots = [...validSlots].sort((a, b) => a - b);
        const startTime = sortedSlots[0];
        const endTime = sortedSlots[sortedSlots.length - 1] + 1;

        // Formato correcto para Google Calendar API
        const startDateTime = `${date}T${String(startTime).padStart(2, '0')}:00:00`;
        const endDateTime = `${date}T${String(endTime).padStart(2, '0')}:00:00`;

        console.log('Computed times:');
        console.log('Start:', startDateTime);
        console.log('End:', endDateTime);
        console.log('TimeZone:', timeZone);

        // Generar ID único para la reserva
        const bookingId = `SB-${Date.now().toString(36).toUpperCase()}`;
        
        // MEJORA: Descripción más detallada para el calendario con dirección del estudio
        const detailedDescription = `
🎵 RESERVA SPINBOOK - ESTUDIO DE GRABACIÓN 🎵

📋 DETALLES DE LA RESERVA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Cliente: ${userData.name}
📧 Email: ${userData.email}
📱 Teléfono: ${userData.phone}
📅 Fecha: ${new Date(date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
⏰ Horarios: ${sortedSlots.map(h => `${h}:00-${h+1}:00`).join(', ')}
📍 Ubicación: ${STUDIO_CONFIG.address}
🆔 ID Reserva: ${bookingId}

⚠️ INSTRUCCIONES IMPORTANTES:
• Llegar 10 minutos antes del horario reservado
• Traer identificación y este número de reserva
• Dirigirse a: ${STUDIO_CONFIG.address}
• Para cancelaciones, avisar con 24h de anticipación
• Contacto: ${STUDIO_CONFIG.contact.phone}
• Email: ${STUDIO_CONFIG.contact.email}

Reserva generada automáticamente por SpinBook
${new Date().toLocaleString('es-ES')}
        `.trim();

        const event = {
            summary: `🎵 ${userData.name} - Sesión de Grabación`,
            description: detailedDescription,
            start: {
                dateTime: startDateTime,
                timeZone: timeZone,
            },
            end: {
                dateTime: endDateTime,
                timeZone: timeZone,
            },
            // MEJORA: Añadir datos estructurados como propiedades extendidas
            extendedProperties: {
                private: {
                    spinbook_client_name: userData.name,
                    spinbook_client_email: userData.email,
                    spinbook_client_phone: userData.phone,
                    spinbook_booking_id: bookingId,
                    spinbook_slots: JSON.stringify(sortedSlots),
                    spinbook_studio_address: STUDIO_CONFIG.address,
                    spinbook_created_at: new Date().toISOString()
                }
            },
            // Configuración de colores (opcional)
            colorId: '5', // Color amarillo para destacar las reservas de SpinBook
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'popup', minutes: 60 }, // Recordatorio 1 hora antes
                    { method: 'popup', minutes: 15 }  // Recordatorio 15 minutos antes
                ]
            },
            // MEJORA: Añadir ubicación del estudio con dirección completa
            location: `${STUDIO_CONFIG.name} - ${STUDIO_CONFIG.address}`,
            // Status confirmado
            status: 'confirmed'
        };

        // Log detallado del evento que se va a crear
        console.log('Event object to be created:', JSON.stringify(event, null, 2));

        console.log('Creating calendar event...');

        const createdEvent = await calendar.events.insert({
            calendarId: calendarId,
            resource: event,
            sendNotifications: false,
        });

        console.log('Event created successfully with ID:', createdEvent.data.id);
        console.log('Event HTML link:', createdEvent.data.htmlLink);

        return response.status(201).json({ 
            message: 'Reserva confirmada con éxito! Tu reserva ha sido registrada en el calendario.',
            event: {
                id: createdEvent.data.id,
                htmlLink: createdEvent.data.htmlLink,
                summary: createdEvent.data.summary,
                bookingId: bookingId,
                studioAddress: STUDIO_CONFIG.address,
                description: 'Reserva confirmada en Google Calendar con todos los detalles.'
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