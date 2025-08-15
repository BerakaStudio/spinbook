// File: api/get-events.js
// This serverless function fetches existing events for a given date using the correct timezone.
// © José Lobos Sanhueza, Beraka Studio, 2025

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

        // Formato correcto para Google Calendar API con timezone
        // Usar formato ISO 8601 completo con zona horaria
        const startDateTime = `${date}T00:00:00`;
        const endDateTime = `${date}T23:59:59`;

        // Crear objetos Date para validar y formatear correctamente
        const startDate = new Date(`${date}T00:00:00`);
        const endDate = new Date(`${date}T23:59:59`);
        
        // Formatear con zona horaria usando toISOString y ajustando timezone
        const timeZoneOffset = getTimezoneOffset(timeZone, startDate);
        const startDateTimeWithTZ = new Date(startDate.getTime() - timeZoneOffset).toISOString();
        const endDateTimeWithTZ = new Date(endDate.getTime() - timeZoneOffset).toISOString();

        console.log('Date range (corrected):');
        console.log('Start DateTime:', startDateTimeWithTZ);
        console.log('End DateTime:', endDateTimeWithTZ);
        console.log('TimeZone:', timeZone);

        const queryParams = {
            calendarId: calendarId,
            timeMin: startDateTimeWithTZ,
            timeMax: endDateTimeWithTZ,
            timeZone: timeZone,
            singleEvents: true,
            orderBy: 'startTime',
            showDeleted: false,
            maxResults: 250
        };

        console.log('Making Calendar API request with params:', JSON.stringify(queryParams, null, 2));
        
        const res = await calendar.events.list(queryParams);

        console.log('Calendar API response received');
        console.log('Raw response status:', res.status);
        console.log('Number of events found:', res.data.items?.length || 0);

        const events = res.data.items || [];
        const busySlots = new Set();

        // Procesamiento de eventos con mejor manejo de timezone
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            
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
                    // Mejor manejo de timezone en eventos
                    const eventStartTime = new Date(event.start.dateTime);
                    const eventEndTime = new Date(event.end.dateTime);
                    
                    // Convertir a la zona horaria del estudio para comparación precisa
                    const studioStartTime = convertToStudioTime(eventStartTime, timeZone);
                    const studioEndTime = convertToStudioTime(eventEndTime, timeZone);
                    
                    console.log(`Event time range (studio timezone): ${studioStartTime.toLocaleString('es-ES')} - ${studioEndTime.toLocaleString('es-ES')}`);

                    const startHour = studioStartTime.getHours();
                    const endHour = studioEndTime.getHours();
                    const actualEndHour = studioEndTime.getMinutes() === 0 ? endHour : endHour + 1;

                    console.log(`Event occupies hours from ${startHour} to ${actualEndHour} (exclusive)`);
                    
                    for (let hour = startHour; hour < actualEndHour; hour++) {
                        if (hour >= 0 && hour <= 23) {
                            busySlots.add(hour);
                            console.log(`Marking hour ${hour} as busy`);
                        }
                    }
                    
                } else if (event.start && event.start.date) {
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
            }
        }

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
        } else if (error.message?.includes('Bad Request') || error.code === 400) {
            errorMessage = 'Error en el formato de la solicitud. Revisa la configuración de fecha.';
            console.error('BAD REQUEST ERROR - Possible datetime format issue');
        }

        console.error('=== END ERROR LOG ===');

        return response.status(statusCode).json({ 
            message: errorMessage,
            debug: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

// Obtener offset de timezone
function getTimezoneOffset(timeZone, date) {
    try {
        const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
        const studioDate = new Date(date.toLocaleString('en-US', { timeZone: timeZone }));
        return studioDate.getTime() - utcDate.getTime();
    } catch (error) {
        console.warn('Timezone offset calculation failed, using 0:', error.message);
        return 0;
    }
}

// Convertir tiempo a zona horaria del estudio
function convertToStudioTime(date, timeZone) {
    try {
        // Crear formatter para la zona horaria del estudio
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        
        const parts = formatter.formatToParts(date);
        const formattedParts = {};
        parts.forEach(part => {
            formattedParts[part.type] = part.value;
        });
        
        return new Date(
            parseInt(formattedParts.year),
            parseInt(formattedParts.month) - 1,
            parseInt(formattedParts.day),
            parseInt(formattedParts.hour),
            parseInt(formattedParts.minute),
            parseInt(formattedParts.second)
        );
    } catch (error) {
        console.warn('Studio time conversion failed, using original date:', error.message);
        return date;
    }
}