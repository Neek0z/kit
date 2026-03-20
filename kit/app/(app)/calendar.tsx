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
import { Text } from "../../components/ui";
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
      {/* Header compact + toggle pill */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 8,
        }}
      >
        <Text
          style={{
            fontSize: 26,
            fontWeight: "800",
            color: theme.textPrimary,
            letterSpacing: -1,
          }}
        >
          Calendrier
        </Text>

        <View
          style={{
            flexDirection: "row",
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 100,
            padding: 3,
            alignSelf: "flex-start",
          }}
        >
          {(["Semaine", "Mois"] as const).map((mode) => {
            const key: ViewMode = mode === "Semaine" ? "week" : "month";
            const isActive = viewMode === key;
            return (
              <TouchableOpacity
                key={mode}
                onPress={() => {
                  setViewMode(key);
                  if (key === "week") setWeekAnchor(selectedDate);
                  if (key === "month")
                    setMonthAnchor(
                      new Date(
                        selectedDate.getFullYear(),
                        selectedDate.getMonth(),
                        1
                      )
                    );
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 100,
                  backgroundColor: isActive ? theme.primary : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: isActive
                      ? theme.isDark
                        ? "#0f172a"
                        : "#ffffff"
                      : theme.textMuted,
                  }}
                >
                  {mode}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View className="flex-1 min-h-0">
        {/* Contenu */}

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
            appointmentsByDay={appointmentsByDay}
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
          <View style={{ marginTop: 24 }}>
            {/* Header agenda */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: theme.textPrimary,
                  }}
                >
                  {isSelectedToday
                    ? "Aujourd'hui"
                    : selectedDate.toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                </Text>

                {appointmentsForSelectedDay.length > 0 && (
                  <Text
                    style={{
                      fontSize: 12,
                      color: theme.textMuted,
                      marginTop: 1,
                    }}
                  >
                    {appointmentsForSelectedDay.length} rendez-vous
                  </Text>
                )}
              </View>
            </View>

            {loading && list.length === 0 ? (
              <View style={{ paddingVertical: 24, alignItems: "center" }}>
                <ActivityIndicator color={theme.primary} />
              </View>
            ) : appointmentsForSelectedDay.length === 0 ? (
              <View
                style={{
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 16,
                  padding: 20,
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: theme.primaryBg,
                    borderWidth: 1,
                    borderColor: theme.primaryBorder,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="calendar" size={20} color={theme.primary} />
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: theme.textPrimary,
                    textAlign: "center",
                  }}
                >
                  Aucun RDV ce jour
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: theme.textMuted,
                    textAlign: "center",
                  }}
                >
                  Appuie sur + pour planifier un rendez-vous
                </Text>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {appointmentsForSelectedDay.map((a) => {
                  const at = new Date(a.scheduled_at);
                  const contactName =
                    (a as AppointmentWithContact).contacts?.full_name ?? "";

                  return (
                    <TouchableOpacity
                      key={a.id}
                      onPress={() => openEdit(a)}
                      onLongPress={() => handleDelete(a)}
                      activeOpacity={0.7}
                      style={{
                        backgroundColor: theme.surface,
                        borderWidth: 1,
                        borderColor: theme.border,
                        borderRadius: 16,
                        padding: 14,
                        flexDirection: "row",
                        gap: 12,
                      }}
                    >
                      <View
                        style={{
                          alignItems: "center",
                          minWidth: 44,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "700",
                            color: theme.primary,
                          }}
                        >
                          {at.toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </View>

                      <View
                        style={{
                          width: 3,
                          borderRadius: 2,
                          backgroundColor: theme.primary,
                          alignSelf: "stretch",
                        }}
                      />

                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: theme.textPrimary,
                          }}
                          numberOfLines={1}
                        >
                          {a.title || "Rendez-vous"}
                        </Text>

                        {contactName ? (
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 5,
                              marginTop: 4,
                            }}
                          >
                            <Feather
                              name="user"
                              size={11}
                              color={theme.textMuted}
                            />
                            <Text
                              style={{
                                fontSize: 12,
                                color: theme.textMuted,
                              }}
                              numberOfLines={1}
                            >
                              {contactName}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <Feather
                        name="chevron-right"
                        size={16}
                        color={theme.textHint}
                      />
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
            <View
              style={{
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: theme.border,
                maxHeight: 200,
                paddingHorizontal: 20,
                paddingBottom: 12,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: theme.textPrimary,
                    }}
                  >
                    {isSelectedToday
                      ? "Aujourd'hui"
                      : selectedDate.toLocaleDateString("fr-FR", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                  </Text>
                  {appointmentsForSelectedDay.length > 0 && (
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.textMuted,
                        marginTop: 1,
                      }}
                    >
                      {appointmentsForSelectedDay.length} rendez-vous
                    </Text>
                  )}
                </View>
              </View>

              {appointmentsForSelectedDay.length === 0 ? (
                <View
                  style={{
                    backgroundColor: theme.surface,
                    borderWidth: 1,
                    borderColor: theme.border,
                    borderRadius: 16,
                    padding: 16,
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: theme.primaryBg,
                      borderWidth: 1,
                      borderColor: theme.primaryBorder,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="calendar" size={18} color={theme.primary} />
                  </View>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: theme.textPrimary,
                      textAlign: "center",
                    }}
                  >
                    Aucun RDV ce jour
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: theme.textMuted,
                      textAlign: "center",
                    }}
                  >
                    Appuie sur + pour planifier un rendez-vous
                  </Text>
                </View>
              ) : (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  <View style={{ gap: 8, paddingBottom: 8 }}>
                    {appointmentsForSelectedDay.map((a) => {
                      const at = new Date(a.scheduled_at);
                      const contactName =
                        (a as AppointmentWithContact).contacts?.full_name ?? "";

                      return (
                        <TouchableOpacity
                          key={a.id}
                          onPress={() => openEdit(a)}
                          onLongPress={() => handleDelete(a)}
                          activeOpacity={0.7}
                          style={{
                            backgroundColor: theme.surface,
                            borderWidth: 1,
                            borderColor: theme.border,
                            borderRadius: 16,
                            padding: 14,
                            flexDirection: "row",
                            gap: 12,
                          }}
                        >
                          <View
                            style={{
                              alignItems: "center",
                              minWidth: 44,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: "700",
                                color: theme.primary,
                              }}
                            >
                              {at.toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Text>
                          </View>

                          <View
                            style={{
                              width: 3,
                              borderRadius: 2,
                              backgroundColor: theme.primary,
                              alignSelf: "stretch",
                            }}
                          />

                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: "600",
                                color: theme.textPrimary,
                              }}
                              numberOfLines={1}
                            >
                              {a.title || "Rendez-vous"}
                            </Text>
                            {contactName ? (
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: 5,
                                  marginTop: 4,
                                }}
                              >
                                <Feather
                                  name="user"
                                  size={11}
                                  color={theme.textMuted}
                                />
                                <Text
                                  style={{
                                    fontSize: 12,
                                    color: theme.textMuted,
                                  }}
                                  numberOfLines={1}
                                >
                                  {contactName}
                                </Text>
                              </View>
                            ) : null}
                          </View>

                          <Feather
                            name="chevron-right"
                            size={16}
                            color={theme.textHint}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        )}
      </View>

      {/* FAB flottant : Nouveau RDV */}
      <TouchableOpacity
        onPress={() => openCreate()}
        style={{
          position: "absolute",
          bottom: 24,
          right: 20,
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: theme.primary,
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          shadowColor: theme.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
        accessibilityLabel="Nouveau rendez-vous"
      >
        <Feather
          name="plus"
          size={24}
          color={theme.isDark ? "#0f172a" : "#ffffff"}
        />
      </TouchableOpacity>

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
