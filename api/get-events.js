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
        console.log('=== GET EVENTS START ===');
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

        // Inicializar servicios con manejo de errores
        let calendar, calendarId, timeZone;
        
        try {
            calendar = getGoogleCalendar();
            calendarId = getCalendarId();
            timeZone = getStudioTimezone();
            console.log('Services initialized successfully');
        } catch (initError) {
            console.error('Service initialization error:', initError.message);
            return response.status(500).json({ 
                message: 'Error de configuración del servidor.',
                debug: initError.message
            });
        }

        console.log('Configuration:');
        console.log('Calendar ID:', calendarId);
        console.log('Timezone:', timeZone);

        // Construir rango de fechas más simple
        const [year, month, day] = date.split('-');
        const startDate = new Date(year, month - 1, day, 0, 0, 0);
        const endDate = new Date(year, month - 1, day, 23, 59, 59);

        const timeMin = startDate.toISOString();
        const timeMax = endDate.toISOString();

        console.log('Date range:');
        console.log('timeMin:', timeMin);
        console.log('timeMax:', timeMax);

        const queryParams = {
            calendarId: calendarId,
            timeMin: timeMin,
            timeMax: timeMax,
            timeZone: timeZone,
            singleEvents: true,
            orderBy: 'startTime',
        };

        console.log('Making Calendar API request...');
        
        const res = await calendar.events.list(queryParams);

        console.log('Calendar API response received');
        console.log('Raw response status:', res.status);
        console.log('Number of events found:', res.data.items?.length || 0);

        const events = res.data.items || [];
        const busySlots = [];

        // Procesar eventos de forma más simple
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            console.log(`Event ${i + 1}:`, {
                summary: event.summary || 'No title',
                start: event.start
            });

            try {
                if (event.start && event.start.dateTime) {
                    const eventStart = new Date(event.start.dateTime);
                    const hour = eventStart.getHours();
                    
                    console.log(`Event starts at hour: ${hour}`);
                    
                    if (hour >= 0 && hour <= 23) {
                        busySlots.push(hour);
                    }
                } else if (event.start && event.start.date) {
                    // Evento de día completo
                    console.log('All-day event detected');
                    for (let h = 0; h < 24; h++) {
                        busySlots.push(h);
                    }
                }
            } catch (eventError) {
                console.error('Error processing individual event:', eventError.message);
                // Continuar con el siguiente evento
            }
        }

        // Limpiar y ordenar slots
        const uniqueBusySlots = [...new Set(busySlots)].sort((a, b) => a - b);
        
        console.log('Final busy slots:', uniqueBusySlots);
        console.log('=== GET EVENTS SUCCESS ===');
        
        return response.status(200).json(uniqueBusySlots);

    } catch (error) {
        console.error('=== GET EVENTS ERROR ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Información detallada de errores de Google API
        if (error.response) {
            console.error('Google API HTTP Status:', error.response.status);
            console.error('Google API Status Text:', error.response.statusText);
            if (error.response.data) {
                console.error('Google API Error Data:', JSON.stringify(error.response.data, null, 2));
            }
        }

        if (error.code) {
            console.error('Error code:', error.code);
        }

        // Manejo específico de errores comunes
        let errorMessage = 'Error interno del servidor.';
        let statusCode = 500;

        if (error.message?.includes('credentials') || 
            error.message?.includes('authentication') ||
            error.message?.includes('unauthorized')) {
            errorMessage = 'Error de autenticación. Verifica la configuración.';
            console.error('AUTHENTICATION ERROR DETECTED');
        } else if (error.message?.includes('Calendar not found') || 
                   error.message?.includes('calendarId')) {
            errorMessage = 'Calendar no encontrado. Verifica el ID del calendar.';
            console.error('CALENDAR NOT FOUND ERROR DETECTED');
        } else if (error.message?.includes('quota') || 
                   error.message?.includes('limit')) {
            errorMessage = 'Límite de API excedido. Inténtalo más tarde.';
            statusCode = 429;
        }

        console.error('=== END ERROR LOG ===');

        return response.status(statusCode).json({ 
            message: errorMessage,
            debug: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}