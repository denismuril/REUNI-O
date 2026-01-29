/**
 * Database Types - Clean definitions matching Prisma schema
 * These types replace the legacy Supabase-generated types
 */

// ============================================================
// Core Entity Types
// ============================================================

export interface Branch {
    id: string;
    name: string;
    location: string;
    timezone: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Room {
    id: string;
    name: string;
    capacity: number;
    branchId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Booking {
    id: string;
    title: string;
    description: string | null;
    startTime: Date;
    endTime: Date;
    roomId: string;
    userId: string | null;
    creatorName: string;
    creatorEmail: string;
    status: BookingStatus;
    isRecurring: boolean;
    recurrenceType: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface User {
    id: string;
    email: string;
    fullName: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CancellationToken {
    id: string;
    token: string;
    bookingId: string;
    expiresAt: Date;
    usedAt: Date | null;
    createdAt: Date;
}

// ============================================================
// Enums
// ============================================================

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

// ============================================================
// Extended Types (with relations)
// ============================================================

export interface BookingDetails extends Booking {
    room: Room & {
        branch: Branch;
    };
    user?: User | null;
}

export interface RoomWithBranch extends Room {
    branch: Branch;
}

// ============================================================
// Insert/Update Types
// ============================================================

export type BookingInsert = Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>;
export type BookingUpdate = Partial<BookingInsert>;

export type BranchInsert = Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>;
export type BranchUpdate = Partial<BranchInsert>;

export type RoomInsert = Omit<Room, 'id' | 'createdAt' | 'updatedAt'>;
export type RoomUpdate = Partial<RoomInsert>;
