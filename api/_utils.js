// File: api/_utils.js
// This file contains helper functions for Google API authentication and configuration.

import { google } from 'googleapis';

/**
 * Creates an authenticated Google Calendar API client.
 * It uses service account credentials stored in Vercel environment variables.
 * @returns {object} An authenticated google.calendar('v3') object.
 */
export function getGoogleCalendar() {
    console.log('=== INITIALIZING GOOGLE CALENDAR CLIENT ===');
    
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;

    // Verificar que las variables existan
    if (!clientEmail) {
        console.error('MISSING: GOOGLE_CLIENT_EMAIL');
        throw new Error("GOOGLE_CLIENT_EMAIL is not configured");
    }

    if (!privateKey) {
        console.error('MISSING: GOOGLE_PRIVATE_KEY');
        throw new Error("GOOGLE_PRIVATE_KEY is not configured");
    }

    console.log('✓ Client email:', clientEmail);
    console.log('✓ Private key length:', privateKey.length);

    // Procesar la clave privada de forma más simple
    let processedPrivateKey = privateKey;
    
    // Solo reemplazar \\n si realmente están presentes
    if (privateKey.includes('\\n')) {
        processedPrivateKey = privateKey.replace(/\\n/g, '\n');
        console.log('✓ Private key newlines processed');
    }

    // Verificación básica del formato
    if (!processedPrivateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        console.error('INVALID: Private key format is incorrect');
        console.error('Key preview:', processedPrivateKey.substring(0, 50) + '...');
        throw new Error("Private key format is invalid");
    }

    try {
        console.log('Creating Google Auth...');
        
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: processedPrivateKey,
            },
            scopes: ['https://www.googleapis.com/auth/calendar'],
        });

        console.log('Creating Calendar client...');
        const calendar = google.calendar({ version: 'v3', auth });
        
        console.log('✅ Google Calendar client created successfully');
        return calendar;
        
    } catch (authError) {
        console.error('❌ Auth creation failed:', authError.message);
        console.error('Auth error details:', authError);
        throw new Error("Google Calendar authentication failed: " + authError.message);
    }
}

/**
 * Gets the Calendar ID from environment variables.
 * @returns {string} The Google Calendar ID.
 */
export function getCalendarId() {
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) {
        console.error('GOOGLE_CALENDAR_ID environment variable is not set');
        throw new Error("GOOGLE_CALENDAR_ID is not set in environment variables.");
    }
    
    console.log('Calendar ID found:', calendarId);
    return calendarId;
}

/**
 * Gets the Studio's Timezone from environment variables.
 * @returns {string} The IANA timezone string (e.g., 'America/Santiago').
 */
export function getStudioTimezone() {
    const timeZone = process.env.STUDIO_TIMEZONE;
    if (!timeZone) {
        console.error("FATAL: STUDIO_TIMEZONE environment variable is not set.");
        throw new Error("Studio timezone is not configured.");
    }
    
    // **FIX:** Validar que sea un timezone válido
    try {
        // Test si el timezone es válido intentando usarlo
        new Intl.DateTimeFormat('en-US', { timeZone: timeZone });
        console.log('Studio timezone validated:', timeZone);
        return timeZone;
    } catch (timezoneError) {
        console.error('Invalid timezone:', timeZone, timezoneError.message);
        throw new Error("Invalid studio timezone: " + timeZone);
    }
}