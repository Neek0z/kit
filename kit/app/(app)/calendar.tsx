import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ScrollView,
  Text as RNText,
  StyleSheet,
  InteractionManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { AppointmentSheet } from "../../components/calendar/AppointmentSheet";
import {
  useAppointments,
  type AppointmentWithContact,
} from "../../hooks/useAppointments";
import { useContacts } from "../../hooks/useContacts";
import { useToast } from "../../lib/ToastContext";
import { useTheme, screenTitleTextStyle } from "../../lib/theme";
import {
  getStartOfMonth,
  getMonthGrid,
  isSameDay,
  isToday as isTodayFn,
  isCurrentMonth,
  dayKey,
} from "../../components/calendar/calendarUtils";

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0h–23h
const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

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

  const agendaScrollRef = useRef<ScrollView>(null);
  const dayHeaderHeightRef = useRef(0);
  const firstApptRowYRef = useRef<number | null>(null);

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [monthAnchor, setMonthAnchor] = useState(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [editingAppointment, setEditingAppointment] =
    useState<AppointmentWithContact | null>(null);
  const [preselectedContactId, setPreselectedContactId] = useState<
    string | null
  >(null);

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
          new Date(a.scheduled_at).getTime() -
          new Date(b.scheduled_at).getTime()
      );
    });
    return byDay;
  }, [list]);

  const appointmentsForSelectedDay = useMemo(() => {
    const key = dayKey(selectedDate);
    return appointmentsByDay[key] ?? [];
  }, [appointmentsByDay, selectedDate]);

  const firstApptHour = useMemo(() => {
    if (appointmentsForSelectedDay.length === 0) return null;
    return new Date(
      appointmentsForSelectedDay[0].scheduled_at
    ).getHours();
  }, [appointmentsForSelectedDay]);

  const scrollAgendaToFirstAppointment = useCallback(() => {
    const headerH = dayHeaderHeightRef.current;
    const rowY = firstApptRowYRef.current;
    if (
      appointmentsForSelectedDay.length === 0 ||
      firstApptHour === null ||
      rowY == null ||
      headerH <= 0
    ) {
      return;
    }
    agendaScrollRef.current?.scrollTo({
      y: Math.max(0, headerH + rowY - 20),
      animated: true,
    });
  }, [appointmentsForSelectedDay.length, firstApptHour]);

  useEffect(() => {
    firstApptRowYRef.current = null;
  }, [selectedDate.getTime()]);

  useEffect(() => {
    if (appointmentsForSelectedDay.length === 0) {
      agendaScrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [selectedDate.getTime(), appointmentsForSelectedDay.length]);

  const openCreate = useCallback(() => {
    setPreselectedContactId(null);
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

  const handleSelectDate = useCallback((date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    setSelectedDate(d);
  }, []);

  const handlePrevMonth = useCallback(() => {
    setMonthAnchor(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  }, []);

  const handleNextMonth = useCallback(() => {
    setMonthAnchor(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  }, []);

  const goToToday = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setSelectedDate(today);
    setMonthAnchor(new Date(today.getFullYear(), today.getMonth(), 1));
  }, []);

  const selectedIsToday = isTodayFn(selectedDate);
  const monthStart = getStartOfMonth(monthAnchor);
  const grid = getMonthGrid(monthStart);

  if (loading && list.length === 0) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header */}
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
        <RNText style={screenTitleTextStyle(theme)}>Calendrier</RNText>
        {!selectedIsToday && (
          <TouchableOpacity
            onPress={goToToday}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 100,
              backgroundColor: `${theme.primary}15`,
            }}
          >
            <RNText
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: theme.primary,
              }}
            >
              Aujourd'hui
            </RNText>
          </TouchableOpacity>
        )}
      </View>

      {/* Navigation mois */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingBottom: 10,
        }}
      >
        <TouchableOpacity onPress={handlePrevMonth} style={{ padding: 4 }}>
          <Feather
            name="chevron-left"
            size={22}
            color={theme.textPrimary}
          />
        </TouchableOpacity>
        <RNText
          style={{
            fontSize: 17,
            fontWeight: "700",
            color: theme.textPrimary,
            textTransform: "capitalize",
          }}
        >
          {monthStart.toLocaleDateString("fr-FR", {
            month: "long",
            year: "numeric",
          })}
        </RNText>
        <TouchableOpacity onPress={handleNextMonth} style={{ padding: 4 }}>
          <Feather
            name="chevron-right"
            size={22}
            color={theme.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Grille mois compacte */}
      <View style={{ paddingHorizontal: 16 }}>
        {/* Jours de la semaine */}
        <View style={{ flexDirection: "row", marginBottom: 2 }}>
          {WEEKDAY_LABELS.map((d) => (
            <RNText
              key={d}
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 11,
                fontWeight: "600",
                color: theme.textHint,
              }}
            >
              {d}
            </RNText>
          ))}
        </View>

        {/* Semaines */}
        {grid.map((week, wi) => (
          <View key={wi} style={{ flexDirection: "row", marginBottom: 0 }}>
            {week.map((day, di) => {
              const today = isTodayFn(day);
              const selected = isSameDay(day, selectedDate);
              const inMonth = isCurrentMonth(day, monthStart);
              const key = dayKey(day);
              const hasAppts = (appointmentsByDay[key]?.length ?? 0) > 0;

              return (
                <TouchableOpacity
                  key={di}
                  onPress={() => handleSelectDate(day)}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: 1,
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: selected
                        ? theme.primary
                        : today
                          ? `${theme.primary}20`
                          : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <RNText
                      style={{
                        fontSize: 13,
                        fontWeight: today || selected ? "700" : "400",
                        color: selected
                          ? "#fff"
                          : today
                            ? theme.primary
                            : inMonth
                              ? theme.textPrimary
                              : theme.textHint,
                      }}
                    >
                      {day.getDate()}
                    </RNText>
                  </View>
                  {/* Point indicateur RDV */}
                  <View style={{ height: 3, marginTop: 0 }}>
                    {hasAppts && !selected && (
                      <View
                        style={{
                          width: 3,
                          height: 3,
                          borderRadius: 1.5,
                          backgroundColor: theme.primary,
                        }}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Séparateur (trait fin) */}
      <View
        style={{
          height: StyleSheet.hairlineWidth,
          backgroundColor: theme.border,
          marginHorizontal: 20,
          marginVertical: 6,
        }}
      />

      {/* Vue agenda scrollable */}
      <ScrollView
        ref={agendaScrollRef}
        style={{ flex: 1 }}
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
        <View style={{ paddingHorizontal: 20, paddingBottom: 100 }}>
          {/* Header du jour sélectionné */}
          <View
            style={{ paddingVertical: 10 }}
            onLayout={(e) => {
              dayHeaderHeightRef.current = e.nativeEvent.layout.height;
              if (firstApptHour !== null && appointmentsForSelectedDay.length > 0) {
                InteractionManager.runAfterInteractions(() => {
                  scrollAgendaToFirstAppointment();
                });
              }
            }}
          >
            <RNText
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: theme.textPrimary,
                textTransform: "capitalize",
              }}
            >
              {selectedIsToday
                ? "Aujourd'hui"
                : selectedDate.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
            </RNText>
            {appointmentsForSelectedDay.length > 0 && (
              <RNText
                style={{
                  fontSize: 12,
                  color: theme.textMuted,
                  marginTop: 2,
                }}
              >
                {appointmentsForSelectedDay.length} rendez-vous
              </RNText>
            )}
          </View>

          {/* État vide */}
          {appointmentsForSelectedDay.length === 0 && (
            <View
              style={{
                alignItems: "center",
                paddingVertical: 32,
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: `${theme.primary}15`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name="calendar" size={22} color={theme.primary} />
              </View>
              <RNText
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: theme.textPrimary,
                }}
              >
                Aucun rendez-vous
              </RNText>
              <RNText
                style={{ fontSize: 13, color: theme.textMuted }}
              >
                Appuie sur + pour en ajouter un
              </RNText>
            </View>
          )}

          {/* Timeline avec créneaux horaires */}
          {appointmentsForSelectedDay.length > 0 && (
            <View style={{ position: "relative" }}>
              {HOURS.map((hour) => {
                const hourAppts = appointmentsForSelectedDay.filter((apt) => {
                  const aptHour = new Date(apt.scheduled_at).getHours();
                  return aptHour === hour;
                });

                const isCurrentHour =
                  selectedIsToday && new Date().getHours() === hour;

                return (
                  <View
                    key={hour}
                    style={{
                      flexDirection: "row",
                      minHeight: 48,
                      alignItems: "flex-start",
                    }}
                    onLayout={(e) => {
                      if (hour !== firstApptHour) return;
                      firstApptRowYRef.current = e.nativeEvent.layout.y;
                      InteractionManager.runAfterInteractions(() => {
                        scrollAgendaToFirstAppointment();
                      });
                    }}
                  >
                    {/* Heure à gauche */}
                    <View style={{ width: 44, paddingTop: 2 }}>
                      <RNText
                        style={{
                          fontSize: 12,
                          fontWeight: "500",
                          color: isCurrentHour
                            ? theme.primary
                            : theme.textHint,
                        }}
                      >
                        {`${String(hour).padStart(2, "0")}h`}
                      </RNText>
                    </View>

                    {/* Ligne verticale (hairline) */}
                    <View
                      style={{
                        width: StyleSheet.hairlineWidth,
                        backgroundColor: isCurrentHour
                          ? theme.primary
                          : theme.border,
                        marginRight: 10,
                        marginTop: 6,
                        alignSelf: "stretch",
                      }}
                    />

                    {/* RDV sur ce créneau */}
                    <View style={{ flex: 1, gap: 6, paddingVertical: 4 }}>
                      {hourAppts.map((apt) => {
                        const startTime = new Date(apt.scheduled_at);
                        const contactName =
                          apt.contacts?.full_name ?? "";
                        const endTime = new Date(
                          startTime.getTime() + 60 * 60 * 1000
                        );

                        return (
                          <TouchableOpacity
                            key={apt.id}
                            onPress={() => openEdit(apt)}
                            onLongPress={() => handleDelete(apt)}
                            activeOpacity={0.7}
                            style={{
                              backgroundColor: `${theme.primary}15`,
                              borderRadius: 14,
                              padding: 12,
                              borderLeftWidth: 3,
                              borderLeftColor: theme.primary,
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <RNText
                                style={{
                                  fontSize: 14,
                                  fontWeight: "700",
                                  color: theme.textPrimary,
                                }}
                                numberOfLines={1}
                              >
                                {contactName ||
                                  apt.title ||
                                  "Rendez-vous"}
                              </RNText>
                              <RNText
                                style={{
                                  fontSize: 12,
                                  color: theme.textMuted,
                                  marginTop: 2,
                                }}
                              >
                                {startTime.toLocaleTimeString("fr-FR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                                {" — "}
                                {endTime.toLocaleTimeString("fr-FR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </RNText>
                              {apt.notes && (
                                <RNText
                                  style={{
                                    fontSize: 11,
                                    color: theme.textHint,
                                    marginTop: 4,
                                  }}
                                  numberOfLines={1}
                                >
                                  {apt.notes}
                                </RNText>
                              )}
                            </View>
                            <TouchableOpacity
                              onPress={() => openEdit(apt)}
                              style={{ padding: 4 }}
                            >
                              <Feather
                                name="more-horizontal"
                                size={18}
                                color={theme.textMuted}
                              />
                            </TouchableOpacity>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}

              {/* Ligne "maintenant" */}
              {selectedIsToday && (() => {
                const now = new Date();
                const currentMinutes =
                  now.getHours() * 60 + now.getMinutes();
                const totalMinutes = 24 * 60;
                const pct = Math.max(
                  0,
                  Math.min(100, (currentMinutes / totalMinutes) * 100)
                );
                return (
                  <View
                    style={{
                      position: "absolute",
                      left: 44,
                      right: 0,
                      top: `${pct}%`,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                    pointerEvents="none"
                  >
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: theme.primary,
                      }}
                    />
                    <View
                      style={{
                        flex: 1,
                        height: StyleSheet.hairlineWidth,
                        minHeight: 1,
                        backgroundColor: theme.primary,
                      }}
                    />
                  </View>
                );
              })()}
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={openCreate}
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
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 12,
          elevation: 8,
        }}
        accessibilityLabel="Nouveau rendez-vous"
      >
        <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      <AppointmentSheet
        visible={sheetVisible}
        onClose={() => {
          setSheetVisible(false);
          setEditingAppointment(null);
        }}
        mode={sheetMode}
        contacts={contacts}
        preselectedContactId={
          preselectedContactId ?? editingAppointment?.contact_id
        }
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
