/**
 * Supabase Database Types
 * 
 * Este arquivo pode ser gerado automaticamente usando:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
 * 
 * As definições abaixo correspondem ao schema criado no migration.
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    full_name: string;
                    email: string;
                    avatar_url: string | null;
                    role: 'user' | 'admin' | 'superadmin';
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    full_name: string;
                    email: string;
                    avatar_url?: string | null;
                    role?: 'user' | 'admin' | 'superadmin';
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    full_name?: string;
                    email?: string;
                    avatar_url?: string | null;
                    role?: 'user' | 'admin' | 'superadmin';
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            branches: {
                Row: {
                    id: string;
                    name: string;
                    location: string;
                    address: string | null;
                    timezone: string;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    location: string;
                    address?: string | null;
                    timezone?: string;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    location?: string;
                    address?: string | null;
                    timezone?: string;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            rooms: {
                Row: {
                    id: string;
                    branch_id: string;
                    name: string;
                    capacity: number;
                    equipment_list: string[];
                    description: string | null;
                    floor: string | null;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    branch_id: string;
                    name: string;
                    capacity?: number;
                    equipment_list?: string[];
                    description?: string | null;
                    floor?: string | null;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    branch_id?: string;
                    name?: string;
                    capacity?: number;
                    equipment_list?: string[];
                    description?: string | null;
                    floor?: string | null;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "rooms_branch_id_fkey";
                        columns: ["branch_id"];
                        referencedRelation: "branches";
                        referencedColumns: ["id"];
                    }
                ];
            };
            bookings: {
                Row: {
                    id: string;
                    room_id: string;
                    user_id: string;
                    title: string;
                    description: string | null;
                    start_time: string;
                    end_time: string;
                    is_recurring: boolean;
                    recurrence_type: 'daily' | 'weekly' | null;
                    parent_booking_id: string | null;
                    status: 'confirmed' | 'cancelled' | 'pending';
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    room_id: string;
                    user_id: string;
                    title: string;
                    description?: string | null;
                    start_time: string;
                    end_time: string;
                    is_recurring?: boolean;
                    recurrence_type?: 'daily' | 'weekly' | null;
                    parent_booking_id?: string | null;
                    status?: 'confirmed' | 'cancelled' | 'pending';
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    room_id?: string;
                    user_id?: string;
                    title?: string;
                    description?: string | null;
                    start_time?: string;
                    end_time?: string;
                    is_recurring?: boolean;
                    recurrence_type?: 'daily' | 'weekly' | null;
                    parent_booking_id?: string | null;
                    status?: 'confirmed' | 'cancelled' | 'pending';
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "bookings_room_id_fkey";
                        columns: ["room_id"];
                        referencedRelation: "rooms";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "bookings_user_id_fkey";
                        columns: ["user_id"];
                        referencedRelation: "profiles";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "bookings_parent_booking_id_fkey";
                        columns: ["parent_booking_id"];
                        referencedRelation: "bookings";
                        referencedColumns: ["id"];
                    }
                ];
            };
        };
        Views: {
            booking_details: {
                Row: {
                    id: string;
                    title: string;
                    description: string | null;
                    start_time: string;
                    end_time: string;
                    status: string;
                    is_recurring: boolean;
                    recurrence_type: string | null;
                    parent_booking_id: string | null;
                    created_at: string;
                    room_id: string;
                    room_name: string;
                    room_capacity: number;
                    room_equipment: string[];
                    branch_id: string;
                    branch_name: string;
                    branch_location: string;
                    branch_timezone: string;
                    user_id: string;
                    user_name: string;
                    user_email: string;
                };
            };
        };
        Functions: {
            check_availability: {
                Args: {
                    p_room_id: string;
                    p_start_time: string;
                    p_end_time: string;
                    p_exclude_booking_id?: string;
                };
                Returns: boolean;
            };
            expand_recurring_booking: {
                Args: {
                    p_room_id: string;
                    p_user_id: string;
                    p_title: string;
                    p_description: string;
                    p_start_time: string;
                    p_end_time: string;
                    p_recurrence_type: string;
                    p_months_ahead?: number;
                };
                Returns: Database['public']['Tables']['bookings']['Row'][];
            };
        };
        Enums: {};
        CompositeTypes: {};
    };
}

// Tipos auxiliares para facilitar o uso
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Branch = Database['public']['Tables']['branches']['Row'];
export type Room = Database['public']['Tables']['rooms']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];
export type BookingDetails = Database['public']['Views']['booking_details']['Row'];

// Tipos para inserção
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type BranchInsert = Database['public']['Tables']['branches']['Insert'];
export type RoomInsert = Database['public']['Tables']['rooms']['Insert'];
export type BookingInsert = Database['public']['Tables']['bookings']['Insert'];

// Tipos para atualização
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type BranchUpdate = Database['public']['Tables']['branches']['Update'];
export type RoomUpdate = Database['public']['Tables']['rooms']['Update'];
export type BookingUpdate = Database['public']['Tables']['bookings']['Update'];
