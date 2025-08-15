// File: api/create-event.js
// This serverless function creates a new event in Google Calendar and sends Telegram notification.
// © José Lobos Sanhueza, Beraka Studio, 2025

import { getGoogleCalendar, getCalendarId, getStudioTimezone } from './_utils.js';

// Configuración del estudio como variable modificable
const STUDIO_CONFIG = {
    name: process.env.STUDIO_NAME || 'SpinBook Studio',
    address: process.env.STUDIO_ADDRESS || 'Pasaje Las Hortensias 2703, Portal San Francisco, Temuco',
    contact: {
        email: process.env.STUDIO_EMAIL || 'info@spinbook.com',
        phone: process.env.STUDIO_PHONE || '+56 9 1234 5678'
    }
};

// ✅ NUEVA: Configuración de Telegram desde variables de entorno
const TELEGRAM_CONFIG = {
    enabled: process.env.TELEGRAM_ENABLED === 'true' || process.env.TELEGRAM_ENABLED === '1',
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
    silent: process.env.TELEGRAM_SILENT === 'true' || process.env.TELEGRAM_SILENT === '1',
    parseMode: process.env.TELEGRAM_PARSE_MODE || 'Markdown'
};

// ✅ NUEVA FUNCIÓN: NOTIFICACIÓN TELEGRAM DESDE BACKEND
async function sendTelegramNotification(bookingData) {
    // Verificar si las notificaciones están habilitadas
    if (!TELEGRAM_CONFIG.enabled || !TELEGRAM_CONFIG.botToken || !TELEGRAM_CONFIG.chatId) {
        console.log('Telegram notifications disabled or not configured');
        return { success: false, reason: 'Disabled or not configured' };
    }

    // Verificar configuración básica
    if (!TELEGRAM_CONFIG.botToken.includes(':')) {
        console.warn('Invalid bot token format. Should be: XXXXXXXXX:XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
        return { success: false, reason: 'Invalid bot token format' };
    }

    try {
        const { userData, date, slots, eventId } = bookingData;
        
        // Formatear fecha correctamente
        const [year, month, day] = date.split('-').map(num => parseInt(num, 10));
        const dateObj = new Date(year, month - 1, day);
        const formattedDate = dateObj.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const timeSlots = slots.map(hour => `${hour}:00-${hour+1}:00`).join(', ');
        const currentTime = new Date().toLocaleString('es-ES');

        // Crear mensaje con formato Markdown
        const message = `🎵 *NUEVA RESERVA SPINBOOK* 🎵

📋 *DETALLES DE LA RESERVA:*
────────────────────────────────────

👤 *Cliente:* ${userData.name}
📧 *Email:* ${userData.email}
📱 *Teléfono:* ${userData.phone}

📅 *Fecha:* ${formattedDate}
⏰ *Horario:* ${timeSlots}

📍 *Ubicación:* ${STUDIO_CONFIG.address}

🎯 *ID Reserva:* \`${eventId.substring(0, 12).toUpperCase()}\`

────────────────────────────────────
⏱️ *Reserva generada:* ${currentTime}
🏢 *Estudio:* ${STUDIO_CONFIG.name}

✅ *La reserva ha sido confirmada en Google Calendar*`;

        const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage`;
        
        const payload = {
            chat_id: TELEGRAM_CONFIG.chatId,
            text: message,
            parse_mode: TELEGRAM_CONFIG.parseMode,
            disable_notification: TELEGRAM_CONFIG.silent
        };

        console.log('Sending Telegram notification from backend...');
        
        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Telegram notification sent successfully:', result.result.message_id);
            return { success: true, messageId: result.result.message_id };
        } else {
            const errorData = await response.json();
            console.error('❌ Telegram notification failed:', errorData);
            
            // Mostrar error específico si es problema de configuración
            if (errorData.error_code === 400) {
                console.error('Bad Request - Check your bot token and chat ID');
            } else if (errorData.error_code === 401) {
                console.error('Unauthorized - Invalid bot token');
            } else if (errorData.error_code === 403) {
                console.error('Forbidden - Bot was blocked by user or chat not found');
            }
            
            return { success: false, error: errorData };
        }

    } catch (error) {
        console.error('Error sending Telegram notification:', error);
        return { success: false, error: error.message };
    }
}

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
        console.log('Telegram config:', {
            enabled: TELEGRAM_CONFIG.enabled,
            hasToken: !!TELEGRAM_CONFIG.botToken,
            hasChatId: !!TELEGRAM_CONFIG.chatId
        });

        // CORRECCIÓN: Verificar conflictos con mejor manejo de timezone
        try {
            console.log('Checking for existing bookings...');
            
            // MEJORA: Usar el mismo formato de fecha que en get-events.js
            const startDate = new Date(`${date}T00:00:00`);
            const endDate = new Date(`${date}T23:59:59`);
            
            const timeZoneOffset = getTimezoneOffset(timeZone, startDate);
            const startDateTimeWithTZ = new Date(startDate.getTime() - timeZoneOffset).toISOString();
            const endDateTimeWithTZ = new Date(endDate.getTime() - timeZoneOffset).toISOString();

            const checkResponse = await calendar.events.list({
                calendarId: calendarId,
                timeMin: startDateTimeWithTZ,
                timeMax: endDateTimeWithTZ,
                timeZone: timeZone,
                singleEvents: true,
                orderBy: 'startTime',
            });

            const existingEvents = checkResponse.data.items || [];
            const existingSlots = [];

            existingEvents.forEach(event => {
                if (event.start && event.start.dateTime && event.status !== 'cancelled') {
                    // Convertir a zona horaria del estudio para comparación precisa
                    const eventStartTime = new Date(event.start.dateTime);
                    const studioStartTime = convertToStudioTime(eventStartTime, timeZone);
                    const hour = studioStartTime.getHours();
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

        // CORRECCIÓN: Formato correcto para Google Calendar API con timezone
        const startDateTime = `${date}T${String(startTime).padStart(2, '0')}:00:00`;
        const endDateTime = `${date}T${String(endTime).padStart(2, '0')}:00:00`;

        console.log('Computed times:');
        console.log('Start:', startDateTime);
        console.log('End:', endDateTime);
        console.log('TimeZone:', timeZone);

        // Generar ID único para la reserva
        const bookingId = `SB-${Date.now().toString(36).toUpperCase()}`;
        
        // Descripción detallada para el calendario con dirección del estudio
        const detailedDescription = `
🎵 RESERVA SPINBOOK - ESTUDIO DE GRABACIÓN 🎵

📋 DETALLES DE LA RESERVA:
────────────────────────────────────────────────────────────────────

👤 Cliente: ${userData.name}
📧 Email: ${userData.email}
📱 Teléfono: ${userData.phone}
📅 Fecha: ${new Date(date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
⏰ Horarios: ${sortedSlots.map(h => `${h}:00-${h+1}:00`).join(', ')}
📍 Ubicación: ${STUDIO_CONFIG.address}
🎯 ID Reserva: ${bookingId}

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
            colorId: '5', // Color amarillo para destacar las reservas de SpinBook
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'popup', minutes: 60 }, // Recordatorio 1 hora antes
                    { method: 'popup', minutes: 15 }  // Recordatorio 15 minutos antes
                ]
            },
            location: `${STUDIO_CONFIG.name} - ${STUDIO_CONFIG.address}`,
            status: 'confirmed'
        };

        console.log('Event object to be created:', JSON.stringify(event, null, 2));
        console.log('Creating calendar event...');

        const createdEvent = await calendar.events.insert({
            calendarId: calendarId,
            resource: event,
            sendNotifications: false,
        });

        console.log('Event created successfully with ID:', createdEvent.data.id);
        console.log('Event HTML link:', createdEvent.data.htmlLink);

        // ✅ NUEVA FUNCIONALIDAD: Enviar notificación a Telegram desde el backend
        console.log('Attempting to send Telegram notification...');
        const telegramResult = await sendTelegramNotification({
            userData: userData,
            date: date,
            slots: sortedSlots,
            eventId: createdEvent.data.id
        });

        if (telegramResult.success) {
            console.log('✅ Telegram notification sent successfully');
        } else {
            console.log('⚠️ Telegram notification failed:', telegramResult.reason || telegramResult.error);
            // No fallar la reserva si Telegram falla - es solo una notificación
        }

        return response.status(201).json({ 
            message: 'Reserva confirmada con éxito! Tu reserva ha sido registrada en el calendario.',
            event: {
                id: createdEvent.data.id,
                htmlLink: createdEvent.data.htmlLink,
                summary: createdEvent.data.summary,
                bookingId: bookingId,
                studioAddress: STUDIO_CONFIG.address,
                description: 'Reserva confirmada en Google Calendar con todos los detalles.',
                telegramNotification: telegramResult.success ? 'Enviada' : 'Falló (reserva confirmada igualmente)'
            }
        });

    } catch (error) {
        console.error('=== DETAILED ERROR LOG ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
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

        if (error.message?.includes('Bad Request') || error.code === 400) {
            return response.status(500).json({ 
                message: 'Error en el formato de datos. Por favor, inténtalo de nuevo.',
                debug: 'Request format error'
            });
        }

        return response.status(500).json({ 
            message: 'Error interno del servidor. Por favor, inténtalo de nuevo.',
            debug: error.message
        });
    }
}

// NUEVA FUNCIÓN: Obtener offset de timezone
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

// NUEVA FUNCIÓN: Convertir tiempo a zona horaria del estudio
function convertToStudioTime(date, timeZone) {
    try {
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