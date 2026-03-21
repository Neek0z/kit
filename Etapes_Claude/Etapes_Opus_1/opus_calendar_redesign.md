# KIT — Redesign Calendrier (style agenda)

## Contexte

App mobile React Native, Expo SDK 54, NativeWind, Supabase, Stripe.
Code dans le dossier `kit/`.
Le redesign UI global Sleek a déjà été effectué.

Tu vas refaire complètement l'écran calendrier pour qu'il ressemble
à un vrai calendrier agenda moderne avec :
- Vue mois compacte en haut (grille de chiffres, pas trop haute)
- Vue agenda avec créneaux horaires à gauche en dessous
- RDV affichés en cards colorées sur les créneaux

Adapte avec les couleurs et polices actuelles de l'app (thème Sleek vert #10b981).

---

## Référence visuelle

Le design de référence montre :
- Fond sombre avec cards violettes pour les RDV (adapter en vert #10b981 pour KIT)
- Calendrier mois en haut avec les jours de la semaine
- Jour sélectionné dans un cercle coloré
- En dessous : timeline avec heures à gauche (9 AM, 10 AM...) et RDV en cards
- Les RDV ont un titre bold + sous-titre heure (ex: "9:00 - 10:00 AM")
- Un bouton "..." sur chaque card pour les actions

---

## Ce que tu dois faire

### 1. Lire le code existant d'abord

Lire ces fichiers avant de modifier quoi que ce soit :
- `app/(app)/calendar.tsx` (ou le fichier calendrier existant)
- `components/calendar/` (tous les composants existants)
- `hooks/useAppointments.ts` ou équivalent
- `lib/theme.ts` pour les couleurs

---

### 2. Layout général

```tsx
<SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
  {/* Header */}
  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
    <Text style={{ fontSize: 28, fontWeight: "800", color: theme.textPrimary, letterSpacing: -1 }}>
      Calendrier
    </Text>
    <View style={{ flexDirection: "row", gap: 8 }}>
      {/* Toggle mois/semaine compact */}
      <View style={{ flexDirection: "row", backgroundColor: theme.surface, borderRadius: 10, padding: 3 }}>
        {["Mois", "Semaine"].map((mode) => (
          <TouchableOpacity
            key={mode}
            onPress={() => setViewMode(mode.toLowerCase())}
            style={{
              paddingHorizontal: 12, paddingVertical: 6,
              borderRadius: 8,
              backgroundColor: viewMode === mode.toLowerCase() ? theme.primary : "transparent",
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "600", color: viewMode === mode.toLowerCase() ? "#fff" : theme.textMuted }}>
              {mode}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Bouton calendrier icon */}
      <TouchableOpacity
        style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}
        onPress={handleAddAppointment}
      >
        <Feather name="calendar" size={18} color={theme.textMuted} />
      </TouchableOpacity>
    </View>
  </View>

  {/* Navigation mois */}
  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 }}>
    <TouchableOpacity onPress={prevMonth} style={{ padding: 4 }}>
      <Feather name="chevron-left" size={22} color={theme.textPrimary} />
    </TouchableOpacity>
    <Text style={{ fontSize: 18, fontWeight: "700", color: theme.textPrimary }}>
      {currentMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }).replace(/^\w/, c => c.toUpperCase())}
    </Text>
    <TouchableOpacity onPress={nextMonth} style={{ padding: 4 }}>
      <Feather name="chevron-right" size={22} color={theme.textPrimary} />
    </TouchableOpacity>
  </View>

  {/* Grille calendrier mois */}
  <MonthGrid />

  {/* Séparateur */}
  <View style={{ height: 1, backgroundColor: theme.border, marginHorizontal: 20, marginVertical: 8 }} />

  {/* Vue agenda scrollable */}
  <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
    <AgendaView />
  </ScrollView>

  {/* FAB */}
  <TouchableOpacity
    onPress={handleAddAppointment}
    style={{
      position: "absolute", bottom: 24, right: 20,
      width: 52, height: 52, borderRadius: 26,
      backgroundColor: theme.primary,
      alignItems: "center", justifyContent: "center",
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35, shadowRadius: 12,
      elevation: 8,
    }}
  >
    <Feather name="plus" size={24} color="#fff" />
  </TouchableOpacity>
</SafeAreaView>
```

---

### 3. Grille mois compacte (MonthGrid)

```tsx
function MonthGrid() {
  const theme = useTheme();
  const weeks = getMonthWeeks(currentMonth); // fonction existante ou à créer

  return (
    <View style={{ paddingHorizontal: 16 }}>
      {/* Jours de la semaine */}
      <View style={{ flexDirection: "row", marginBottom: 4 }}>
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
          <Text key={d} style={{ flex: 1, textAlign: "center", fontSize: 11, fontWeight: "600", color: theme.textHint }}>
            {d}
          </Text>
        ))}
      </View>

      {/* Semaines */}
      {weeks.map((week, wi) => (
        <View key={wi} style={{ flexDirection: "row", marginBottom: 2 }}>
          {week.map((day, di) => {
            if (!day) return <View key={di} style={{ flex: 1 }} />;

            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDate);
            const hasAppts = getAppointmentsForDay(day).length > 0;
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();

            return (
              <TouchableOpacity
                key={di}
                onPress={() => setSelectedDate(day)}
                style={{ flex: 1, alignItems: "center", paddingVertical: 3 }}
              >
                <View style={{
                  width: 34, height: 34, borderRadius: 17,
                  backgroundColor: isSelected
                    ? theme.primary
                    : isToday
                    ? `${theme.primary}20`
                    : "transparent",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: isToday || isSelected ? "700" : "400",
                    color: isSelected
                      ? "#fff"
                      : isToday
                      ? theme.primary
                      : isCurrentMonth
                      ? theme.textPrimary
                      : theme.textHint,
                  }}>
                    {day.getDate()}
                  </Text>
                </View>
                {/* Point indicateur RDV */}
                {hasAppts && !isSelected && (
                  <View style={{
                    width: 4, height: 4, borderRadius: 2,
                    backgroundColor: theme.primary,
                    marginTop: 1,
                  }} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}
```

---

### 4. Vue Agenda avec créneaux horaires (AgendaView)

C'est la partie clé — les heures à gauche, les RDV à droite :

```tsx
function AgendaView() {
  const theme = useTheme();
  const dayAppointments = getAppointmentsForDay(selectedDate);
  const isToday = isSameDay(selectedDate, new Date());

  // Générer les créneaux horaires de 7h à 21h
  const HOURS = Array.from({ length: 15 }, (_, i) => i + 7);

  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: 100 }}>
      {/* Header du jour sélectionné */}
      <View style={{ paddingVertical: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: theme.textPrimary }}>
          {isToday ? "Aujourd'hui" : selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </Text>
        {dayAppointments.length > 0 && (
          <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
            {dayAppointments.length} rendez-vous
          </Text>
        )}
      </View>

      {/* État vide */}
      {dayAppointments.length === 0 && (
        <View style={{ alignItems: "center", paddingVertical: 32, gap: 10 }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: `${theme.primary}15`, alignItems: "center", justifyContent: "center" }}>
            <Feather name="calendar" size={22} color={theme.primary} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: "600", color: theme.textPrimary }}>Aucun rendez-vous</Text>
          <Text style={{ fontSize: 13, color: theme.textMuted }}>Appuie sur + pour en ajouter un</Text>
        </View>
      )}

      {/* Timeline avec créneaux horaires */}
      {dayAppointments.length > 0 && (
        <View style={{ position: "relative" }}>
          {HOURS.map((hour) => {
            // Trouver les RDV sur ce créneau
            const hourAppts = dayAppointments.filter((apt) => {
              const aptHour = new Date(apt.scheduled_at).getHours();
              return aptHour === hour;
            });

            const isCurrentHour = isToday && new Date().getHours() === hour;

            return (
              <View key={hour} style={{ flexDirection: "row", minHeight: 64, alignItems: "flex-start" }}>
                {/* Heure à gauche */}
                <View style={{ width: 56, paddingTop: 2 }}>
                  <Text style={{ fontSize: 12, fontWeight: "500", color: isCurrentHour ? theme.primary : theme.textHint }}>
                    {hour < 12 ? `${hour}h` : hour === 12 ? "12h" : `${hour}h`}
                  </Text>
                </View>

                {/* Ligne de séparation */}
                <View style={{ width: 1, backgroundColor: isCurrentHour ? theme.primary : theme.border, marginRight: 12, marginTop: 8, alignSelf: "stretch" }} />

                {/* RDV sur ce créneau */}
                <View style={{ flex: 1, gap: 6, paddingVertical: 4 }}>
                  {hourAppts.map((apt) => (
                    <AppointmentCard key={apt.id} appointment={apt} />
                  ))}
                </View>
              </View>
            );
          })}

          {/* Ligne "maintenant" si aujourd'hui */}
          {isToday && (
            <View style={{
              position: "absolute",
              left: 56,
              right: 0,
              top: `${((new Date().getHours() - 7) / 14) * 100}%`,
              flexDirection: "row",
              alignItems: "center",
            }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.primary }} />
              <View style={{ flex: 1, height: 1.5, backgroundColor: theme.primary }} />
            </View>
          )}
        </View>
      )}
    </View>
  );
}
```

---

### 5. Card de RDV (AppointmentCard)

```tsx
function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const theme = useTheme();
  const startTime = new Date(appointment.scheduled_at);

  // Couleur selon le contact ou aléatoire parmi les couleurs de statut
  const cardColor = theme.primary; // ou varier selon le contact

  return (
    <TouchableOpacity
      style={{
        backgroundColor: `${cardColor}15`,
        borderRadius: 14,
        padding: 12,
        borderLeftWidth: 3,
        borderLeftColor: cardColor,
        flexDirection: "row",
        alignItems: "center",
      }}
      activeOpacity={0.7}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: theme.textPrimary }}>
          {appointment.contact_name ?? appointment.title ?? "Rendez-vous"}
        </Text>
        <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
          {startTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          {" — "}
          {new Date(startTime.getTime() + 60 * 60 * 1000).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </Text>
        {appointment.notes && (
          <Text style={{ fontSize: 11, color: theme.textHint, marginTop: 4 }} numberOfLines={1}>
            {appointment.notes}
          </Text>
        )}
      </View>
      <TouchableOpacity style={{ padding: 4 }}>
        <Feather name="more-horizontal" size={18} color={theme.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
```

---

### 6. Fonctions utilitaires nécessaires

Si elles n'existent pas déjà, créer dans `lib/calendarUtils.ts` :

```ts
export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function getMonthWeeks(month: Date): (Date | null)[][] {
  const weeks: (Date | null)[][] = [];
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  // Lundi = 0, dimanche = 6
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  let currentDate = new Date(firstDay);
  currentDate.setDate(currentDate.getDate() - startOffset);

  while (currentDate <= lastDay || weeks.length < 6) {
    if (weeks.length >= 6) break;
    const week: (Date | null)[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
}

export function getAppointmentsForDay(
  appointments: Appointment[],
  day: Date
): Appointment[] {
  return appointments.filter((apt) =>
    isSameDay(new Date(apt.scheduled_at), day)
  );
}
```

---

## Critères de validation

- [ ] La vue mois est compacte (pas trop haute) avec grille de chiffres
- [ ] Le jour sélectionné a un cercle coloré vert
- [ ] Aujourd'hui a un cercle semi-transparent vert
- [ ] Les jours avec RDV ont un petit point vert en dessous
- [ ] La vue agenda affiche les créneaux horaires de 7h à 21h
- [ ] Les heures s'affichent à gauche, les RDV à droite
- [ ] Chaque RDV est une card avec nom + heure + bordure gauche verte
- [ ] La ligne "maintenant" s'affiche si on est aujourd'hui
- [ ] L'état vide est propre avec icône centrée
- [ ] Le FAB + est en bas à droite
- [ ] La navigation mois (< >) fonctionne
- [ ] Aucun crash, aucune erreur TypeScript
