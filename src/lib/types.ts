import type { Timestamp } from "firebase/firestore";

// Shape of documents in the "events" collection (written by the admin dashboard).
export interface SiteEvent {
    id: string;
    title: string;
    location: string;
    address?: string;
    date: string;
    endDate?: string;
    time: string;
    country?: string;
    imageUrl?: string;
    eventLink?: string;
    phone?: string;
    email?: string;
    createdAt?: string;
}

// Shape of documents in the "invitations" collection (written by /api/invitation).
export interface Invitation {
    id: string;
    name: string;
    email: string;
    church: string;
    startDate: string;
    endDate: string;
    location: string;
    timestamp?: Timestamp;
}
