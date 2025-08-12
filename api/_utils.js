// File: api/_utils.js
// This file contains helper functions for Google API authentication and configuration.

import { google } from 'googleapis';

/**
 * Creates an authenticated Google Calendar API client.
 * It uses service account credentials stored in Vercel environment variables.
 * @returns {object} An authenticated google.calendar('v3') object.
 */
export function getGoogleCalendar() {
    console.log('Initializing Google Calendar client...');
    
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;

    // Validación más detallada de credenciales
    if (!clientEmail) {
        console.error('GOOGLE_CLIENT_EMAIL environment variable is not set');
        throw new Error("GOOGLE_CLIENT_EMAIL is not set in environment variables.");
    }

    if (!privateKey) {
        console.error('GOOGLE_PRIVATE_KEY environment variable is not set');
        throw new Error("GOOGLE_PRIVATE_KEY is not set in environment variables.");
    }

    console.log('Client email found:', clientEmail);
    console.log('Private key found:', privateKey ? 'Yes (length: ' + privateKey.length + ')' : 'No');

    // **FIX:** Manejo más robusto de la clave privada
    let processedPrivateKey;
    try {
        // La clave puede venir con \n escapados o sin procesar
        processedPrivateKey = privateKey.replace(/\\n/g, '\n');
        
        // Verificar que la clave tenga el formato correcto
        if (!processedPrivateKey.includes('-----BEGIN PRIVATE KEY-----')) {
            throw new Error('Private key does not have the correct format');
        }
        
        console.log('Private key processed successfully');
    } catch (keyError) {
        console.error('Error processing private key:', keyError.message);
        throw new Error("Invalid private key format. Please check GOOGLE_PRIVATE_KEY environment variable.");
    }

    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: processedPrivateKey,
            },
            scopes: ['https://www.googleapis.com/auth/calendar'],
        });

        const calendar = google.calendar({ version: 'v3', auth });
        console.log('Google Calendar client initialized successfully');
        return calendar;
        
    } catch (authError) {
        console.error('Error creating Google Auth:', authError.message);
        throw new Error("Failed to initialize Google Calendar client: " + authError.message);
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