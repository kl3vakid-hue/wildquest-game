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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      animal_identifications: {
        Row: {
          animal_name: string
          confidence: number | null
          created_at: string
          description: string | null
          device_id: string
          game_id: string | null
          habitat: string | null
          id: string
          image_path: string | null
          in_south_africa: boolean | null
          interesting_facts: string[]
          player_id: string | null
          rarity: string | null
          scientific_name: string | null
          user_id: string | null
        }
        Insert: {
          animal_name: string
          confidence?: number | null
          created_at?: string
          description?: string | null
          device_id: string
          game_id?: string | null
          habitat?: string | null
          id?: string
          image_path?: string | null
          in_south_africa?: boolean | null
          interesting_facts?: string[]
          player_id?: string | null
          rarity?: string | null
          scientific_name?: string | null
          user_id?: string | null
        }
        Update: {
          animal_name?: string
          confidence?: number | null
          created_at?: string
          description?: string | null
          device_id?: string
          game_id?: string | null
          habitat?: string | null
          id?: string
          image_path?: string | null
          in_south_africa?: boolean | null
          interesting_facts?: string[]
          player_id?: string | null
          rarity?: string | null
          scientific_name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animal_identifications_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_identifications_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      game_achievements: {
        Row: {
          created_at: string
          description: string
          game_id: string
          icon: string
          id: string
          name: string
          points: number
          rarity: string | null
          required_count: number | null
          species: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          game_id: string
          icon?: string
          id?: string
          name: string
          points?: number
          rarity?: string | null
          required_count?: number | null
          species?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          game_id?: string
          icon?: string
          id?: string
          name?: string
          points?: number
          rarity?: string | null
          required_count?: number | null
          species?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_achievements_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_settings: {
        Row: {
          created_at: string
          game_id: string
          id: string
          rarity_limits: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          rarity_limits?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          rarity_limits?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_settings_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: true
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          code: string
          created_at: string
          ended_at: string | null
          host_player_id: string | null
          id: string
          name: string
          status: string
        }
        Insert: {
          code: string
          created_at?: string
          ended_at?: string | null
          host_player_id?: string | null
          id?: string
          name: string
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          ended_at?: string | null
          host_player_id?: string | null
          id?: string
          name?: string
          status?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          created_at: string
          game_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string
          device_id: string
          game_id: string
          group_id: string | null
          id: string
          is_host: boolean
          is_ready: boolean
          name: string
          score: number
        }
        Insert: {
          created_at?: string
          device_id: string
          game_id: string
          group_id?: string | null
          id?: string
          is_host?: boolean
          is_ready?: boolean
          name: string
          score?: number
        }
        Update: {
          created_at?: string
          device_id?: string
          game_id?: string
          group_id?: string | null
          id?: string
          is_host?: boolean
          is_ready?: boolean
          name?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      sighting_verifications: {
        Row: {
          ai_confidence: number | null
          ai_in_south_africa: boolean | null
          ai_scientific_name: string | null
          ai_species: string | null
          captured_at: string | null
          checks: Json
          claimed_animal_id: string | null
          claimed_animal_name: string | null
          created_at: string
          decision: string
          device_id: string | null
          flags: string[]
          game_id: string | null
          gps_accuracy: number | null
          id: string
          image_hash: string | null
          image_path: string | null
          latitude: number | null
          location_plausible: boolean | null
          longitude: number | null
          player_id: string | null
          raw_response: Json | null
          sighting_id: string | null
          species_match: boolean | null
          updated_at: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_in_south_africa?: boolean | null
          ai_scientific_name?: string | null
          ai_species?: string | null
          captured_at?: string | null
          checks?: Json
          claimed_animal_id?: string | null
          claimed_animal_name?: string | null
          created_at?: string
          decision: string
          device_id?: string | null
          flags?: string[]
          game_id?: string | null
          gps_accuracy?: number | null
          id?: string
          image_hash?: string | null
          image_path?: string | null
          latitude?: number | null
          location_plausible?: boolean | null
          longitude?: number | null
          player_id?: string | null
          raw_response?: Json | null
          sighting_id?: string | null
          species_match?: boolean | null
          updated_at?: string
        }
        Update: {
          ai_confidence?: number | null
          ai_in_south_africa?: boolean | null
          ai_scientific_name?: string | null
          ai_species?: string | null
          captured_at?: string | null
          checks?: Json
          claimed_animal_id?: string | null
          claimed_animal_name?: string | null
          created_at?: string
          decision?: string
          device_id?: string | null
          flags?: string[]
          game_id?: string | null
          gps_accuracy?: number | null
          id?: string
          image_hash?: string | null
          image_path?: string | null
          latitude?: number | null
          location_plausible?: boolean | null
          longitude?: number | null
          player_id?: string | null
          raw_response?: Json | null
          sighting_id?: string | null
          species_match?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sighting_verifications_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sighting_verifications_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sighting_verifications_sighting_id_fkey"
            columns: ["sighting_id"]
            isOneToOne: false
            referencedRelation: "sightings"
            referencedColumns: ["id"]
          },
        ]
      }
      sightings: {
        Row: {
          ai_confidence: number | null
          ai_species: string | null
          ai_verdict: string | null
          animal_id: string
          animal_name: string
          captured_at: string | null
          created_at: string
          device_id: string | null
          flags: string[]
          game_id: string
          gps_accuracy: number | null
          id: string
          image_hash: string | null
          image_path: string | null
          latitude: number | null
          longitude: number | null
          player_id: string
          points: number
          rarity: string
          reject_reason: string | null
          source: string
          verification_status: string
          verified_at: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_species?: string | null
          ai_verdict?: string | null
          animal_id: string
          animal_name: string
          captured_at?: string | null
          created_at?: string
          device_id?: string | null
          flags?: string[]
          game_id: string
          gps_accuracy?: number | null
          id?: string
          image_hash?: string | null
          image_path?: string | null
          latitude?: number | null
          longitude?: number | null
          player_id: string
          points: number
          rarity: string
          reject_reason?: string | null
          source?: string
          verification_status?: string
          verified_at?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_species?: string | null
          ai_verdict?: string | null
          animal_id?: string
          animal_name?: string
          captured_at?: string | null
          created_at?: string
          device_id?: string | null
          flags?: string[]
          game_id?: string
          gps_accuracy?: number | null
          id?: string
          image_hash?: string | null
          image_path?: string | null
          latitude?: number | null
          longitude?: number | null
          player_id?: string
          points?: number
          rarity?: string
          reject_reason?: string | null
          source?: string
          verification_status?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sightings_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sightings_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_game_by_code: {
        Args: { _code: string }
        Returns: {
          id: string
          name: string
          status: string
        }[]
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
