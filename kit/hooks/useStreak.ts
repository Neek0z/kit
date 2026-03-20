import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../lib/AuthContext";

interface StreakData {
  currentStreak: number;
  weekDays: boolean[]; // 7 jours, lundi à dimanche
  lastActivityDate: string | null;
}

const DEFAULT_STREAK: StreakData = {
  currentStreak: 0,
  weekDays: [false, false, false, false, false, false, false],
  lastActivityDate: null,
};

export function useStreak() {
  const { user } = useAuthContext();
  const [streak, setStreak] = useState<StreakData>(DEFAULT_STREAK);

  const cacheKey = useMemo(() => {
    if (!user) return null;
    return `streak:${user.id}`;
  }, [user]);

  const loadStreak = useCallback(async () => {
    if (!user) return;

    if (cacheKey) {
      try {
        const raw = await AsyncStorage.getItem(cacheKey);
        if (raw) {
          const cached = JSON.parse(raw) as StreakData;
          if (
            typeof cached?.currentStreak === "number" &&
            Array.isArray(cached?.weekDays) &&
            cached.weekDays.length === 7
          ) {
            setStreak(cached);
          }
        }
      } catch {
        // Cache non critique: on continue avec le calcul.
      }
    }

    // Récupérer les interactions des 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data } = await supabase
      .from("interactions")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    const interactions = (data ?? []) as Array<{ created_at: string }>;
    if (interactions.length === 0) {
      setStreak(DEFAULT_STREAK);
      return;
    }

    // Calculer les jours uniques avec activité
    const activeDays = new Set(
      interactions.map((i) => new Date(i.created_at).toDateString())
    );

    // Calculer le streak actuel (en remontant depuis aujourd'hui)
    let currentStreak = 0;
    const today = new Date();
    let checkDate = new Date(today);

    while (activeDays.has(checkDate.toDateString())) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Si pas d'activité aujourd'hui, vérifier hier
    if (currentStreak === 0) {
      checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - 1);
      while (activeDays.has(checkDate.toDateString())) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    // Calculer les 7 jours de la semaine en cours (lundi à dimanche)
    const weekDays: boolean[] = [];
    const monday = new Date(today);
    const dayOfWeek = today.getDay(); // 0 = dimanche
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    monday.setDate(today.getDate() - daysFromMonday);

    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      weekDays.push(activeDays.has(day.toDateString()));
    }

    const lastActivityDate = interactions[0]?.created_at ?? null;

    const next: StreakData = { currentStreak, weekDays, lastActivityDate };
    setStreak(next);

    if (cacheKey) {
      try {
        await AsyncStorage.setItem(cacheKey, JSON.stringify(next));
      } catch {
        // Ignore cache write errors.
      }
    }
  }, [cacheKey, user]);

  useEffect(() => {
    if (!user) return;
    loadStreak();
  }, [loadStreak, user]);

  return { ...streak, reload: loadStreak };
}

