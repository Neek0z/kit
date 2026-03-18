import { useMemo, useState, useCallback } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Text, EmptyState } from "../../components/ui";
import { Header } from "../../components/layout";
import { AppointmentSheet } from "../../components/calendar/AppointmentSheet";
import { CalendarWeekView } from "../../components/calendar/CalendarWeekView";
import { CalendarMonthView } from "../../components/calendar/CalendarMonthView";
import { useAppointments, type AppointmentWithContact } from "../../hooks/useAppointments";
import { useContacts } from "../../hooks/useContacts";
import { useToast } from "../../lib/ToastContext";
import { useTheme } from "../../lib/theme";
import { dayKey, isSameDay } from "../../components/calendar/calendarUtils";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

type ViewMode = "week" | "month";

function formatSelectedDayLabel(d: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const d0 = new Date(d);
  d0.setHours(0, 0, 0, 0);
  if (d0.getTime() === today.getTime()) return "Aujourd'hui";
  if (d0.getTime() === tomorrow.getTime()) return "Demain";
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function CalendarScreen() {
  const theme = useTheme();
  const { showToast } = useToast();
  const { contacts } = useContacts();
  const {
    appointments,
    loading,
    refetch,
    createAppointment,
    updateAppointment,
    deleteAppointment,
  } = useAppointments({ withContactName: true });
  const list = appointments as AppointmentWithContact[];

  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());

  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [editingAppointment, setEditingAppointment] = useState<AppointmentWithContact | null>(null);
  const [preselectedContactId, setPreselectedContactId] = useState<string | null>(null);

  const appointmentsForSelectedDay = useMemo(() => {
    const key = dayKey(selectedDate);
    return list
      .filter((a) => dayKey(new Date(a.scheduled_at)) === key)
      .sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      );
  }, [list, selectedDate]);

  /** RDV groupés par jour (dayKey) pour la vue mois */
  const appointmentsByDay = useMemo(() => {
    const byDay: Record<string, AppointmentWithContact[]> = {};
    list.forEach((a) => {
      const key = dayKey(new Date(a.scheduled_at));
      if (!byDay[key]) byDay[key] = [];
      byDay[key].push(a);
    });
    Object.keys(byDay).forEach((key) => {
      byDay[key].sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      );
    });
    return byDay;
  }, [list]);

  const openCreate = useCallback((contactId?: string | null) => {
    setPreselectedContactId(contactId ?? null);
    setSheetMode("create");
    setEditingAppointment(null);
    setSheetVisible(true);
  }, []);

  const openEdit = useCallback((a: AppointmentWithContact) => {
    setPreselectedContactId(null);
    setSheetMode("edit");
    setEditingAppointment(a);
    setSheetVisible(true);
  }, []);

  const handleSelectDate = useCallback((date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    setSelectedDate(d);
    if (viewMode === "week") {
      setWeekAnchor(d);
    } else {
      setMonthAnchor(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [viewMode]);

  const handlePrevWeek = useCallback(() => {
    const prev = new Date(weekAnchor);
    prev.setDate(prev.getDate() - 7);
    setWeekAnchor(prev);
  }, [weekAnchor]);

  const handleNextWeek = useCallback(() => {
    const next = new Date(weekAnchor);
    next.setDate(next.getDate() + 7);
    setWeekAnchor(next);
  }, [weekAnchor]);

  const handlePrevMonth = useCallback(() => {
    const prev = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() - 1, 1);
    setMonthAnchor(prev);
  }, [monthAnchor]);

  const handleNextMonth = useCallback(() => {
    const next = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 1);
    setMonthAnchor(next);
  }, [monthAnchor]);

  const handleDelete = useCallback(
    (a: AppointmentWithContact) => {
      Alert.alert(
        "Supprimer le rendez-vous",
        "Ce rendez-vous sera supprimé.",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: async () => {
              const ok = await deleteAppointment(a.id);
              if (ok) {
                showToast("Rendez-vous supprimé");
                setSheetVisible(false);
              }
            },
          },
        ]
      );
    },
    [deleteAppointment, showToast]
  );

  const goToToday = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setSelectedDate(today);
    setWeekAnchor(new Date());
    setMonthAnchor(new Date());
  }, []);

  const isSelectedToday = isSameDay(selectedDate, new Date());

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Ligne décorative */}
      <View
        style={{
          height: 1,
          marginHorizontal: 32,
          backgroundColor: theme.primary,
          opacity: 0.25,
        }}
      />
      <Header
        title="Calendrier"
        rightAction={{
          icon: "plus" as FeatherName,
          onPress: () => openCreate(),
          accessibilityLabel: "Nouveau rendez-vous",
        }}
      />

      <View className="flex-1 min-h-0">
        {/* Toggle Semaine / Mois */}
        <View className="px-5 mb-3">
          <View className="flex-row rounded-xl bg-surface dark:bg-surface-dark border border-border dark:border-border-dark p-1">
            <TouchableOpacity
              onPress={() => {
                setViewMode("week");
                setWeekAnchor(selectedDate);
              }}
              className={`flex-1 py-2.5 rounded-lg items-center ${
                viewMode === "week" ? "bg-primary" : ""
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  viewMode === "week"
                    ? "text-onPrimary"
                    : "text-textMuted dark:text-textMuted-dark"
                }`}
              >
                Semaine
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setViewMode("month");
                setMonthAnchor(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
              }}
              className={`flex-1 py-2.5 rounded-lg items-center ${
                viewMode === "month" ? "bg-primary" : ""
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  viewMode === "month"
                    ? "text-onPrimary"
                    : "text-textMuted dark:text-textMuted-dark"
                }`}
              >
                Mois
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {viewMode === "week" ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refetch}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        >
          <CalendarWeekView
            weekAnchor={weekAnchor}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            onPrevWeek={handlePrevWeek}
            onNextWeek={handleNextWeek}
          />
          {!isSelectedToday && (
            <TouchableOpacity
              onPress={goToToday}
              className="mt-3 flex-row items-center justify-center gap-2 py-2"
            >
                <Feather name="circle" size={12} color={theme.primary} />
              <Text className="text-primary text-sm font-medium">
                Revenir à aujourd'hui
              </Text>
            </TouchableOpacity>
          )}
          <View className="mt-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text variant="muted" className="text-xs font-semibold uppercase tracking-wider capitalize">
                {formatSelectedDayLabel(selectedDate)}
              </Text>
              <TouchableOpacity onPress={() => openCreate()} className="flex-row items-center gap-1.5">
                <Feather name="plus" size={14} color="#6ee7b7" />
                <Text className="text-primary text-sm font-medium">RDV</Text>
              </TouchableOpacity>
            </View>
            {loading && list.length === 0 ? (
              <View className="py-8 items-center">
                  <ActivityIndicator color={theme.primary} />
              </View>
            ) : appointmentsForSelectedDay.length === 0 ? (
              <View className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl py-8 px-4 items-center">
                <Feather name="calendar" size={32} color={theme.textMuted} />
                  <Text variant="muted" className="text-sm mt-2 text-center">
                    Aucun rendez-vous ce jour-là
                  </Text>
                <TouchableOpacity onPress={() => openCreate()} className="mt-3 py-2 px-4 rounded-lg bg-primary/20">
                  <Text className="text-primary text-sm font-medium">Ajouter un RDV</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="gap-2">
                {appointmentsForSelectedDay.map((a) => {
                  const at = new Date(a.scheduled_at);
                  const contactName = (a as AppointmentWithContact).contacts?.full_name ?? "—";
                  return (
                    <TouchableOpacity
                      key={a.id}
                      onPress={() => openEdit(a)}
                      onLongPress={() => handleDelete(a)}
                      activeOpacity={0.7}
                      className="flex-row items-center gap-3 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl px-4 py-3"
                    >
                      <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
                        <Text className="text-primary text-xs font-bold">
                          {at.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold" numberOfLines={1}>{a.title || "Rendez-vous"}</Text>
                        <Text variant="muted" className="text-xs mt-0.5">{contactName}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          a.contact_id && router.push(`/(app)/contacts/${a.contact_id}`);
                        }}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        <Feather name="chevron-right" size={18} color="#64748b" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
        ) : (
          /* Vue mois : grille plein écran + bandeau RDV du jour en bas */
          <View className="flex-1 px-5 min-h-0">
            {!isSelectedToday && (
              <TouchableOpacity onPress={goToToday} className="flex-row items-center justify-center gap-2 py-2 mb-1">
                <Feather name="circle" size={12} color="#6ee7b7" />
                <Text className="text-primary text-sm font-medium">Revenir à aujourd'hui</Text>
              </TouchableOpacity>
            )}
            <View className="flex-1 min-h-0">
              <CalendarMonthView
                monthAnchor={monthAnchor}
                selectedDate={selectedDate}
                appointmentsByDay={appointmentsByDay}
                onSelectDate={handleSelectDate}
                onAppointmentPress={openEdit}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
              />
            </View>
            <View className="py-3 border-t border-border dark:border-border-dark" style={{ maxHeight: 200 }}>
              <View className="flex-row items-center justify-between mb-2">
                <Text variant="muted" className="text-xs font-semibold uppercase tracking-wider capitalize">
                  {formatSelectedDayLabel(selectedDate)}
                </Text>
                <TouchableOpacity onPress={() => openCreate()} className="flex-row items-center gap-1.5">
                  <Feather name="plus" size={14} color="#6ee7b7" />
                  <Text className="text-primary text-sm font-medium">RDV</Text>
                </TouchableOpacity>
              </View>
              {appointmentsForSelectedDay.length === 0 ? (
                <Text variant="muted" className="text-sm">Aucun RDV ce jour</Text>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                  {appointmentsForSelectedDay.map((a) => {
                    const at = new Date(a.scheduled_at);
                    const contactName = (a as AppointmentWithContact).contacts?.full_name ?? "—";
                    return (
                      <TouchableOpacity
                        key={a.id}
                        onPress={() => openEdit(a)}
                        onLongPress={() => handleDelete(a)}
                        className="flex-row items-center gap-2 py-2 border-b border-border/50 dark:border-border-dark/50"
                      >
                        <Text className="text-primary text-xs font-semibold w-10">
                          {at.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </Text>
                        <View className="flex-1">
                          <Text className="text-sm font-medium" numberOfLines={1}>{a.title || "Rendez-vous"}</Text>
                          <Text variant="muted" className="text-xs" numberOfLines={1}>{contactName}</Text>
                        </View>
                        <Feather name="chevron-right" size={14} color="#64748b" />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          </View>
        )}
      </View>

      <AppointmentSheet
        visible={sheetVisible}
        onClose={() => {
          setSheetVisible(false);
          setEditingAppointment(null);
        }}
        mode={sheetMode}
        contacts={contacts}
        preselectedContactId={preselectedContactId ?? editingAppointment?.contact_id}
        appointment={editingAppointment}
        onSubmitCreate={async (params) => {
          const created = await createAppointment(params);
          if (created) showToast("Rendez-vous créé");
        }}
        onSubmitEdit={async (id, params) => {
          const ok = await updateAppointment(id, params);
          if (ok) showToast("Rendez-vous mis à jour");
          return ok;
        }}
        onDelete={async (appointmentId) => {
          const ok = await deleteAppointment(appointmentId);
          if (ok) {
            showToast("Rendez-vous supprimé");
            setSheetVisible(false);
            setEditingAppointment(null);
          }
        }}
      />
    </SafeAreaView>
  );
}
