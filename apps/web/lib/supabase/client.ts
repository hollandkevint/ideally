import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
        }
      }
      workspaces: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string
          created_at: string
          updated_at: string
          chat_context: Array<Record<string, unknown>>
          canvas_elements: Array<Record<string, unknown>>
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description: string
          created_at?: string
          updated_at?: string
          chat_context?: Array<Record<string, unknown>>
          canvas_elements?: Array<Record<string, unknown>>
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string
          created_at?: string
          updated_at?: string
          chat_context?: Array<Record<string, unknown>>
          canvas_elements?: Array<Record<string, unknown>>
        }
      }
      user_workspace: {
        Row: {
          user_id: string
          workspace_state: Record<string, unknown>
          updated_at: string
        }
        Insert: {
          user_id: string
          workspace_state?: Record<string, unknown>
          updated_at?: string
        }
        Update: {
          user_id?: string
          workspace_state?: Record<string, unknown>
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}