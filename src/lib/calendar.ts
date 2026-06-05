/**
 * Google Calendar integration — HR admin calendar only
 */
import { google } from "googleapis";

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID!;

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
}

export async function getCalendarClient() {
  const auth = getAuth();
  return google.calendar({ version: "v3", auth });
}

export async function fetchEvents(
  timeMin: string,
  timeMax: string
) {
  const calendar = await getCalendarClient();
  const res = await calendar.events.list({
    calendarId: CALENDAR_ID,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  });
  return res.data.items || [];
}

export async function createEvent(event: {
  title: string;
  description?: string;
  start: string;
  end: string;
}) {
  const calendar = await getCalendarClient();
  const res = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: {
      summary: event.title,
      description: event.description,
      start: { dateTime: event.start, timeZone: "Asia/Kolkata" },
      end: { dateTime: event.end, timeZone: "Asia/Kolkata" },
    },
  });
  return res.data;
}

export async function updateEvent(
  googleEventId: string,
  patch: Partial<{ title: string; description: string; start: string; end: string }>
) {
  const calendar = await getCalendarClient();
  const res = await calendar.events.patch({
    calendarId: CALENDAR_ID,
    eventId: googleEventId,
    requestBody: {
      ...(patch.title && { summary: patch.title }),
      ...(patch.description !== undefined && { description: patch.description }),
      ...(patch.start && { start: { dateTime: patch.start, timeZone: "Asia/Kolkata" } }),
      ...(patch.end && { end: { dateTime: patch.end, timeZone: "Asia/Kolkata" } }),
    },
  });
  return res.data;
}

export async function deleteEvent(googleEventId: string) {
  const calendar = await getCalendarClient();
  await calendar.events.delete({
    calendarId: CALENDAR_ID,
    eventId: googleEventId,
  });
}
