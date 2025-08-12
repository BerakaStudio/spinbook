// File: api/get-events.js
// This serverless function fetches existing events for a given date and returns busy slots.

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

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            console.error('Invalid date format:', date);
            return response.status(400).json({ message: 'Date must be in YYYY-MM-DD format.' });
        }

        console.log('Processing date:', date);

        // Initialize services with error handling
        let calendar, calendarId, timeZone;
        
        try {
            calendar = getGoogleCalendar();
            calendarId = getCalendarId();
            timeZone = getStudioTimezone();
            console.log('✅ Services initialized successfully');
        } catch (initError) {
            console.error('❌ Service initialization error:', initError.message);
            return response.status(500).json({ 
                message: 'Error de configuración del servidor.',
                code: 'SERVICE_INIT_ERROR',
                debug: initError.message
            });
        }

        console.log('Configuration:');
        console.log('📅 Calendar ID:', calendarId);
        console.log('🕐 Timezone:', timeZone);

        // Calculate date range for the entire day in the studio's timezone
        const startOfDay = `${date}T00:00:00`;
        const endOfDay = `${date}T23:59:59`;

        console.log('Date range for query:');
        console.log('⏰ Start:', startOfDay);
        console.log('⏰ End:', endOfDay);

        // Prepare Google Calendar API query
        const queryParams = {
            calendarId: calendarId,
            timeMin: startOfDay,
            timeMax: endOfDay,
            timeZone: timeZone,
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 100, // Reasonable limit to avoid large responses
        };

        console.log('🔍 Making Calendar API request...');
        
        // Execute the Calendar API call with timeout
        const calendarResponse = await Promise.race([
            calendar.events.list(queryParams),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Calendar API timeout')), 10000)
            )
        ]);

        console.log('✅ Calendar API response received');
        console.log('📊 Response status:', calendarResponse.status);
        console.log('📝 Number of events found:', calendarResponse.data.items?.length || 0);

        const events = calendarResponse.data.items || [];
        const busySlots = new Set(); // Use Set to automatically handle duplicates

        // Process each event to extract busy hours
        console.log('🔄 Processing events...');
        
        events.forEach((event, index) => {
            console.log(`📋 Event ${index + 1}:`, {
                summary: event.summary || 'No title',
                start: event.start,
                end: event.end,
                status: event.status
            });

            // Skip cancelled events
            if (event.status === 'cancelled') {
                console.log('⚠️ Skipping cancelled event');
                return;
            }

            try {
                if (event.start && event.start.dateTime) {
                    // Regular timed event
                    const eventStart = new Date(event.start.dateTime);
                    const eventEnd = new Date(event.end.dateTime);
                    
                    // Extract all hours that this event covers
                    const startHour = eventStart.getHours();
                    const endHour = eventEnd.getHours();
                    
                    console.log(`⏰ Event time range: ${startHour}:00 - ${endHour}:00`);
                    
                    // Mark all hours from start to end as busy
                    for (let hour = startHour; hour < endHour; hour++) {
                        if (hour >= 0 && hour <= 23) {
                            busySlots.add(hour);
                            console.log(`🔒 Hour ${hour} marked as busy`);
                        }
                    }
                    
                    // If event spans into the next hour, mark that too
                    if (eventEnd.getMinutes() > 0 && endHour <= 23) {
                        busySlots.add(endHour);
                        console.log(`🔒 Hour ${endHour} marked as busy (partial)`);}
                    
                } else if (event.start && event.start.date) {
                    // All-day event - mark entire day as busy
                    console.log('📅 All-day event detected - marking entire day as busy');
                    for (let hour = 0; hour < 24; hour++) {
                        busySlots.add(hour);
                    }
                }
            } catch (eventError) {
                console.error('⚠️ Error processing individual event:', eventError.message);
                console.error('Event data:', JSON.stringify(event, null, 2));
                // Continue processing other events
            }
        });

        // Convert Set to sorted array
        const sortedBusySlots = Array.from(busySlots).sort((a, b) => a - b);
        
        console.log('📊 Final processing results:');
        console.log('🔒 Total busy slots:', sortedBusySlots.length);
        console.log('🔒 Busy hours:', sortedBusySlots);
        console.log('✅ GET EVENTS SUCCESS');
        
        // Return the busy slots array
        return response.status(200).json(sortedBusySlots);

    } catch (error) {
        console.error('=== GET EVENTS ERROR ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Log detailed Google API error information
        if (error.response) {
            console.error('🔴 Google API Error Details:');
            console.error('Status:', error.response.status);
            console.error('Status Text:', error.response.statusText);
            if (error.response.data) {
                console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
            }
        }

        if (error.code) {
            console.error('Error code:', error.code);
        }

        // Handle specific error types with appropriate responses
        let errorMessage = 'Error interno del servidor.';
        let statusCode = 500;
        let errorCode = 'INTERNAL_ERROR';

        if (error.message?.includes('timeout')) {
            errorMessage = 'La consulta al calendario tardó demasiado. Inténtalo de nuevo.';
            statusCode = 504;
            errorCode = 'TIMEOUT_ERROR';
            console.error('🕐 TIMEOUT ERROR DETECTED');
            
        } else if (error.message?.includes('credentials') || 
                   error.message?.includes('authentication') ||
                   error.message?.includes('unauthorized')) {
            errorMessage = 'Error de autenticación del calendario.';
            statusCode = 500;
            errorCode = 'AUTH_ERROR';
            console.error('🔐 AUTHENTICATION ERROR DETECTED');
            
        } else if (error.message?.includes('Calendar not found') || 
                   error.message?.includes('calendarId') ||
                   (error.response && error.response.status === 404)) {
            errorMessage = 'Calendario no encontrado. Verifica la configuración.';
            statusCode = 500;
            errorCode = 'CALENDAR_NOT_FOUND';
            console.error('📅 CALENDAR NOT FOUND ERROR DETECTED');
            
        } else if (error.message?.includes('quota') || 
                   error.message?.includes('limit') ||
                   error.message?.includes('rate') ||
                   (error.response && error.response.status === 429)) {
            errorMessage = 'Límite de API excedido. Inténtalo en unos minutos.';
            statusCode = 429;
            errorCode = 'RATE_LIMIT_EXCEEDED';
            console.error('⚡ RATE LIMIT ERROR DETECTED');
            
        } else if (error.response && error.response.status === 403) {
            errorMessage = 'Sin permisos para acceder al calendario.';
            statusCode = 500;
            errorCode = 'PERMISSION_DENIED';
            console.error('🚫 PERMISSION DENIED ERROR DETECTED');
            
        } else if (error.message?.includes('network') || 
                   error.message?.includes('connection')) {
            errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
            statusCode = 503;
            errorCode = 'NETWORK_ERROR';
            console.error('🌐 NETWORK ERROR DETECTED');
        }

        console.error('=== END ERROR LOG ===');

        return response.status(statusCode).json({ 
            message: errorMessage,
            code: errorCode,
            debug: process.env.NODE_ENV === 'development' ? {
                originalError: error.message,
                timestamp: new Date().toISOString()
            } : undefined
        });
    }
}