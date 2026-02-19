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
      ai_generation_logs: {
        Row: {
          brand_context: Json | null
          campaign_context: Json | null
          client_profile_id: string | null
          created_at: string
          feedback_notes: string | null
          generated_output: string | null
          generation_type: string
          id: string
          media_type: string
          model_config_id: string | null
          prompt_used: string
          success: boolean
          user_feedback: string | null
          user_id: string | null
        }
        Insert: {
          brand_context?: Json | null
          campaign_context?: Json | null
          client_profile_id?: string | null
          created_at?: string
          feedback_notes?: string | null
          generated_output?: string | null
          generation_type: string
          id?: string
          media_type: string
          model_config_id?: string | null
          prompt_used: string
          success?: boolean
          user_feedback?: string | null
          user_id?: string | null
        }
        Update: {
          brand_context?: Json | null
          campaign_context?: Json | null
          client_profile_id?: string | null
          created_at?: string
          feedback_notes?: string | null
          generated_output?: string | null
          generation_type?: string
          id?: string
          media_type?: string
          model_config_id?: string | null
          prompt_used?: string
          success?: boolean
          user_feedback?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_generation_logs_client_profile_id_fkey"
            columns: ["client_profile_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generation_logs_model_config_id_fkey"
            columns: ["model_config_id"]
            isOneToOne: false
            referencedRelation: "ai_model_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_model_configs: {
        Row: {
          color_usage_rules: string | null
          created_at: string
          description: string | null
          design_rules: string[] | null
          display_name: string
          donts: string[] | null
          dos: string[] | null
          example_prompts: string[] | null
          id: string
          is_active: boolean
          layout_principles: string[] | null
          logo_instructions: string | null
          media_type: string
          model_name: string
          system_prompt: string
          text_rules: string[] | null
          typography_rules: string | null
          updated_at: string
        }
        Insert: {
          color_usage_rules?: string | null
          created_at?: string
          description?: string | null
          design_rules?: string[] | null
          display_name: string
          donts?: string[] | null
          dos?: string[] | null
          example_prompts?: string[] | null
          id?: string
          is_active?: boolean
          layout_principles?: string[] | null
          logo_instructions?: string | null
          media_type: string
          model_name: string
          system_prompt: string
          text_rules?: string[] | null
          typography_rules?: string | null
          updated_at?: string
        }
        Update: {
          color_usage_rules?: string | null
          created_at?: string
          description?: string | null
          design_rules?: string[] | null
          display_name?: string
          donts?: string[] | null
          dos?: string[] | null
          example_prompts?: string[] | null
          id?: string
          is_active?: boolean
          layout_principles?: string[] | null
          logo_instructions?: string | null
          media_type?: string
          model_name?: string
          system_prompt?: string
          text_rules?: string[] | null
          typography_rules?: string | null
          updated_at?: string
        }
        Relationships: []
      }
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
      campaign_media_proofs: {
        Row: {
          admin_notes: string | null
          admin_reviewed_at: string | null
          admin_status: string | null
          campaign_id: string
          created_at: string
          id: string
          image_url: string
          media_outlet_name: string
          notes: string | null
          order_id: string | null
          proof_type: string
          publication_date: string | null
        }
        Insert: {
          admin_notes?: string | null
          admin_reviewed_at?: string | null
          admin_status?: string | null
          campaign_id: string
          created_at?: string
          id?: string
          image_url: string
          media_outlet_name: string
          notes?: string | null
          order_id?: string | null
          proof_type?: string
          publication_date?: string | null
        }
        Update: {
          admin_notes?: string | null
          admin_reviewed_at?: string | null
          admin_status?: string | null
          campaign_id?: string
          created_at?: string
          id?: string
          image_url?: string
          media_outlet_name?: string
          notes?: string | null
          order_id?: string | null
          proof_type?: string
          publication_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_media_proofs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_media_proofs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "media_orders"
            referencedColumns: ["id"]
          },
        ]
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
          contact_address: string | null
          contact_email: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          contact_youtube: string | null
          created_at: string
          decision_maker: string | null
          end_consumer: string | null
          header_font: string | null
          honorific_preference: string | null
          id: string
          is_agency_profile: boolean | null
          logo_url: string | null
          my_position_x: number | null
          my_position_y: number | null
          onboarding_completed: boolean | null
          past_materials: Json | null
          personal_red_lines: string[] | null
          primary_color: string | null
          primary_x_factor: string | null
          secondary_color: string | null
          social_facebook: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_tiktok: string | null
          successful_campaigns: string[] | null
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
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          contact_youtube?: string | null
          created_at?: string
          decision_maker?: string | null
          end_consumer?: string | null
          header_font?: string | null
          honorific_preference?: string | null
          id?: string
          is_agency_profile?: boolean | null
          logo_url?: string | null
          my_position_x?: number | null
          my_position_y?: number | null
          onboarding_completed?: boolean | null
          past_materials?: Json | null
          personal_red_lines?: string[] | null
          primary_color?: string | null
          primary_x_factor?: string | null
          secondary_color?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_tiktok?: string | null
          successful_campaigns?: string[] | null
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
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          contact_youtube?: string | null
          created_at?: string
          decision_maker?: string | null
          end_consumer?: string | null
          header_font?: string | null
          honorific_preference?: string | null
          id?: string
          is_agency_profile?: boolean | null
          logo_url?: string | null
          my_position_x?: number | null
          my_position_y?: number | null
          onboarding_completed?: boolean | null
          past_materials?: Json | null
          personal_red_lines?: string[] | null
          primary_color?: string | null
          primary_x_factor?: string | null
          secondary_color?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_tiktok?: string | null
          successful_campaigns?: string[] | null
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
      media_orders: {
        Row: {
          campaign_id: string
          client_price: number | null
          created_at: string | null
          creative_url: string | null
          deadline_date: string | null
          id: string
          media_notes: string | null
          order_notes: string | null
          outlet_id: string
          product_id: string | null
          publication_date: string | null
          spec_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          client_price?: number | null
          created_at?: string | null
          creative_url?: string | null
          deadline_date?: string | null
          id?: string
          media_notes?: string | null
          order_notes?: string | null
          outlet_id: string
          product_id?: string | null
          publication_date?: string | null
          spec_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          client_price?: number | null
          created_at?: string | null
          creative_url?: string | null
          deadline_date?: string | null
          id?: string
          media_notes?: string | null
          order_notes?: string | null
          outlet_id?: string
          product_id?: string | null
          publication_date?: string | null
          spec_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_orders_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_orders_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "media_outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "media_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_orders_spec_id_fkey"
            columns: ["spec_id"]
            isOneToOne: false
            referencedRelation: "product_specs"
            referencedColumns: ["id"]
          },
        ]
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
      media_portal_access: {
        Row: {
          access_token: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_accessed_at: string | null
          outlet_id: string
          updated_at: string | null
        }
        Insert: {
          access_token?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          outlet_id: string
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          outlet_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_portal_access_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "media_outlets"
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
          example_type: string | null
          file_path: string
          file_type: string
          gender_audience: string | null
          holiday_season: string | null
          id: string
          is_general_guideline: boolean | null
          media_type: string | null
          name: string
          stream_type: string | null
          text_content: string | null
          topic_category: string | null
          zone: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          example_type?: string | null
          file_path: string
          file_type: string
          gender_audience?: string | null
          holiday_season?: string | null
          id?: string
          is_general_guideline?: boolean | null
          media_type?: string | null
          name: string
          stream_type?: string | null
          text_content?: string | null
          topic_category?: string | null
          zone: string
        }
        Update: {
          created_at?: string
          description?: string | null
          example_type?: string | null
          file_path?: string
          file_type?: string
          gender_audience?: string | null
          holiday_season?: string | null
          id?: string
          is_general_guideline?: boolean | null
          media_type?: string | null
          name?: string
          stream_type?: string | null
          text_content?: string | null
          topic_category?: string | null
          zone?: string
        }
        Relationships: []
      }
      sector_brain_links: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          media_type: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          media_type?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          media_type?: string | null
          updated_at?: string
          url?: string
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
