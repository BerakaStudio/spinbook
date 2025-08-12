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
        console.log('Get events request received');
        console.log('Query parameters:', request.query);

        const { date } = request.query;
        if (!date) {
            console.error('Date parameter missing');
            return response.status(400).json({ message: 'Date parameter is required.' });
        }

        // Validar formato de fecha
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            console.error('Invalid date format:', date);
            return response.status(400).json({ message: 'Date must be in YYYY-MM-DD format.' });
        }

        console.log('Processing date:', date);

        const calendar = getGoogleCalendar();
        const calendarId = getCalendarId();
        const timeZone = getStudioTimezone();

        console.log('Configuration loaded:');
        console.log('Calendar ID:', calendarId);
        console.log('Timezone:', timeZone);

        // **FIX:** Construcción más precisa del rango de fechas
        // Crear el rango para todo el día en la timezone especificada
        const startOfDay = `${date}T00:00:00`;
        const endOfDay = `${date}T23:59:59`;

        console.log('Date range:');
        console.log('Start:', startOfDay);
        console.log('End:', endOfDay);

        const queryParams = {
            calendarId: calendarId,
            timeMin: startOfDay,
            timeMax: endOfDay,
            timeZone: timeZone,
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 50, // Límite para evitar problemas
        };

        console.log('Calendar query params:', queryParams);

        const res = await calendar.events.list(queryParams);

        console.log('Calendar API response received');
        console.log('Number of events found:', res.data.items?.length || 0);

        const events = res.data.items || [];

        // **FIX:** Procesamiento más robusto de los eventos
        const busySlots = [];

        events.forEach((event, index) => {
            console.log(`Processing event ${index + 1}:`, {
                summary: event.summary,
                start: event.start,
                end: event.end
            });

            try {
                // Manejar tanto dateTime como date (eventos de día completo)
                let startTime;
                if (event.start.dateTime) {
                    startTime = new Date(event.start.dateTime);
                } else if (event.start.date) {
                    // Evento de día completo - marcar todas las horas como ocupadas
                    for (let hour = 0; hour < 24; hour++) {
                        busySlots.push(hour);
                    }
                    return;
                } else {
                    console.warn('Event has no valid start time:', event);
                    return;
                }

                const hour = startTime.getHours();
                console.log(`Event starts at hour: ${hour}`);
                
                if (hour >= 0 && hour <= 23) {
                    busySlots.push(hour);
                } else {
                    console.warn('Invalid hour extracted:', hour);
                }
            } catch (eventError) {
                console.error('Error processing event:', eventError.message, event);
            }
        });

        // Remover duplicados y ordenar
        const uniqueBusySlots = [...new Set(busySlots)].sort((a, b) => a - b);
        
        console.log('Final busy slots:', uniqueBusySlots);
        
        return response.status(200).json(uniqueBusySlots);

    } catch (error) {
        console.error('=== GET EVENTS ERROR ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        if (error.response) {
            console.error('Google API Error Status:', error.response.status);
            console.error('Google API Error Details:', JSON.stringify(error.response.data, null, 2));
        }

        // Errores específicos
        if (error.message?.includes('credentials') || error.message?.includes('authentication')) {
            return response.status(500).json({ 
                message: 'Error de configuración del servidor.',
                debug: 'Authentication error'
            });
        }

        if (error.message?.includes('Calendar not found')) {
            return response.status(500).json({ 
                message: 'Error de configuración del calendario.',
                debug: 'Calendar not found'
            });
        }

        return response.status(500).json({ 
            message: 'Error interno del servidor.',
            debug: error.message
        });
    }
}