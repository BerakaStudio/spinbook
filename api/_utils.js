// File: api/_utils.js
// This file contains helper functions for Google API authentication and configuration.

import { google } from 'googleapis';

/**
 * Creates an authenticated Google Calendar API client.
 * It uses service account credentials stored in Vercel environment variables.
 * @returns {object} An authenticated google.calendar('v3') object.
 */
export function getGoogleCalendar() {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
        throw new Error("Google API credentials are not set in environment variables.");
    }

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: clientEmail,
            private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });
    return calendar;
}

/**
 * Gets the Calendar ID from environment variables.
 * @returns {string} The Google Calendar ID.
 */
export function getCalendarId() {
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) {
        throw new Error("GOOGLE_CALENDAR_ID is not set in environment variables.");
    }
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
    return timeZone;
}
