// lib/utils.ts

import { v4 as uuidv4 } from 'uuid';

export const formatCurrency = (cents: number): string => {
    if (typeof cents !== 'number') {
        console.warn('formatCurrency received a non-number value:', cents);
        return '€0.00';
    }
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
    }).format(cents / 100);
};

/**
 * A robust client-side JWT decoder that handles UTF-8 characters correctly.
 * @param token The JWT token string.
 * @returns The decoded payload object, or null if decoding fails.
 */
export const jwtDecode = <T,>(token: string): T | null => {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) {
            console.error("Invalid JWT: Missing payload.");
            return null;
        }

        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Failed to decode JWT:", e);
        return null;
    }
};

/**
 * Generates and downloads an .ics file for calendar events.
 * @param title The title of the event.
 * @param description A brief description of the event.
 * @param eventDate The date of the event.
 * @param filename The desired name for the downloaded file.
 */
export const generateICSFile = (title: string, description: string, eventDate: Date, filename: string): void => {
    // Helper to format date into YYYYMMDD for all-day events
    const formatDateForICS = (date: Date): string => {
        return date.toISOString().split('T')[0].replace(/-/g, '');
    };

    const startDate = formatDateForICS(eventDate);
    // For all-day events, DTEND is typically the day after DTSTART
    const endDate = formatDateForICS(new Date(eventDate.getTime() + 24 * 60 * 60 * 1000));
    const now = new Date().toISOString().replace(/-/g, '').replace(/:/g, '').substring(0, 15) + 'Z';

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//DevFreelancer//SaaS App//EN',
        'BEGIN:VEVENT',
        `UID:${uuidv4()}@devfreelancer.app`,
        `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${startDate}`,
        `DTEND;VALUE=DATE:${endDate}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${description}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `${filename}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};