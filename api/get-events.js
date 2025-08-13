// File: api/get-events.js
// This serverless function fetches existing events for a given date using the correct timezone.
// Updated with improved error handling and stricter slot checking.

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

        // MEJORA: Rango de fechas más preciso para evitar conflictos de timezone
        const startDateTime = `${date}T00:00:00`;
        const endDateTime = `${date}T23:59:59`;

        console.log('Date range:');
        console.log('Start DateTime:', startDateTime);
        console.log('End DateTime:', endDateTime);

        const queryParams = {
            calendarId: calendarId,
            timeMin: startDateTime,
            timeMax: endDateTime,
            timeZone: timeZone,
            singleEvents: true,
            orderBy: 'startTime',
            // MEJORA: Incluir eventos cancelados para evitar conflictos
            showDeleted: false,
            // Aumentar el límite de eventos por si hay muchas reservas
            maxResults: 250
        };

        console.log('Making Calendar API request with params:', JSON.stringify(queryParams, null, 2));
        
        const res = await calendar.events.list(queryParams);

        console.log('Calendar API response received');
        console.log('Raw response status:', res.status);
        console.log('Number of events found:', res.data.items?.length || 0);

        const events = res.data.items || [];
        const busySlots = new Set(); // Usar Set para evitar duplicados automáticamente

        // MEJORA: Procesamiento más estricto de eventos
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            
            // Saltar eventos cancelados
            if (event.status === 'cancelled') {
                console.log(`Skipping cancelled event: ${event.summary || 'No title'}`);
                continue;
            }

            console.log(`Processing event ${i + 1}:`, {
                id: event.id,
                summary: event.summary || 'No title',
                status: event.status,
                start: event.start,
                end: event.end
            });

            try {
                if (event.start && event.start.dateTime) {
                    // Evento con hora específica
                    const eventStartTime = new Date(event.start.dateTime);
                    const eventEndTime = new Date(event.end.dateTime);
                    
                    console.log(`Event time range: ${eventStartTime.toLocaleString('es-ES')} - ${eventEndTime.toLocaleString('es-ES')}`);

                    // MEJORA: Marcar todos los slots que ocupa el evento
                    const startHour = eventStartTime.getHours();
                    const endHour = eventEndTime.getHours();
                    
                    // Si el evento termina exactamente en la hora (ej: 18:00), no incluir esa hora
                    const actualEndHour = eventEndTime.getMinutes() === 0 ? endHour : endHour + 1;

                    console.log(`Event occupies hours from ${startHour} to ${actualEndHour} (exclusive)`);
                    
                    // Marcar todas las horas que ocupa el evento
                    for (let hour = startHour; hour < actualEndHour; hour++) {
                        if (hour >= 0 && hour <= 23) {
                            busySlots.add(hour);
                            console.log(`Marking hour ${hour} as busy`);
                        }
                    }
                    
                } else if (event.start && event.start.date) {
                    // Evento de día completo
                    console.log('All-day event detected - marking all hours as busy');
                    for (let h = 0; h < 24; h++) {
                        busySlots.add(h);
                    }
                } else {
                    console.warn('Event with unknown time format:', event.start);
                }
                
            } catch (eventError) {
                console.error('Error processing individual event:', eventError.message);
                console.error('Event data:', JSON.stringify(event, null, 2));
                // Continuar con el siguiente evento
            }
        }

        // Convertir Set a Array y ordenar
        const finalBusySlots = Array.from(busySlots).sort((a, b) => a - b);
        
        console.log('Final busy slots:', finalBusySlots);
        console.log(`Total busy slots: ${finalBusySlots.length}`);
        console.log('=== GET EVENTS SUCCESS ===');
        
        return response.status(200).json(finalBusySlots);

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
        } else if (error.message?.includes('timeout')) {
            errorMessage = 'Tiempo de espera agotado. Inténtalo de nuevo.';
            statusCode = 408;
        }

        console.error('=== END ERROR LOG ===');

        return response.status(statusCode).json({ 
            message: errorMessage,
            debug: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}