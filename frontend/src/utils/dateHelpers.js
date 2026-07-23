// Backend sends naive UTC timestamps without a timezone marker (e.g. "2026-07-21T13:00:00").
// JavaScript's `new Date(...)` treats timezone-less strings as LOCAL time, which is wrong here.
// Appending 'Z' forces correct interpretation as UTC, so conversion to the browser's
// local timezone happens correctly.
export function toLocalTime(utcString) {
  if (!utcString) return null;
  const isoWithZ = utcString.endsWith('Z') ? utcString : `${utcString}Z`;
  return new Date(isoWithZ);
}

export function formatDateTime(utcString) {
  const date = toLocalTime(utcString);
  return date ? date.toLocaleString() : '-';
}