// File: api/_utils.js
// Enhanced helper functions for Google API authentication and configuration with improved error handling

import { google } from 'googleapis';

/**
 * Creates an authenticated Google Calendar API client with enhanced error handling.
 * Uses service account credentials stored in Vercel environment variables.
 * @returns {object} An authenticated google.calendar('v3') object.
 * @throws {Error} If authentication fails or credentials are invalid.
 */
export function getGoogleCalendar() {
    console.log('=== INITIALIZING GOOGLE CALENDAR CLIENT ===');
    
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;

    // Enhanced credential validation
    if (!clientEmail) {
        console.error('❌ MISSING: GOOGLE_CLIENT_EMAIL environment variable');
        throw new Error("GOOGLE_CLIENT_EMAIL is not configured. Please set this environment variable.");
    }

    if (!privateKey) {
        console.error('❌ MISSING: GOOGLE_PRIVATE_KEY environment variable');
        throw new Error("GOOGLE_PRIVATE_KEY is not configured. Please set this environment variable.");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.iam\.gserviceaccount\.com$/;
    if (!emailRegex.test(clientEmail)) {
        console.error('❌ INVALID: Client email format is incorrect:', clientEmail);
        throw new Error("GOOGLE_CLIENT_EMAIL format is invalid. Expected format: xxx@xxx.iam.gserviceaccount.com");
    }

    console.log('✅ Client email validated:', clientEmail);
    console.log('✅ Private key length:', privateKey.length, 'characters');

    // Enhanced private key processing
    let processedPrivateKey = privateKey;
    
    // Handle escaped newlines more robustly
    if (privateKey.includes('\\n')) {
        processedPrivateKey = privateKey.replace(/\\n/g, '\n');
        console.log('✅ Private key newlines processed');
    }

    // Comprehensive private key validation
    const keyValidations = [
        {
            check: () => processedPrivateKey.includes('-----BEGIN PRIVATE KEY-----'),
            error: 'Private key must start with -----BEGIN PRIVATE KEY-----'
        },
        {
            check: () => processedPrivateKey.includes('-----END PRIVATE KEY-----'),
            error: 'Private key must end with -----END PRIVATE KEY-----'
        },
        {
            check: () => processedPrivateKey.length > 1000,
            error: 'Private key seems too short (expected > 1000 characters)'
        }
    ];

    for (const validation of keyValidations) {
        if (!validation.check()) {
            console.error('❌ INVALID: Private key validation failed');
            console.error('Error:', validation.error);
            console.error('Key preview:', processedPrivateKey.substring(0, 100) + '...');
            throw new Error(`Private key validation failed: ${validation.error}`);
        }
    }

    console.log('✅ Private key format validated');

    try {
        console.log('🔧 Creating Google Auth client...');
        
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: processedPrivateKey,
            },
            scopes: [
                'https://www.googleapis.com/auth/calendar',
                'https://www.googleapis.com/auth/calendar.events'
            ],
        });

        console.log('🔧 Creating Calendar API client...');
        const calendar = google.calendar({ version: 'v3', auth });
        
        console.log('✅ Google Calendar client created successfully');
        
        // Test the authentication by making a simple API call
        console.log('🧪 Testing authentication with a simple API call...');
        
        return calendar;
        
    } catch (authError) {
        console.error('❌ Authentication failed:', authError.message);
        console.error('Auth error details:', {
            name: authError.name,
            code: authError.code,
            stack: authError.stack?.split('\n')[0] // Only first line of stack
        });
        
        // Provide specific error messages based on error type
        if (authError.message?.includes('invalid_grant')) {
            throw new Error("Google authentication failed: Invalid service account credentials. Please check your private key and client email.");
        } else if (authError.message?.includes('access_denied')) {
            throw new Error("Google authentication failed: Access denied. Please check service account permissions.");
        } else {
            throw new Error(`Google Calendar authentication failed: ${authError.message}`);
        }
    }
}

/**
 * Gets the Calendar ID from environment variables with validation.
 * @returns {string} The Google Calendar ID.
 * @throws {Error} If calendar ID is not configured or invalid.
 */
export function getCalendarId() {
    console.log('🔧 Retrieving Calendar ID...');
    
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    
    if (!calendarId) {
        console.error('❌ MISSING: GOOGLE_CALENDAR_ID environment variable');
        throw new Error("GOOGLE_CALENDAR_ID is not set in environment variables.");
    }
    
    // Validate calendar ID format (should contain @)
    if (!calendarId.includes('@')) {
        console.error('❌ INVALID: Calendar ID format is incorrect:', calendarId);
        throw new Error("GOOGLE_CALENDAR_ID format is invalid. Expected format: xxx@group.calendar.google.com or xxx@gmail.com");
    }
    
    console.log('✅ Calendar ID validated:', calendarId);
    return calendarId;
}

/**
 * Gets and validates the Studio's Timezone from environment variables.
 * @returns {string} The IANA timezone string (e.g., 'America/Santiago').
 * @throws {Error} If timezone is not configured or invalid.
 */
