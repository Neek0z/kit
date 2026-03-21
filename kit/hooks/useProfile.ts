import { useState, useEffect, useCallback } from "react";
import { readAsStringAsync, EncodingType } from "expo-file-system/legacy";
import { supabase } from "../lib/supabase";
import type { UserProfile } from "../types";
import { useAuthContext } from "../lib/AuthContext";

interface UseProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  fetchProfile: () => Promise<void>;
  updateProfile: (
    data: Partial<Pick<UserProfile, "full_name" | "avatar_url" | "expo_push_token">>
  ) => Promise<{ ok: boolean; error?: string }>;
  uploadAvatar: (uri: string) => Promise<{ url: string | null; error?: string }>;
}

export function useProfile(): UseProfileReturn {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Erreur chargement profil :", error.message);
    }
    setProfile(data as UserProfile | null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (
    data: Partial<Pick<UserProfile, "full_name" | "avatar_url" | "expo_push_token">>
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!user) return { ok: false, error: "Non connecté" };

    if (data.avatar_url != null) {
      const u = data.avatar_url;
      if (u.startsWith("file://") || u.startsWith("content://")) {
        return { ok: false, error: "URL invalide (fichier local). Réessaie." };
      }
      if (!u.startsWith("https://")) {
        return { ok: false, error: "L’URL de l’avatar doit être en https." };
      }
    }

    const updated_at = new Date().toISOString();
    const payload = { ...data, updated_at };
    const { error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", user.id)
      .select()
      .single();

    if (error) return { ok: false, error: error.message };

    setProfile((prev) => (prev ? { ...prev, ...data, updated_at } : null));
    return { ok: true };
  };

  const uploadAvatar = async (
    uri: string
  ): Promise<{ url: string | null; error?: string }> => {
    if (!user) return { url: null, error: "Non connecté" };

    try {
      const base64 = await readAsStringAsync(uri, {
        encoding: EncodingType.Base64,
      });
      // Toujours le même fichier par user : on écrase à chaque fois (un seul fichier dans Storage)
      const path = `${user.id}/avatar.jpg`;
      const contentType = "image/jpeg";

      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, bytes, { upsert: true, contentType });

      if (error) {
        return { url: null, error: error.message };
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      return { url: data.publicUrl };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur inconnue";
      return { url: null, error: message };
    }
  };

  return { profile, loading, fetchProfile, updateProfile, uploadAvatar };
}
