// Today's date as YYYY-MM-DD in Italian time (event dates are stored in this format).
// toISOString() would give the UTC date, which is still "yesterday" just after midnight in Italy.
export function todayInRome(now: Date = new Date()): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Rome",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(now);
}

// An event is over only once its last day has passed. Older events may lack endDate.
export function isEventOver(event: { date: string; endDate?: string }, today: string): boolean {
    return (event.endDate || event.date) < today;
}
