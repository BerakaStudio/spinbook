// File: api/_utils.js
// This file contains helper functions for Google API authentication and configuration.
// © José Lobos Sanhueza, Beraka Studio, 2025

import { google } from 'googleapis';

/**
 * Creates an authenticated Google Calendar API client.
 * It uses service account credentials stored in Vercel environment variables.
 * @returns {object} An authenticated google.calendar('v3') object.
 */
export function getGoogleCalendar() {
    console.log('=== INITIALIZING GOOGLE CALENDAR CLIENT v2.1 ===');
    
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;

    // Verificar que las variables existan
    if (!clientEmail) {
        console.error('❌ MISSING: GOOGLE_CLIENT_EMAIL environment variable');
        throw new Error("GOOGLE_CLIENT_EMAIL is not configured. Please check your environment variables.");
    }

    if (!privateKey) {
        console.error('❌ MISSING: GOOGLE_PRIVATE_KEY environment variable');
        throw new Error("GOOGLE_PRIVATE_KEY is not configured. Please check your environment variables.");
    }

    console.log('✓ Client email found:', clientEmail);
    console.log('✓ Private key length:', privateKey.length, 'characters');

    // Procesamiento más robusto de la clave privada
    let processedPrivateKey = privateKey;
    
    // Manejar diferentes formatos de entrada de la clave privada
    if (privateKey.includes('\\n')) {
        processedPrivateKey = privateKey.replace(/\\n/g, '\n');
        console.log('✓ Private key newlines processed (\\n → \n)');
    }

    // Verificación mejorada del formato de la clave
    const keyStart = '-----BEGIN PRIVATE KEY-----';
    const keyEnd = '-----END PRIVATE KEY-----';
    
    if (!processedPrivateKey.includes(keyStart)) {
        console.error('❌ INVALID: Private key missing start marker');
        console.error('Key preview:', processedPrivateKey.substring(0, 100) + '...');
        throw new Error("Private key format is invalid - missing BEGIN marker");
    }

    if (!processedPrivateKey.includes(keyEnd)) {
        console.error('❌ INVALID: Private key missing end marker');
        throw new Error("Private key format is invalid - missing END marker");
    }

    // Validación del formato del email de la cuenta de servicio
    const serviceAccountEmailPattern = /^[a-zA-Z0-9-_]+@[a-zA-Z0-9-_]+\.iam\.gserviceaccount\.com$/;
    if (!serviceAccountEmailPattern.test(clientEmail)) {
        console.warn('⚠️  WARNING: Client email format doesn\'t match expected service account pattern');
        console.warn('Expected format: service-name@project-id.iam.gserviceaccount.com');
        console.warn('Received:', clientEmail);
    }

    try {
        console.log('🔧 Creating Google Auth instance...');
        
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

        console.log('📅 Creating Calendar client...');
        const calendar = google.calendar({ version: 'v3', auth });
        
        console.log('✅ Google Calendar client created successfully');
        console.log('📊 Available scopes: calendar, calendar.events');
        
        return calendar;
        
    } catch (authError) {
        console.error('❌ Authentication failed:', authError.message);
        console.error('🛠 Error details:', {
            name: authError.name,
            message: authError.message,
            stack: authError.stack?.substring(0, 500) + '...'
        });
        
        // Proporcionar mensajes de error más específicos
        if (authError.message.includes('invalid_grant')) {
            throw new Error("Google Calendar authentication failed: Invalid service account credentials. Please verify your GOOGLE_PRIVATE_KEY and GOOGLE_CLIENT_EMAIL.");
        } else if (authError.message.includes('access_denied')) {
            throw new Error("Google Calendar authentication failed: Access denied. Please ensure the service account has proper permissions.");
        } else {
            throw new Error("Google Calendar authentication failed: " + authError.message);
        }
    }
}

/**
 * Gets the Calendar ID from environment variables with validation.
 * @returns {string} The Google Calendar ID.
 */
export function getCalendarId() {
    console.log('📋 Retrieving Calendar ID...');
    
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    
    if (!calendarId) {
        console.error('❌ GOOGLE_CALENDAR_ID environment variable is not set');
        throw new Error("GOOGLE_CALENDAR_ID is not set in environment variables. Please configure it in your deployment settings.");
    }
    
    // Validación del formato del Calendar ID
    if (calendarId.includes('@group.calendar.google.com')) {
        console.log('✓ Calendar ID format validated (group calendar)');
    } else if (calendarId.includes('@gmail.com')) {
        console.log('✓ Calendar ID format validated (personal Gmail calendar)');
    } else if (calendarId === 'primary') {
        console.log('✓ Calendar ID set to primary calendar');
    } else {
        console.warn('⚠️  WARNING: Calendar ID format may be incorrect');
        console.warn('Expected formats:');
        console.warn('  - xxxxx@group.calendar.google.com (shared calendar)');
        console.warn('  - xxxxx@gmail.com (personal calendar)');
        console.warn('  - primary (service account primary calendar)');
        console.warn('Received:', calendarId);
    }
    
    console.log('📅 Calendar ID found:', calendarId);
    return calendarId;
}

/**
 * Gets the Studio's Timezone from environment variables with validation.
 * @returns {string} The IANA timezone string (e.g., 'America/Santiago').
 */
