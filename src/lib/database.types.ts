/**
 * Tipe hasil generate dari skema Supabase.
 *
 * Masih kosong karena migrasi `0001_init.sql` baru dijalankan di Sesi 2.
 * Setelah skema berubah, berkas ini WAJIB dibuat ulang (CLAUDE.md butir 5):
 *
 *   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
 *
 * Jangan disunting tangan setelah proses generate berjalan.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: Record<never, never>
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}
