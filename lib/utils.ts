
// lib/utils.ts
import { v4 as uuidv4 } from 'uuid';

/**
 * Combines multiple class names into a single string.
 * Filters out falsy values (null, undefined, false).
 * Note: For a production app, consider using 'clsx' and 'tailwind-merge' libraries
 * to handle class conflicts automatically.
 */
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

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
 * A robust client-side JWT decoder that handles UTF-8 characters and padding correctly.
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

        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        // Add padding if missing, which is a common issue.
        while (base64.length % 4) {
            base64 += '=';
        }

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
 */
export const generateICSFile = (title: string, description: string, eventDate: Date, filename: string): void => {
    const formatDateForICS = (date: Date): string => {
        return date.toISOString().split('T')[0].replace(/-/g, '');
    };

    const startDate = formatDateForICS(eventDate);
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
        'END:CALENDAR'
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

export const validateEmail = (email: string): boolean => {
  if (!email) return false;
  const re = new RegExp(
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
  return re.test(String(email).toLowerCase());
};
