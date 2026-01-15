
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_deletion_logs: {
        Row: {
          booking_end_time: string
          booking_id: string
          booking_start_time: string
          booking_title: string
          creator_email: string | null
          creator_name: string | null
          deleted_at: string | null
          deleted_by: string
          deletion_reason: string | null
          id: string
          room_name: string
        }
        Insert: {
          booking_end_time: string
          booking_id: string
          booking_start_time: string
          booking_title: string
          creator_email?: string | null
          creator_name?: string | null
          deleted_at?: string | null
          deleted_by: string
          deletion_reason?: string | null
          id?: string
          room_name: string
        }
        Update: {
          booking_end_time?: string
          booking_id?: string
          booking_start_time?: string
          booking_title?: string
          creator_email?: string | null
          creator_name?: string | null
          deleted_at?: string | null
          deleted_by?: string
          deletion_reason?: string | null
          id?: string
          room_name?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          created_at: string
          creator_email: string | null
          creator_name: string | null
          description: string | null
          end_time: string
          id: string
          is_recurring: boolean
          parent_booking_id: string | null
          recurrence_type: string | null
          room_id: string
          start_time: string
          status: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          creator_email?: string | null
          creator_name?: string | null
          description?: string | null
          end_time: string
          id?: string
          is_recurring?: boolean
          parent_booking_id?: string | null
          recurrence_type?: string | null
          room_id: string
          start_time: string
          status?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          creator_email?: string | null
          creator_name?: string | null
          description?: string | null
          end_time?: string
          id?: string
          is_recurring?: boolean
          parent_booking_id?: string | null
          recurrence_type?: string | null
          room_id?: string
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_parent_booking_id_fkey"
            columns: ["parent_booking_id"]
            isOneToOne: false
            referencedRelation: "booking_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_parent_booking_id_fkey"
            columns: ["parent_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "booking_details"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "booking_details"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_active: boolean
          location: string
          name: string
          timezone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          location: string
          name: string
          timezone: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          location?: string
          name?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      cancellation_tokens: {
        Row: {
          booking_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          token: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          token: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "cancellation_tokens_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancellation_tokens_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          branch_id: string
          capacity: number
          color: string | null
          created_at: string
          description: string | null
          equipment_list: string[] | null
          floor: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          capacity?: number
          color?: string | null
          created_at?: string
          description?: string | null
          equipment_list?: string[] | null
          floor?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          capacity?: number
          color?: string | null
          created_at?: string
          description?: string | null
          equipment_list?: string[] | null
          floor?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "booking_details"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "rooms_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_notifications: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
          processed_at: string | null
          scheduled_for: string
          status: string
          type: string
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
          processed_at?: string | null
          scheduled_for: string
          status?: string
          type: string
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
          processed_at?: string | null
          scheduled_for?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      booking_details: {
        Row: {
          branch_id: string | null
          branch_location: string | null
          branch_name: string | null
          branch_timezone: string | null
          created_at: string | null
          creator_email: string | null
          creator_name: string | null
          description: string | null
          end_time: string | null
          id: string | null
          is_recurring: boolean | null
          parent_booking_id: string | null
          recurrence_type: string | null
          room_capacity: number | null
          room_equipment: string[] | null
          room_id: string | null
          room_name: string | null
          start_time: string | null
          status: string | null
          title: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_parent_booking_id_fkey"
            columns: ["parent_booking_id"]
            isOneToOne: false
            referencedRelation: "booking_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_parent_booking_id_fkey"
            columns: ["parent_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_availability: {
        Args: {
          p_end_time: string
          p_exclude_booking_id?: string
          p_room_id: string
          p_start_time: string
        }
        Returns: boolean
      }
      confirm_cancellation: {
        Args: { p_booking_id: string; p_token: string }
        Returns: boolean
      }
      expand_recurring_booking: {
        Args: {
          p_description: string
          p_end_time: string
          p_months_ahead?: number
          p_recurrence_type: string
          p_room_id: string
          p_start_time: string
          p_title: string
          p_user_id: string
        }
        Returns: {
          created_at: string
          creator_email: string | null
          creator_name: string | null
          description: string | null
          end_time: string
          id: string
          is_recurring: boolean
          parent_booking_id: string | null
          recurrence_type: string | null
          room_id: string
          start_time: string
          status: string
          title: string
          updated_at: string
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      request_cancellation_token: {
        Args: { p_booking_id: string; p_email: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

// ============================================================
// Type aliases for backward compatibility
// ============================================================

// Table Row types (most commonly used)
export type Branch = Database["public"]["Tables"]["branches"]["Row"];
export type Room = Database["public"]["Tables"]["rooms"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type AdminDeletionLog = Database["public"]["Tables"]["admin_deletion_logs"]["Row"];
export type CancellationToken = Database["public"]["Tables"]["cancellation_tokens"]["Row"];
export type ScheduledNotification = Database["public"]["Tables"]["scheduled_notifications"]["Row"];

// Insert types
export type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];
export type BranchInsert = Database["public"]["Tables"]["branches"]["Insert"];
export type RoomInsert = Database["public"]["Tables"]["rooms"]["Insert"];

// Update types
export type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"];
export type BranchUpdate = Database["public"]["Tables"]["branches"]["Update"];
export type RoomUpdate = Database["public"]["Tables"]["rooms"]["Update"];

// View types
export type BookingDetails = Database["public"]["Views"]["booking_details"]["Row"];
