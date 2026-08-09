/**
 * Tipe hasil generate dari skema Supabase — JANGAN disunting tangan.
 *
 * Dibuat ulang setiap kali skema berubah (CLAUDE.md butir 5):
 *
 *   npx supabase gen types typescript \
 *     --project-id wwrzgewfkvxqcwaguivv > src/lib/database.types.ts
 *
 * Terakhir dibuat setelah migrasi 0003, lalu ditambah dua RPC dari
 * migrasi 0005 (`cari_item_mirip`, `impor_master_item`). Jalankan perintah
 * di atas begitu Supabase CLI sudah punya akses token, agar berkas ini
 * kembali sepenuhnya hasil generate.
 */

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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      audit_harga: {
        Row: {
          diubah_oleh: string | null
          diubah_pada: string
          harga_baru: number | null
          harga_lama: number | null
          id: number
          id_detail: string | null
          kode_item: string | null
        }
        Insert: {
          diubah_oleh?: string | null
          diubah_pada?: string
          harga_baru?: number | null
          harga_lama?: number | null
          id?: number
          id_detail?: string | null
          kode_item?: string | null
        }
        Update: {
          diubah_oleh?: string | null
          diubah_pada?: string
          harga_baru?: number | null
          harga_lama?: number | null
          id?: number
          id_detail?: string | null
          kode_item?: string | null
        }
        Relationships: []
      }
      master_item: {
        Row: {
          aktif: boolean
          dibuat_pada: string
          kategori: Database["public"]["Enums"]["kategori_enum"]
          kode_item: string
          nama_baku: string
          satuan_baku: string
          spesifikasi: string | null
          sub_kategori: string | null
        }
        Insert: {
          aktif?: boolean
          dibuat_pada?: string
          kategori: Database["public"]["Enums"]["kategori_enum"]
          kode_item: string
          nama_baku: string
          satuan_baku: string
          spesifikasi?: string | null
          sub_kategori?: string | null
        }
        Update: {
          aktif?: boolean
          dibuat_pada?: string
          kategori?: Database["public"]["Enums"]["kategori_enum"]
          kode_item?: string
          nama_baku?: string
          satuan_baku?: string
          spesifikasi?: string | null
          sub_kategori?: string | null
        }
        Relationships: []
      }
      master_proyek: {
        Row: {
          kode_proyek: string
          lokasi: string | null
          nama_proyek: string
          status: string
        }
        Insert: {
          kode_proyek: string
          lokasi?: string | null
          nama_proyek: string
          status?: string
        }
        Update: {
          kode_proyek?: string
          lokasi?: string | null
          nama_proyek?: string
          status?: string
        }
        Relationships: []
      }
      master_toko: {
        Row: {
          aktif: boolean
          jenis: string
          kode_toko: string
          kontak: string | null
          kota: string | null
          nama_toko: string
          pkp: boolean
          termin: string | null
        }
        Insert: {
          aktif?: boolean
          jenis?: string
          kode_toko: string
          kontak?: string | null
          kota?: string | null
          nama_toko: string
          pkp?: boolean
          termin?: string | null
        }
        Update: {
          aktif?: boolean
          jenis?: string
          kode_toko?: string
          kontak?: string | null
          kota?: string | null
          nama_toko?: string
          pkp?: boolean
          termin?: string | null
        }
        Relationships: []
      }
      nota: {
        Row: {
          catatan: string | null
          diinput_oleh: string | null
          diinput_pada: string
          diubah_pada: string
          foto_url: string | null
          id_nota: string
          kode_proyek: string
          kode_toko: string
          metode_bayar: string
          no_nota_toko: string | null
          status: string
          tanggal: string
          total_nota: number
        }
        Insert: {
          catatan?: string | null
          diinput_oleh?: string | null
          diinput_pada?: string
          diubah_pada?: string
          foto_url?: string | null
          id_nota?: string
          kode_proyek: string
          kode_toko: string
          metode_bayar?: string
          no_nota_toko?: string | null
          status?: string
          tanggal: string
          total_nota: number
        }
        Update: {
          catatan?: string | null
          diinput_oleh?: string | null
          diinput_pada?: string
          diubah_pada?: string
          foto_url?: string | null
          id_nota?: string
          kode_proyek?: string
          kode_toko?: string
          metode_bayar?: string
          no_nota_toko?: string | null
          status?: string
          tanggal?: string
          total_nota?: number
        }
        Relationships: [
          {
            foreignKeyName: "nota_kode_proyek_fkey"
            columns: ["kode_proyek"]
            isOneToOne: false
            referencedRelation: "master_proyek"
            referencedColumns: ["kode_proyek"]
          },
          {
            foreignKeyName: "nota_kode_toko_fkey"
            columns: ["kode_toko"]
            isOneToOne: false
            referencedRelation: "master_toko"
            referencedColumns: ["kode_toko"]
          },
        ]
      }
      nota_detail: {
        Row: {
          catatan: string | null
          harga_satuan: number
          id_detail: string
          id_nota: string
          kode_item: string
          qty: number
          subtotal: number | null
          urutan: number
        }
        Insert: {
          catatan?: string | null
          harga_satuan: number
          id_detail?: string
          id_nota: string
          kode_item: string
          qty: number
          subtotal?: number | null
          urutan?: number
        }
        Update: {
          catatan?: string | null
          harga_satuan?: number
          id_detail?: string
          id_nota?: string
          kode_item?: string
          qty?: number
          subtotal?: number | null
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "nota_detail_id_nota_fkey"
            columns: ["id_nota"]
            isOneToOne: false
            referencedRelation: "nota"
            referencedColumns: ["id_nota"]
          },
          {
            foreignKeyName: "nota_detail_id_nota_fkey"
            columns: ["id_nota"]
            isOneToOne: false
            referencedRelation: "v_nota_ringkas"
            referencedColumns: ["id_nota"]
          },
          {
            foreignKeyName: "nota_detail_id_nota_fkey"
            columns: ["id_nota"]
            isOneToOne: false
            referencedRelation: "v_riwayat_harga"
            referencedColumns: ["id_nota"]
          },
          {
            foreignKeyName: "nota_detail_kode_item_fkey"
            columns: ["kode_item"]
            isOneToOne: false
            referencedRelation: "master_item"
            referencedColumns: ["kode_item"]
          },
        ]
      }
      profil: {
        Row: {
          aktif: boolean
          id: string
          nama: string
          peran: Database["public"]["Enums"]["peran_enum"]
        }
        Insert: {
          aktif?: boolean
          id: string
          nama: string
          peran?: Database["public"]["Enums"]["peran_enum"]
        }
        Update: {
          aktif?: boolean
          id?: string
          nama?: string
          peran?: Database["public"]["Enums"]["peran_enum"]
        }
        Relationships: []
      }
    }
    Views: {
      v_harga_terakhir: {
        Row: {
          harga_satuan: number | null
          kode_item: string | null
          kode_toko: string | null
          nama_baku: string | null
          nama_toko: string | null
          satuan_baku: string | null
          tanggal: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nota_detail_kode_item_fkey"
            columns: ["kode_item"]
            isOneToOne: false
            referencedRelation: "master_item"
            referencedColumns: ["kode_item"]
          },
          {
            foreignKeyName: "nota_kode_toko_fkey"
            columns: ["kode_toko"]
            isOneToOne: false
            referencedRelation: "master_toko"
            referencedColumns: ["kode_toko"]
          },
        ]
      }
      v_nota_ringkas: {
        Row: {
          diinput_oleh: string | null
          foto_url: string | null
          id_nota: string | null
          jml_baris: number | null
          kode_proyek: string | null
          kode_toko: string | null
          metode_bayar: string | null
          no_nota_toko: string | null
          selisih: number | null
          status: string | null
          tanggal: string | null
          total_detail: number | null
          total_nota: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nota_kode_proyek_fkey"
            columns: ["kode_proyek"]
            isOneToOne: false
            referencedRelation: "master_proyek"
            referencedColumns: ["kode_proyek"]
          },
          {
            foreignKeyName: "nota_kode_toko_fkey"
            columns: ["kode_toko"]
            isOneToOne: false
            referencedRelation: "master_toko"
            referencedColumns: ["kode_toko"]
          },
        ]
      }
      v_ringkas_harga: {
        Row: {
          harga_rata2: number | null
          harga_terendah: number | null
          harga_tertinggi: number | null
          jml_toko: number | null
          kode_item: string | null
          nama_baku: string | null
          pembelian_terakhir: string | null
          satuan_baku: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nota_detail_kode_item_fkey"
            columns: ["kode_item"]
            isOneToOne: false
            referencedRelation: "master_item"
            referencedColumns: ["kode_item"]
          },
        ]
      }
      v_riwayat_harga: {
        Row: {
          foto_url: string | null
          harga_satuan: number | null
          id_detail: string | null
          id_nota: string | null
          kategori: Database["public"]["Enums"]["kategori_enum"] | null
          kode_item: string | null
          kode_proyek: string | null
          kode_toko: string | null
          nama_baku: string | null
          nama_proyek: string | null
          nama_toko: string | null
          no_nota_toko: string | null
          pkp: boolean | null
          qty: number | null
          satuan_baku: string | null
          sub_kategori: string | null
          tanggal: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nota_detail_kode_item_fkey"
            columns: ["kode_item"]
            isOneToOne: false
            referencedRelation: "master_item"
            referencedColumns: ["kode_item"]
          },
          {
            foreignKeyName: "nota_kode_proyek_fkey"
            columns: ["kode_proyek"]
            isOneToOne: false
            referencedRelation: "master_proyek"
            referencedColumns: ["kode_proyek"]
          },
          {
            foreignKeyName: "nota_kode_toko_fkey"
            columns: ["kode_toko"]
            isOneToOne: false
            referencedRelation: "master_toko"
            referencedColumns: ["kode_toko"]
          },
        ]
      }
    }
    Functions: {
      cari_item: {
        Args: { p_kata: string; p_limit?: number }
        Returns: {
          kategori: Database["public"]["Enums"]["kategori_enum"]
          kode_item: string
          nama_baku: string
          satuan_baku: string
          skor: number
        }[]
      }
      cari_item_mirip: {
        Args: { p_batas?: number; p_nama: string }
        Returns: {
          aktif: boolean
          kategori: Database["public"]["Enums"]["kategori_enum"]
          kode_item: string
          nama_baku: string
          satuan_baku: string
          skor: number
        }[]
      }
      impor_master_item: {
        Args: { p_baris: Json }
        Returns: Json
      }
      peran_saya: {
        Args: never
        Returns: Database["public"]["Enums"]["peran_enum"]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      simpan_nota: { Args: { p_detail: Json; p_header: Json }; Returns: string }
      ubah_nota: {
        Args: { p_detail: Json; p_header: Json; p_id: string }
        Returns: string
      }
    }
    Enums: {
      kategori_enum: "MATERIAL" | "ALAT" | "OPERASIONAL" | "LAIN-LAIN"
      peran_enum: "admin" | "finance" | "logistik" | "engineering" | "manajer"
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
      kategori_enum: ["MATERIAL", "ALAT", "OPERASIONAL", "LAIN-LAIN"],
      peran_enum: ["admin", "finance", "logistik", "engineering", "manajer"],
    },
  },
} as const
