/**
 * Converts "HH:mm" 24-hour time string into total minutes from midnight.
 * e.g. "08:30" -> 510
 */
export const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [hours, minutes] = timeStr.split(':').map((v) => parseInt(v, 10));
  return hours * 60 + minutes;
};

/**
 * Checks if two time intervals [start1, end1] and [start2, end2] overlap.
 * Returns true if they overlap.
 */
export const isTimeOverlap = (start1, end1, start2, end2) => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  return Math.max(s1, s2) < Math.min(e1, e2);
};

/**
 * Combines a Date object and "HH:mm" time string into a full Date timestamp.
 */
export const combineDateAndTime = (date, timeStr) => {
  const d = new Date(date);
  const [hours, minutes] = (timeStr || '00:00').split(':').map((v) => parseInt(v, 10));
  d.setHours(hours, minutes, 0, 0);
  return d;
};

/**
 * Checks if the session has already started relative to current time.
 */
export const isSessionStarted = (date, startTime) => {
  const sessionStart = combineDateAndTime(date, startTime);
  return new Date() >= sessionStart;
};

/**
 * Checks if current time is at least `hours` before the session start time.
 * For Business Rule 6: patient can cancel up to 2 hours before session start.
 */
export const canCancelBooking = (date, startTime, requiredHoursBefore = 2) => {
  const sessionStart = combineDateAndTime(date, startTime);
  const cutoffTime = new Date(sessionStart.getTime() - requiredHoursBefore * 60 * 60 * 1000);
  return new Date() <= cutoffTime;
};

export default {
  timeToMinutes,
  isTimeOverlap,
  combineDateAndTime,
  isSessionStarted,
  canCancelBooking,
};
