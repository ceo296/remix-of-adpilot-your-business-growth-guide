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
  public: {
    Tables: {
      branding_orders: {
        Row: {
          audience: string | null
          created_at: string
          design_preferences: string | null
          differentiator: string | null
          essence: string | null
          id: string
          package_price: number | null
          package_type: string | null
          payment_status: string | null
          persona: string | null
          status: string
          updated_at: string
          user_id: string
          vision: string | null
        }
        Insert: {
          audience?: string | null
          created_at?: string
          design_preferences?: string | null
          differentiator?: string | null
          essence?: string | null
          id?: string
          package_price?: number | null
          package_type?: string | null
          payment_status?: string | null
          persona?: string | null
          status?: string
          updated_at?: string
          user_id: string
          vision?: string | null
        }
        Update: {
          audience?: string | null
          created_at?: string
          design_preferences?: string | null
          differentiator?: string | null
          essence?: string | null
          id?: string
          package_price?: number | null
          package_type?: string | null
          payment_status?: string | null
          persona?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          vision?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          budget: number | null
          client_profile_id: string
          created_at: string
          creatives: Json | null
          end_date: string | null
          goal: string | null
          id: string
          name: string
          selected_media: Json | null
          start_date: string | null
          status: string | null
          target_city: string | null
          target_gender: string | null
          target_stream: string | null
          updated_at: string
          user_id: string
          vibe: string | null
        }
        Insert: {
          budget?: number | null
          client_profile_id: string
          created_at?: string
          creatives?: Json | null
          end_date?: string | null
          goal?: string | null
          id?: string
          name: string
          selected_media?: Json | null
          start_date?: string | null
          status?: string | null
          target_city?: string | null
          target_gender?: string | null
          target_stream?: string | null
          updated_at?: string
          user_id: string
          vibe?: string | null
        }
        Update: {
          budget?: number | null
          client_profile_id?: string
          created_at?: string
          creatives?: Json | null
          end_date?: string | null
          goal?: string | null
          id?: string
          name?: string
          selected_media?: Json | null
          start_date?: string | null
          status?: string | null
          target_city?: string | null
          target_gender?: string | null
          target_stream?: string | null
          updated_at?: string
          user_id?: string
          vibe?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_client_profile_id_fkey"
            columns: ["client_profile_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_profiles: {
        Row: {
          advantage_slider: number | null
          advantage_type: string | null
          agency_owner_id: string | null
          background_color: string | null
          body_font: string | null
          business_name: string
          competitor_positions: Json | null
          competitors: string[] | null
          created_at: string
          decision_maker: string | null
          end_consumer: string | null
          header_font: string | null
          id: string
          is_agency_profile: boolean | null
          logo_url: string | null
          my_position_x: number | null
          my_position_y: number | null
          onboarding_completed: boolean | null
          past_materials: Json | null
          primary_color: string | null
          primary_x_factor: string | null
          secondary_color: string | null
          target_audience: string | null
          updated_at: string
          user_id: string
          website_url: string | null
          winning_feature: string | null
          x_factors: string[] | null
        }
        Insert: {
          advantage_slider?: number | null
          advantage_type?: string | null
          agency_owner_id?: string | null
          background_color?: string | null
          body_font?: string | null
          business_name: string
          competitor_positions?: Json | null
          competitors?: string[] | null
          created_at?: string
          decision_maker?: string | null
          end_consumer?: string | null
          header_font?: string | null
          id?: string
          is_agency_profile?: boolean | null
          logo_url?: string | null
          my_position_x?: number | null
          my_position_y?: number | null
          onboarding_completed?: boolean | null
          past_materials?: Json | null
          primary_color?: string | null
          primary_x_factor?: string | null
          secondary_color?: string | null
          target_audience?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
          winning_feature?: string | null
          x_factors?: string[] | null
        }
        Update: {
          advantage_slider?: number | null
          advantage_type?: string | null
          agency_owner_id?: string | null
          background_color?: string | null
          body_font?: string | null
          business_name?: string
          competitor_positions?: Json | null
          competitors?: string[] | null
          created_at?: string
          decision_maker?: string | null
          end_consumer?: string | null
          header_font?: string | null
          id?: string
          is_agency_profile?: boolean | null
          logo_url?: string | null
          my_position_x?: number | null
          my_position_y?: number | null
          onboarding_completed?: boolean | null
          past_materials?: Json | null
          primary_color?: string | null
          primary_x_factor?: string | null
          secondary_color?: string | null
          target_audience?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
          winning_feature?: string | null
          x_factors?: string[] | null
        }
        Relationships: []
      }
      generated_images: {
        Row: {
          created_at: string
          engine: string
          id: string
          image_url: string
          kosher_analysis: string | null
          kosher_status: string
          style: string
          text_prompt: string | null
          visual_prompt: string
        }
        Insert: {
          created_at?: string
          engine: string
          id?: string
          image_url: string
          kosher_analysis?: string | null
          kosher_status?: string
          style: string
          text_prompt?: string | null
          visual_prompt: string
        }
        Update: {
          created_at?: string
          engine?: string
          id?: string
          image_url?: string
          kosher_analysis?: string | null
          kosher_status?: string
          style?: string
          text_prompt?: string | null
          visual_prompt?: string
        }
        Relationships: []
      }
      media_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          name_he: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          name_he: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          name_he?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      media_cities: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          name_he: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_he: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_he?: string
        }
        Relationships: []
      }
      media_inventory: {
        Row: {
          base_price: number
          client_price: number
          created_at: string
          description: string | null
          distribution_days: string[]
          id: string
          is_active: boolean
          name: string
          reach: string | null
          sector_tags: string[]
          type: string
          updated_at: string
        }
        Insert: {
          base_price?: number
          client_price?: number
          created_at?: string
          description?: string | null
          distribution_days?: string[]
          id?: string
          is_active?: boolean
          name: string
          reach?: string | null
          sector_tags?: string[]
          type: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          client_price?: number
          created_at?: string
          description?: string | null
          distribution_days?: string[]
          id?: string
          is_active?: boolean
          name?: string
          reach?: string | null
          sector_tags?: string[]
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      media_outlets: {
        Row: {
          brand_color: string | null
          category_id: string
          city: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          name_he: string | null
          reach_info: string | null
          sector: string | null
          stream: string | null
          vibe: string | null
          vibe_he: string | null
          warning_text: string | null
        }
        Insert: {
          brand_color?: string | null
          category_id: string
          city?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          name_he?: string | null
          reach_info?: string | null
          sector?: string | null
          stream?: string | null
          vibe?: string | null
          vibe_he?: string | null
          warning_text?: string | null
        }
        Update: {
          brand_color?: string | null
          category_id?: string
          city?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          name_he?: string | null
          reach_info?: string | null
          sector?: string | null
          stream?: string | null
          vibe?: string | null
          vibe_he?: string | null
          warning_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_outlets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "media_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      media_products: {
        Row: {
          base_price: number | null
          client_price: number | null
          created_at: string | null
          gender_target: string | null
          id: string
          is_active: boolean | null
          name: string
          name_he: string | null
          outlet_id: string
          product_type: string
          requires_image: boolean | null
          requires_text: boolean | null
          special_tag: string | null
          target_audience: string | null
        }
        Insert: {
          base_price?: number | null
          client_price?: number | null
          created_at?: string | null
          gender_target?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_he?: string | null
          outlet_id: string
          product_type: string
          requires_image?: boolean | null
          requires_text?: boolean | null
          special_tag?: string | null
          target_audience?: string | null
        }
        Update: {
          base_price?: number | null
          client_price?: number | null
          created_at?: string | null
          gender_target?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_he?: string | null
          outlet_id?: string
          product_type?: string
          requires_image?: boolean | null
          requires_text?: boolean | null
          special_tag?: string | null
          target_audience?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_products_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "media_outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      product_specs: {
        Row: {
          allowed_content: string[] | null
          base_price: number | null
          client_price: number | null
          created_at: string | null
          dimensions: string | null
          id: string
          is_active: boolean | null
          name: string
          name_he: string | null
          product_id: string
        }
        Insert: {
          allowed_content?: string[] | null
          base_price?: number | null
          client_price?: number | null
          created_at?: string | null
          dimensions?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_he?: string | null
          product_id: string
        }
        Update: {
          allowed_content?: string[] | null
          base_price?: number | null
          client_price?: number | null
          created_at?: string | null
          dimensions?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_he?: string | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_specs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "media_products"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prompt_templates: {
        Row: {
          category: string
          created_at: string
          dynamic_variables: string[]
          id: string
          is_active: boolean
          name: string
          style_preset: string | null
          system_prompt: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          dynamic_variables?: string[]
          id?: string
          is_active?: boolean
          name: string
          style_preset?: string | null
          system_prompt: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          dynamic_variables?: string[]
          id?: string
          is_active?: boolean
          name?: string
          style_preset?: string | null
          system_prompt?: string
          updated_at?: string
        }
        Relationships: []
      }
      sector_brain_examples: {
        Row: {
          created_at: string
          description: string | null
          file_path: string
          file_type: string
          gender_audience: string | null
          id: string
          name: string
          stream_type: string | null
          text_content: string | null
          zone: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_path: string
          file_type: string
          gender_audience?: string | null
          id?: string
          name: string
          stream_type?: string | null
          text_content?: string | null
          zone: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_path?: string
          file_type?: string
          gender_audience?: string | null
          id?: string
          name?: string
          stream_type?: string | null
          text_content?: string | null
          zone?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
