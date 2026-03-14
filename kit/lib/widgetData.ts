import { Platform, NativeModules } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Contact } from "../types";
import { supabase } from "./supabase";

const WIDGET_KEY = "kit_widget_follow_up";

export async function updateWidgetData(contacts: Contact[]): Promise<void> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (sub?.plan !== "pro") return;

    const now = new Date();
    const toFollowUp = contacts.filter((c) => {
      if (!c.next_follow_up) return false;
      return new Date(c.next_follow_up) <= now;
    });

    const payload = {
      count: toFollowUp.length,
      contacts: toFollowUp.slice(0, 5).map((c) => ({
        id: c.id,
        full_name: c.full_name,
      })),
      updated_at: now.toISOString(),
    };

    const payloadStr = JSON.stringify(payload);
    await AsyncStorage.setItem(WIDGET_KEY, payloadStr);

    if (Platform.OS === "ios") {
      try {
        const KitWidget = NativeModules.KitWidget;
        if (KitWidget?.updateData) KitWidget.updateData(payloadStr);
      } catch {
        // Module natif non disponible (Expo Go ou prebuild pas fait)
      }
    }

    if (Platform.OS === "android") {
      try {
        const KitWidgetModule = NativeModules.KitWidgetModule;
        if (KitWidgetModule?.updateData) KitWidgetModule.updateData(payloadStr);
      } catch {
        // Module natif non disponible
      }
    }
  } catch {
    // Silencieux : widget optionnel
  }
}