export function getStudioTimezone() {
    console.log('🌍 Retrieving Studio Timezone...');
    
    const timeZone = process.env.STUDIO_TIMEZONE;
    
    if (!timeZone) {
        console.error('❌ STUDIO_TIMEZONE environment variable is not set');
        throw new Error("Studio timezone is not configured. Please set STUDIO_TIMEZONE environment variable.");
    }
    
    // Validación más robusta del timezone
    try {
        // Test si el timezone es válido intentando usarlo
        const testDate = new Date();
        const testFormatter = new Intl.DateTimeFormat('en-US', { 
            timeZone: timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const formattedTest = testFormatter.format(testDate);
        console.log('✓ Timezone validation passed:', timeZone);
        console.log('🕐 Current time in studio timezone:', formattedTest);
        
        return timeZone;
        
    } catch (timezoneError) {
        console.error('❌ Invalid timezone:', timeZone);
        console.error('🛠 Timezone error:', timezoneError.message);
        console.error('💡 Common timezone examples:');
        console.error('  - America/New_York (US Eastern)');
        console.error('  - America/Los_Angeles (US Pacific)');
        console.error('  - America/Chicago (US Central)');
        console.error('  - America/Santiago (Chile)');
        console.error('  - Europe/Madrid (Spain)');
        console.error('  - Europe/London (UK)');
        
        throw new Error(`Invalid studio timezone: ${timeZone}. Please use a valid IANA timezone identifier.`);
    }
}

/**
 * Función para validar la configuración completa con test de calendar
 * Verifica que todas las variables de entorno estén configuradas correctamente.
 * @returns {object} Configuración validada
 */
export async function validateConfiguration() {
    console.log('🔧 VALIDATING COMPLETE SPINBOOK CONFIGURATION...');
    
    try {
        const calendar = getGoogleCalendar();
        const calendarId = getCalendarId();
        const timeZone = getStudioTimezone();
        
        // Test de acceso real al calendario
        console.log('🔍 Testing calendar access...');
        try {
            const testResponse = await calendar.calendars.get({
                calendarId: calendarId
            });
            
            const calendarInfo = {
                summary: testResponse.data.summary,
                timeZone: testResponse.data.timeZone,
                accessRole: testResponse.data.accessRole || 'unknown'
            };
            
            console.log('✅ Calendar access test successful:', calendarInfo);
            
            const config = {
                calendar,
                calendarId,
                timeZone,
                calendarAccess: calendarInfo,
                isValid: true,
                timestamp: new Date().toISOString()
            };
            
            console.log('✅ All configuration validated successfully!');
            console.log('📊 Configuration summary:', {
                calendarId: config.calendarId,
                timeZone: config.timeZone,
                calendarSummary: config.calendarAccess.summary,
                validatedAt: config.timestamp
            });
            
            return config;
            
        } catch (calendarTestError) {
            console.error('❌ Calendar access test failed:', calendarTestError.message);
            throw new Error(`Calendar access test failed: ${calendarTestError.message}. Please verify calendar permissions and ID.`);
        }
        
    } catch (error) {
        console.error('❌ Configuration validation failed:', error.message);
        throw new Error(`SpinBook configuration error: ${error.message}`);
    }
}

/**
 * Función para obtener información del entorno
 * Útil para debugging y logs del sistema.
 * @returns {object} Información del entorno (sin datos sensibles)
 */
export function getEnvironmentInfo() {
    const info = {
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'development',
        hasCalendarId: !!process.env.GOOGLE_CALENDAR_ID,
        hasClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
        hasTimezone: !!process.env.STUDIO_TIMEZONE,
        // NUEVO: Variables adicionales del estudio
        hasStudioName: !!process.env.STUDIO_NAME,
        hasStudioAddress: !!process.env.STUDIO_ADDRESS,
        hasStudioEmail: !!process.env.STUDIO_EMAIL,
        hasStudioPhone: !!process.env.STUDIO_PHONE,
        timestamp: new Date().toISOString()
    };
    
    console.log('📊 Environment Info:', info);
    return info;
}

/**
 * Función helper para formatear fechas para Google Calendar API
 * Asegura el formato correcto con timezone
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @param {number} hour - Hora (0-23)
 * @param {string} timeZone - IANA timezone
 * @returns {string} Fecha formateada para Google Calendar API
 */
export function formatDateTimeForCalendar(dateString, hour, timeZone) {
    try {
        // Crear fecha base
        const baseDateTime = `${dateString}T${String(hour).padStart(2, '0')}:00:00`;
        
        // Crear objeto Date para la zona horaria especificada
        const date = new Date(baseDateTime);
        
        // Verificar si la fecha es válida
        if (isNaN(date.getTime())) {
            throw new Error(`Invalid date: ${baseDateTime}`);
        }
        
        return baseDateTime;
        
    } catch (error) {
        console.error('Error formatting date for calendar:', error.message);
        throw new Error(`Date formatting failed: ${error.message}`);
    }
}

/**
 * Función helper para convertir timestamp a zona horaria del estudio
 * @param {Date} date - Fecha a convertir
 * @param {string} timeZone - IANA timezone
 * @returns {Date} Fecha convertida a la zona horaria del estudio
 */
export function convertToStudioTimezone(date, timeZone) {
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
        console.warn('Studio timezone conversion failed, using original date:', error.message);
        return date;
    }
}