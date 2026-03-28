import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mpqasqznmxejmaxcpolr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wcWFzcXpubXhlam1heGNwb2xyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MTgyNTgsImV4cCI6MjA4NTE5NDI1OH0.nVE8IWiCikPO4s7UU36HgSqfddtr_YAeWnAAWUZAiyE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