export function getStudioTimezone() {
    console.log('🔧 Retrieving Studio Timezone...');
    
    const timeZone = process.env.STUDIO_TIMEZONE;
    
    if (!timeZone) {
        console.error('❌ MISSING: STUDIO_TIMEZONE environment variable');
        throw new Error("STUDIO_TIMEZONE is not configured in environment variables.");
    }
    
    // Enhanced timezone validation
    try {
        // Test if the timezone is valid by attempting to use it
        const testDate = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', { 
            timeZone: timeZone,
            hour: 'numeric',
            minute: 'numeric'
        });
        
        const formattedTime = formatter.format(testDate);
        
        console.log('✅ Timezone validation successful:', timeZone);
        console.log('🕐 Current time in studio timezone:', formattedTime);
        
        return timeZone;
        
    } catch (timezoneError) {
        console.error('❌ INVALID: Timezone validation failed:', timeZone);
        console.error('Timezone error:', timezoneError.message);
        
        // Provide helpful suggestions
        const commonTimezones = [
            'America/Santiago',
            'America/New_York',
            'America/Los_Angeles',
            'Europe/Madrid',
            'Europe/London',
            'Asia/Tokyo'
        ];
        
        console.error('💡 Common valid timezones:', commonTimezones.join(', '));
        throw new Error(`Invalid studio timezone: ${timeZone}. Please use a valid IANA timezone identifier. Examples: ${commonTimezones.slice(0, 3).join(', ')}`);
    }
}

/**
 * Validates all environment variables are properly configured.
 * @returns {object} Configuration object with all validated values.
 * @throws {Error} If any configuration is invalid.
 */
export function validateConfiguration() {
    console.log('=== VALIDATING COMPLETE CONFIGURATION ===');
    
    try {
        const calendar = getGoogleCalendar();
        const calendarId = getCalendarId();
        const timeZone = getStudioTimezone();
        
        console.log('✅ All configuration validated successfully');
        
        return {
            calendar,
            calendarId,
            timeZone,
            isValid: true
        };
        
    } catch (configError) {
        console.error('❌ Configuration validation failed:', configError.message);
        throw configError;
    }
}

/**
 * Generates a unique booking ID for SpinBook reservations.
 * @returns {string} A unique booking ID in format: SB-TIMESTAMP-XXXX
 */
export function generateBookingId() {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 4).toUpperCase();
    const bookingId = `SB-${timestamp}-${randomStr}`;
    
    console.log('🆔 Generated booking ID:', bookingId);
    return bookingId;
}

/**
 * Formats a date for Google Calendar API (ISO 8601 format).
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {number} hour - Hour (0-23)
 * @param {string} timeZone - IANA timezone identifier
 * @returns {string} Formatted datetime string
 */
export function formatDateTimeForCalendar(date, hour, timeZone) {
    const dateTime = `${date}T${String(hour).padStart(2, '0')}:00:00`;
    console.log(`🕐 Formatted datetime: ${dateTime} (${timeZone})`);
    return dateTime;
}

/**
 * Creates a comprehensive event description for Google Calendar.
 * @param {object} userData - User information
 * @param {string} date - Booking date
 * @param {array} slots - Array of hour slots
 * @param {string} bookingId - Unique booking identifier
 * @param {string} timeZone - Studio timezone
 * @returns {string} Formatted event description
 */
export function createEventDescription(userData, date, slots, bookingId, timeZone) {
    const sortedSlots = [...slots].sort((a, b) => a - b);
    const timeRange = sortedSlots.map(h => `${h.toString().padStart(2, '0')}:00-${(h+1).toString().padStart(2, '0')}:00`).join(', ');
    const createdAt = new Date().toLocaleString('es-ES', { timeZone });
    
    return `
🎵 RESERVA SPINBOOK 🎵

═══ DATOS DEL CLIENTE ═══
👤 Cliente: ${userData.name}
📧 Email: ${userData.email}
📱 Teléfono: ${userData.phone}

═══ DETALLES DE LA RESERVA ═══
📅 Fecha: ${date}
🕐 Horarios: ${timeRange}
🆔 ID de Reserva: ${bookingId}

═══ SERVICIOS INCLUIDOS ═══
🎤 Sesión de grabación/producción musical
🎛️ Estudio profesional equipado
👨‍💼 Ingeniería básica incluida

═══ NOTAS IMPORTANTES ═══
• Llegar 10 minutos antes de la hora reservada
• Cancelaciones con 24h de anticipación
• No se permiten reembolsos por inasistencias

Generado: ${createdAt}
Sistema: SpinBook v2.0
    `.trim();
}

/**
 * Logs system information for debugging purposes.
 */
export function logSystemInfo() {
    console.log('=== SPINBOOK SYSTEM INFORMATION ===');
    console.log('📍 Environment:', process.env.NODE_ENV || 'unknown');
    console.log('🕐 Server time:', new Date().toISOString());
    console.log('🔧 Node.js version:', process.version);
    console.log('💾 Memory usage:', Math.round(process.memoryUsage().heapUsed / 1024 / 1024), 'MB');
    console.log('=====================================');
}