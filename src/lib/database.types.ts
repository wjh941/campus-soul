export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; nickname: string; avatar_url: string | null; school: string; major: string | null; grade: string | null; bio: string | null; interests: string[]; verified: boolean; birth_year: number | null; gender: string | null; personality: string | null; lifestyle: string[]; relationship_values: string[]; hometown: string | null; ideal_date: string | null; profile_visible: boolean; onboarding_complete: boolean; life_stage: string; city: string | null; occupation: string | null; industry: string | null; organization: string | null; verification_type: string | null; is_admin: boolean; birth_date: string | null; accepted_terms_at: string | null; accepted_privacy_at: string | null; account_status: string; muted_until: string | null; created_at: string; updated_at: string; assessment_completed: boolean; self_assessment: Json }
        Insert: { id: string; assessment_completed?: boolean; self_assessment?: Json; nickname?: string; avatar_url?: string | null; school?: string; major?: string | null; grade?: string | null; bio?: string | null; interests?: string[]; verified?: boolean; birth_year?: number | null; gender?: string | null; personality?: string | null; lifestyle?: string[]; relationship_values?: string[]; hometown?: string | null; ideal_date?: string | null; profile_visible?: boolean; onboarding_complete?: boolean; life_stage?: string; city?: string | null; occupation?: string | null; industry?: string | null; organization?: string | null; verification_type?: string | null; is_admin?: boolean; birth_date?: string | null; accepted_terms_at?: string | null; accepted_privacy_at?: string | null; account_status?: string; muted_until?: string | null; created_at?: string; updated_at?: string }
        Update: { assessment_completed?: boolean; self_assessment?: Json; nickname?: string; avatar_url?: string | null; school?: string; major?: string | null; grade?: string | null; bio?: string | null; interests?: string[]; birth_year?: number | null; gender?: string | null; personality?: string | null; lifestyle?: string[]; relationship_values?: string[]; hometown?: string | null; ideal_date?: string | null; profile_visible?: boolean; onboarding_complete?: boolean; life_stage?: string; city?: string | null; occupation?: string | null; industry?: string | null; organization?: string | null; verification_type?: string | null; is_admin?: boolean; birth_date?: string | null; accepted_terms_at?: string | null; accepted_privacy_at?: string | null; account_status?: string; muted_until?: string | null; updated_at?: string }
        Relationships: []
      }
      anonymous_queue: {
        Row: { user_id: string; mode: string; joined_at: string; last_seen_at: string }
        Insert: { user_id: string; mode?: string; joined_at?: string; last_seen_at?: string }
        Update: { mode?: string; joined_at?: string; last_seen_at?: string }
        Relationships: []
      }
      anonymous_sessions: {
        Row: { id: string; user_a: string; user_b: string; status: string; reveal_a: boolean; reveal_b: boolean; compatibility_score: number; created_at: string; ended_at: string | null }
        Insert: never; Update: never; Relationships: []
      }
      anonymous_messages: {
        Row: { id: string; session_id: string; sender_id: string; kind: string; content: string; created_at: string }
        Insert: { id?: string; session_id: string; sender_id: string; kind?: string; content: string; created_at?: string }
        Update: never; Relationships: []
      }
      anonymous_games: {
        Row: { id: string; session_id: string; game_type: string; prompt: string; options: Json; answers: Json; result_score: number | null; created_by: string; created_at: string }
        Insert: never; Update: never; Relationships: []
      }
      user_locations: {
        Row: { user_id: string; latitude: number; longitude: number; accuracy_m: number | null; enabled: boolean; updated_at: string }
        Insert: { user_id: string; latitude: number; longitude: number; accuracy_m?: number | null; enabled?: boolean; updated_at?: string }
        Update: { latitude?: number; longitude?: number; accuracy_m?: number | null; enabled?: boolean; updated_at?: string }
        Relationships: []
      }
      posts: {
        Row: { id: string; author_id: string; content: string; image_url: string | null; tags: string[]; moderation_status: string; created_at: string; updated_at: string }
        Insert: { id?: string; author_id: string; content: string; image_url?: string | null; tags?: string[]; moderation_status?: string; created_at?: string; updated_at?: string }
        Update: { content?: string; image_url?: string | null; tags?: string[]; moderation_status?: string; updated_at?: string }
        Relationships: []
      }
      comments: {
        Row: { id: string; post_id: string; author_id: string; content: string; created_at: string }
        Insert: { id?: string; post_id: string; author_id: string; content: string; created_at?: string }
        Update: { content?: string }
        Relationships: []
      }
      post_likes: {
        Row: { post_id: string; user_id: string; created_at: string }
        Insert: { post_id: string; user_id: string; created_at?: string }
        Update: never
        Relationships: []
      }
      preferences: {
        Row: { user_id: string; desired_traits: string[]; relationship_intent: string; interaction_frequency: number; age_min: number; age_max: number; preferred_genders: string[]; preferred_interests: string[]; preferred_values: string[]; preferred_lifestyle: string[]; same_school_only: boolean; same_city_only: boolean; preferred_life_stages: string[]; verified_only: boolean; minimum_match_score: number; recommendation_sort: string; ideal_requirements: Json; requirement_weights: Json; updated_at: string }
        Insert: { user_id: string; desired_traits?: string[]; relationship_intent?: string; interaction_frequency?: number; age_min?: number; age_max?: number; preferred_genders?: string[]; preferred_interests?: string[]; preferred_values?: string[]; preferred_lifestyle?: string[]; same_school_only?: boolean; same_city_only?: boolean; preferred_life_stages?: string[]; verified_only?: boolean; minimum_match_score?: number; recommendation_sort?: string; updated_at?: string }
        Update: { desired_traits?: string[]; relationship_intent?: string; interaction_frequency?: number; age_min?: number; age_max?: number; preferred_genders?: string[]; preferred_interests?: string[]; preferred_values?: string[]; preferred_lifestyle?: string[]; same_school_only?: boolean; same_city_only?: boolean; preferred_life_stages?: string[]; verified_only?: boolean; minimum_match_score?: number; recommendation_sort?: string; updated_at?: string }
        Relationships: []
      }
      notifications: {
        Row: { id: string; user_id: string; type: string; title: string; body: string; link: string | null; read_at: string | null; created_at: string }
        Insert: { id?: string; user_id: string; type: string; title: string; body: string; link?: string | null; read_at?: string | null; created_at?: string }
        Update: { read_at?: string | null }
        Relationships: []
      }
      moderation_actions: {
        Row: { id: string; admin_id: string; target_user_id: string | null; target_post_id: string | null; action: string; reason: string; expires_at: string | null; created_at: string }
        Insert: { id?: string; admin_id: string; target_user_id?: string | null; target_post_id?: string | null; action: string; reason: string; expires_at?: string | null; created_at?: string }
        Update: never
        Relationships: []
      }
      verification_requests: {
        Row: { id: string; user_id: string; verification_type: string; organization: string; evidence_url: string | null; contact_email: string; status: string; reviewer_note: string | null; created_at: string; reviewed_at: string | null }
        Insert: { id?: string; user_id: string; verification_type: string; organization: string; evidence_url?: string | null; contact_email: string; status?: string; reviewer_note?: string | null; created_at?: string; reviewed_at?: string | null }
        Update: { status?: string; reviewer_note?: string | null; reviewed_at?: string | null }
        Relationships: []
      }
      user_blocks: {
        Row: { blocker_id: string; blocked_id: string; created_at: string }
        Insert: { blocker_id: string; blocked_id: string; created_at?: string }
        Update: never
        Relationships: []
      }
      reports: {
        Row: { id: string; reporter_id: string; target_user_id: string | null; target_post_id: string | null; reason: string; details: string | null; status: string; created_at: string }
        Insert: { id?: string; reporter_id: string; target_user_id?: string | null; target_post_id?: string | null; reason: string; details?: string | null; status?: string; created_at?: string }
        Update: never
        Relationships: []
      }
      profile_photos: {
        Row: { id: string; user_id: string; url: string; position: number; created_at: string }
        Insert: { id?: string; user_id: string; url: string; position?: number; created_at?: string }
        Update: { url?: string; position?: number }
        Relationships: []
      }
      heart_signals: {
        Row: { sender_id: string; receiver_id: string; created_at: string }
        Insert: { sender_id: string; receiver_id: string; created_at?: string }
        Update: never
        Relationships: []
      }
      matches: {
        Row: { id: string; user_a: string; user_b: string; created_at: string; active: boolean }
        Insert: { id?: string; user_a: string; user_b: string; created_at?: string; active?: boolean }
        Update: { active?: boolean }
        Relationships: []
      }
      messages: {
        Row: { id: string; match_id: string; sender_id: string; content: string; created_at: string }
        Insert: { id?: string; match_id: string; sender_id: string; content: string; created_at?: string }
        Update: never
        Relationships: []
      }
      membership_plans:{Row:{id:string;name:string;description:string;price_cents:number;billing_period:string;entitlements:Json;active:boolean;sort_order:number;created_at:string};Insert:never;Update:never;Relationships:[]}
      subscriptions:{Row:{id:string;user_id:string;plan_id:string;status:string;starts_at:string;ends_at:string;auto_renew:boolean;provider:string|null;provider_subscription_id:string|null;created_at:string;updated_at:string};Insert:never;Update:never;Relationships:[]}
      orders:{Row:{id:string;user_id:string;plan_id:string|null;amount_cents:number;currency:string;status:string;provider:string|null;provider_order_id:string|null;idempotency_key:string;created_at:string;paid_at:string|null};Insert:never;Update:never;Relationships:[]}
      support_tickets:{Row:{id:string;user_id:string;category:string;subject:string;body:string;status:string;priority:string;created_at:string;updated_at:string};Insert:{id?:string;user_id:string;category:string;subject:string;body:string;status?:string;priority?:string;created_at?:string;updated_at?:string};Update:{status?:string;priority?:string;updated_at?:string};Relationships:[]}
      conversation_reads: {
        Row: { match_id: string; user_id: string; last_read_at: string }
        Insert: { match_id: string; user_id: string; last_read_at?: string }
        Update: { last_read_at?: string }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      cancel_my_pending_order:{Args:{target_order:string};Returns:undefined}
      admin_commerce_summary:{Args:Record<string,never>;Returns:Json}
      admin_support_queue:{Args:{result_limit?:number};Returns:{id:string;user_id:string;email:string|null;category:string;subject:string;body:string;status:string;priority:string;created_at:string}[]}
      admin_update_ticket:{Args:{target_ticket:string;next_status:string;next_priority?:string|null};Returns:undefined}
      get_my_membership:{Args:Record<string,never>;Returns:Json}
      get_my_admirers:{Args:Record<string,never>;Returns:{user_id:string;nickname:string;avatar_url:string|null;school:string;created_at:string;can_view:boolean}[]}
      create_pending_order:{Args:{chosen_plan:string};Returns:string}
      join_waitlist:{Args:{contact_email:string;contact_city?:string|null;contact_school?:string|null;referral?:string|null;accepted?:boolean};Returns:undefined}
      track_product_event:{Args:{chosen_event:string;properties?:Json};Returns:undefined}
      send_heart: { Args: { target_user: string }; Returns: { matched: boolean; match_id: string | null }[] }
      get_match_recommendations: { Args: { result_limit?: number }; Returns: { user_id: string; nickname: string; avatar_url: string | null; school: string; major: string | null; birth_year: number | null; personality: string | null; bio: string | null; interests: string[]; lifestyle: string[]; relationship_values: string[]; verified: boolean; overall_score: number; interest_score: number; value_score: number; lifestyle_score: number; reasons: string[] }[] }
      get_preference_recommendations: { Args: { page_size?: number; page_offset?: number }; Returns: { user_id: string; nickname: string; avatar_url: string | null; school: string; major: string | null; birth_year: number | null; personality: string | null; bio: string | null; interests: string[]; lifestyle: string[]; relationship_values: string[]; verified: boolean; overall_score: number; interest_score: number; value_score: number; lifestyle_score: number; reasons: string[] }[] }
      block_user: { Args: { target_user: string }; Returns: undefined }
      end_match: { Args: { target_match: string }; Returns: undefined }
      review_verification: { Args: { request_id: string; decision: string; note?: string | null }; Returns: undefined }
      is_admin: { Args: Record<string, never>; Returns: boolean }
      accept_legal: { Args: { birthday: string }; Returns: undefined }
      can_interact: { Args: { uid: string }; Returns: boolean }
      moderate_target: { Args: { target_user: string | null; target_post: string | null; chosen_action: string; action_reason: string; duration_hours?: number | null }; Returns: undefined }
      resolve_report: { Args: { report_id: string; resolution: string }; Returns: undefined }
      report_post: { Args: { target_post: string; report_reason: string; report_details?: string | null }; Returns: undefined }
      admin_search_users: { Args: { search_text?: string; result_limit?: number }; Returns: { id: string; nickname: string; email: string; city: string | null; life_stage: string; account_status: string; muted_until: string | null; verified: boolean; created_at: string }[] }
      export_my_data: { Args: Record<string, never>; Returns: Json }
      delete_my_account: { Args: { confirm_text: string }; Returns: undefined }
      save_self_assessment: { Args: { answers: Json; requirements: Json; weights?: Json | null }; Returns: undefined }
      save_match_weights: { Args: { weights: Json }; Returns: undefined }
      save_match_feedback: { Args: { target: string; feedback_type: string }; Returns: undefined }
      get_intelligent_matches_v2: { Args: { result_limit?: number }; Returns: { user_id: string; nickname: string; avatar_url: string | null; school: string; major: string | null; birth_year: number | null; personality: string | null; bio: string | null; interests: string[]; verified: boolean; overall_score: number; value_score: number; lifestyle_score: number; interest_score: number; communication_score: number; intent_score: number; reasons: string[]; topics: string[]; analysis: Json }[] }
      get_intelligent_matches: { Args: { result_limit?: number }; Returns: { user_id: string; nickname: string; avatar_url: string | null; school: string; major: string | null; birth_year: number | null; personality: string | null; bio: string | null; interests: string[]; verified: boolean; overall_score: number; value_score: number; lifestyle_score: number; interest_score: number; communication_score: number; intent_score: number; reasons: string[]; topics?: string[]; analysis: Json }[] }
      save_approximate_location: { Args: { lat: number; lng: number; accuracy?: number | null }; Returns: undefined }
      disable_location: { Args: Record<string, never>; Returns: undefined }
       heartbeat_anonymous_queue: { Args: Record<string, never>; Returns: undefined }
      join_anonymous_queue: { Args: { chosen_mode?: string }; Returns: { state: string; session_id: string | null }[] }
      get_anonymous_session: { Args: Record<string, never>; Returns: Database['public']['Tables']['anonymous_sessions']['Row'][] }
      leave_anonymous_chat: { Args: { target_session: string }; Returns: undefined }
      request_anonymous_reveal: { Args: { target_session: string }; Returns: boolean }
      create_anonymous_game: { Args: { target_session: string; chosen_type: string }; Returns: string }
      answer_anonymous_game: { Args: { game_id: string; choice: number }; Returns: number | null }
      get_revealed_partner: { Args: { target_session: string }; Returns: { id: string; nickname: string; avatar_url: string | null; life_stage: string; city: string | null; verified: boolean }[] }
      report_anonymous_session: { Args: { target_session: string; report_reason: string }; Returns: undefined }
      get_nearby_discovery: { Args: { result_limit?: number; max_distance_km?: number }; Returns: { user_id: string; nickname: string; avatar_url: string | null; school: string; major: string | null; birth_year: number | null; personality: string | null; bio: string | null; interests: string[]; verified: boolean; overall_score: number; interest_score: number; value_score: number; lifestyle_score: number; reasons: string[]; distance_km: number; bearing_degrees: number }[] }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
