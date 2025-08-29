// UTC Date utilities to avoid timezone issues

/**
 * Creates a UTC ISO string for the given date, ignoring local timezone
 * @param date Date object
 * @returns ISO string in UTC
 */
export function toUTCISOString(date: Date): string {
  const utcDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  return utcDate.toISOString();
}

/**
 * Creates a UTC ISO string for a specific date and time, ignoring timezone
 * @param year 
 * @param month (0-11)
 * @param day 
 * @param hour 
 * @param minute 
 * @param second 
 * @returns ISO string in UTC
 */
export function createUTCISOString(year: number, month: number, day: number, hour = 0, minute = 0, second = 0): string {
  return new Date(Date.UTC(year, month, day, hour, minute, second)).toISOString();
}

/**
 * Creates a UTC ISO string from local date and time values
 * @param dateBase Base date to get year/month/day from
 * @param hour Hour in local time
 * @param minute Minute in local time
 * @returns ISO string in UTC representing the local time as if it were UTC
 */
export function createLocalTimeAsUTC(dateBase: Date, hour: number, minute: number): string {
  return createUTCISOString(
    dateBase.getFullYear(),
    dateBase.getMonth(),
    dateBase.getDate(),
    hour,
    minute,
    0
  );
}

/**
 * Gets current UTC ISO string
 */
export function nowUTC(): string {
  return new Date().toISOString();
}

/**
 * Formats a UTC ISO string to local time string for display
 * @param utcISOString 
 * @returns formatted local time string
 */
export function formatUTCToLocalTime(utcISOString: string): string {
  return new Date(utcISOString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Formats a UTC ISO string to local date time string for display
 * @param utcISOString 
 * @returns formatted local date time string
 */
export function formatUTCToLocalDateTime(utcISOString: string): string {
  return new Date(utcISOString).toLocaleString();
}