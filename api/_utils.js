// File: api/_utils.js
// This file contains helper functions for Google API authentication.

import { google } from 'googleapis';

/**
 * Creates an authenticated Google Calendar API client.
 * It uses service account credentials stored in Vercel environment variables.
 * @returns {object} An authenticated google.calendar('v3') object.
 */
export function getGoogleCalendar() {
    // These environment variables must be set in your Vercel project settings.
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'); // Vercel can escape newlines

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
