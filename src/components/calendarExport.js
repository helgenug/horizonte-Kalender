// Google Calendar link
export function googleCalendarUrl(event) {
  const dateStr = event.date.replace(/-/g, '')
  const [h, m] = event.time.split(':')
  const startDt = `${dateStr}T${h}${m}00`
  const endH = String(parseInt(h) + 1).padStart(2, '0')
  const endDt = `${dateStr}T${endH}${m}00`
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startDt}/${endDt}`,
    details: event.location ? `Ort: ${event.location}` : '',
    location: event.location || '',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

// Outlook Web link
export function outlookCalendarUrl(event) {
  const dateStr = event.date
  const [h, m] = event.time.split(':')
  const startDt = `${dateStr}T${h}:${m}:00`
  const endH = String(parseInt(h) + 1).padStart(2, '0')
  const endDt = `${dateStr}T${endH}:${m}:00`
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: startDt,
    enddt: endDt,
    body: event.location ? `Ort: ${event.location}` : '',
    location: event.location || '',
  })
  return `https://outlook.live.com/calendar/0/action/compose?${params.toString()}`
}

// ICS download for single event
export function downloadIcs(event) {
  const dateStr = event.date.replace(/-/g, '')
  const [h, m] = event.time.split(':')
  const startDt = `${dateStr}T${h}${m}00`
  const endH = String(parseInt(h) + 1).padStart(2, '0')
  const endDt = `${dateStr}T${endH}${m}00`

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'PRODID:-//Horizonte Zingst 2026//DE',
    'BEGIN:VEVENT',
    `DTSTART:${startDt}`,
    `DTEND:${endDt}`,
    `SUMMARY:${event.title}`,
    event.location ? `LOCATION:${event.location}` : '',
    `DESCRIPTION:${event.cat}${event.location ? ' · ' + event.location : ''}`,
    `UID:${event.id || Date.now()}@horizonte-zingst`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${event.title.slice(0, 40).replace(/[^a-zA-Z0-9äöüÄÖÜ\s-]/g, '').trim().replace(/\s+/g, '-')}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
