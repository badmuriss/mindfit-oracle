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

/**
 * Formats a UTC ISO string to 24-hour time format without timezone conversion
 * @param utcISOString 
 * @returns formatted time string in HH:MM format
 */
export function formatUTCTo24HourTime(utcISOString: string): string {
  const date = new Date(utcISOString);
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Updates the time portion of a UTC ISO string while preserving the date
 * @param originalUTCString Original UTC ISO string
 * @param newHour New hour (0-23)
 * @param newMinute New minute (0-59)
 * @returns New UTC ISO string with updated time
 */
export function updateUTCTime(originalUTCString: string, newHour: number, newMinute: number): string {
  const date = new Date(originalUTCString);
  date.setUTCHours(newHour, newMinute, 0, 0);
  return date.toISOString();
}

/**
 * Converts local time to UTC time (treating local time as if it were UTC)
 * @param localTimeString Local time ISO string
 * @returns UTC ISO string with local time treated as UTC
 */
export function localTimeAsUTC(localTimeString: string): string {
  const localDate = new Date(localTimeString);
  return createUTCISOString(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    localDate.getHours(),
    localDate.getMinutes(),
    localDate.getSeconds()
  );
}