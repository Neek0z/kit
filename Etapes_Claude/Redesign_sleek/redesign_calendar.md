# KIT — Redesign Calendrier

## Contexte

L'écran calendrier actuel est fonctionnel mais trop vide et générique.
On le redesigne dans le style Sleek : compact, dense, avec des indicateurs
visuels sur les jours qui ont des RDV, et une vue agenda plus utile.

---

## Problèmes actuels à corriger

1. Le toggle Semaine/Mois prend trop de place (full width)
2. La vue mois a des cellules vides énormes sans info
3. Pas de points/indicateurs sur les jours avec RDV
4. La vue semaine n'affiche qu'une seule semaine avec de grands chiffres
5. L'état vide prend toute la place inutilement
6. Le bouton + dans le header doit devenir un FAB flottant

---

## Ce que tu dois faire

### 1. Nouveau layout calendrier

```tsx
// Structure générale
<SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
  <View style={{ height: 1, marginHorizontal: 32, backgroundColor: theme.primary, opacity: 0.25 }} />

  {/* Header compact */}
  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
    <Text style={{ fontSize: 26, fontWeight: "800", color: theme.textPrimary, letterSpacing: -1 }}>
      Calendrier
    </Text>
    {/* Toggle compact — pill style, pas full width */}
    <View style={{
      flexDirection: "row",
      backgroundColor: theme.surface,
      borderWidth: 1, borderColor: theme.border,
      borderRadius: 100, padding: 3,
    }}>
      {["Semaine", "Mois"].map((mode) => (
        <TouchableOpacity
          key={mode}
          onPress={() => setViewMode(mode.toLowerCase() as "semaine" | "mois")}
          style={{
            paddingHorizontal: 14, paddingVertical: 6,
            borderRadius: 100,
            backgroundColor: viewMode === mode.toLowerCase() ? theme.primary : "transparent",
          }}
        >
          <Text style={{
            fontSize: 12, fontWeight: "600",
            color: viewMode === mode.toLowerCase()
              ? (theme.isDark ? "#0f172a" : "#ffffff")
              : theme.textMuted,
          }}>
            {mode}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>

  {/* Contenu scrollable */}
  <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
    {viewMode === "semaine" ? <WeekView /> : <MonthView />}
    <AppointmentsList />
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
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 8,
      elevation: 8,
    }}
  >
    <Feather name="plus" size={24} color={theme.isDark ? "#0f172a" : "#ffffff"} />
  </TouchableOpacity>
</SafeAreaView>
```

---

### 2. Vue Semaine redesignée

Remplacer la vue semaine actuelle par une bande de 7 jours compacte
avec indicateurs de RDV :

```tsx
function WeekView() {
  const theme = useTheme();
  // Générer les 7 jours de la semaine courante
  const weekDays = getWeekDays(selectedDate);

  return (
    <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
      {/* Navigation mois */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <TouchableOpacity onPress={prevWeek}>
          <Feather name="chevron-left" size={20} color={theme.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 14, fontWeight: "600", color: theme.textPrimary }}>
          {formatMonthYear(selectedDate)}
        </Text>
        <TouchableOpacity onPress={nextWeek}>
          <Feather name="chevron-right" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Bande 7 jours */}
      <View style={{ flexDirection: "row", gap: 6 }}>
        {weekDays.map((day) => {
          const isToday = isToday(day);
          const isSelected = isSameDay(day, selectedDate);
          const hasAppointments = getAppointmentsForDay(day).length > 0;

          return (
            <TouchableOpacity
              key={day.toISOString()}
              onPress={() => setSelectedDate(day)}
              style={{
                flex: 1, alignItems: "center", paddingVertical: 10,
                borderRadius: 14,
                backgroundColor: isSelected
                  ? theme.primary
                  : isToday
                  ? theme.primaryBg
                  : "transparent",
                borderWidth: isToday && !isSelected ? 1 : 0,
                borderColor: theme.primaryBorder,
              }}
            >
              {/* Jour de la semaine */}
              <Text style={{
                fontSize: 10, fontWeight: "600",
                color: isSelected
                  ? (theme.isDark ? "#0f172a" : "#ffffff")
                  : theme.textMuted,
                textTransform: "uppercase",
                marginBottom: 4,
              }}>
                {day.toLocaleDateString("fr-FR", { weekday: "narrow" })}
              </Text>

              {/* Numéro du jour */}
              <Text style={{
                fontSize: 16, fontWeight: "800",
                color: isSelected
                  ? (theme.isDark ? "#0f172a" : "#ffffff")
                  : isToday
                  ? theme.primary
                  : theme.textPrimary,
              }}>
                {day.getDate()}
              </Text>

              {/* Indicateur RDV */}
              <View style={{ height: 4, marginTop: 4 }}>
                {hasAppointments && (
                  <View style={{
                    width: 4, height: 4, borderRadius: 2,
                    backgroundColor: isSelected
                      ? (theme.isDark ? "#0f172a" : "#ffffff")
                      : theme.primary,
                  }} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
```

---

### 3. Vue Mois redesignée

Remplacer la vue mois actuelle (cellules trop grandes) par
une grille compacte avec points indicateurs :

```tsx
function MonthView() {
  const theme = useTheme();
  const weeks = getMonthWeeks(currentMonth);

  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
      {/* Navigation */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <TouchableOpacity onPress={prevMonth} style={{ padding: 4 }}>
          <Feather name="chevron-left" size={20} color={theme.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: "700", color: theme.textPrimary }}>
          {formatMonthYear(currentMonth)}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={{ padding: 4 }}>
          <Feather name="chevron-right" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Jours de la semaine */}
      <View style={{ flexDirection: "row", marginBottom: 6 }}>
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <Text key={i} style={{
            flex: 1, textAlign: "center",
            fontSize: 11, fontWeight: "600",
            color: theme.textHint,
          }}>
            {d}
          </Text>
        ))}
      </View>

      {/* Grille compacte */}
      {weeks.map((week, wi) => (
        <View key={wi} style={{ flexDirection: "row", marginBottom: 4 }}>
          {week.map((day, di) => {
            if (!day) return <View key={di} style={{ flex: 1 }} />;

            const isToday = isToday(day);
            const isSelected = isSameDay(day, selectedDate);
            const appts = getAppointmentsForDay(day);
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();

            return (
              <TouchableOpacity
                key={di}
                onPress={() => setSelectedDate(day)}
                style={{ flex: 1, alignItems: "center", paddingVertical: 4 }}
              >
                <View style={{
                  width: 32, height: 32,
                  borderRadius: 16,
                  backgroundColor: isSelected
                    ? theme.primary
                    : isToday
                    ? theme.primaryBg
                    : "transparent",
                  borderWidth: isToday && !isSelected ? 1 : 0,
                  borderColor: theme.primaryBorder,
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Text style={{
                    fontSize: 13, fontWeight: isToday || isSelected ? "700" : "400",
                    color: isSelected
                      ? (theme.isDark ? "#0f172a" : "#ffffff")
                      : isToday
                      ? theme.primary
                      : isCurrentMonth
                      ? theme.textPrimary
                      : theme.textHint,
                  }}>
                    {day.getDate()}
                  </Text>
                </View>

                {/* Points indicateurs RDV (max 3) */}
                <View style={{ flexDirection: "row", gap: 2, marginTop: 2, height: 4 }}>
                  {appts.slice(0, 3).map((_, i) => (
                    <View key={i} style={{
                      width: 3, height: 3, borderRadius: 1.5,
                      backgroundColor: isSelected
                        ? (theme.isDark ? "rgba(15,26,26,0.5)" : "rgba(255,255,255,0.6)")
                        : theme.primary,
                    }} />
                  ))}
                </View>
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

### 4. Liste des RDV du jour redesignée

```tsx
function AppointmentsList() {
  const theme = useTheme();
  const dayAppointments = getAppointmentsForDay(selectedDate);
  const isToday = isSameDay(selectedDate, new Date());

  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: 80 }}>
      {/* Header section */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <View>
          <Text style={{ fontSize: 15, fontWeight: "700", color: theme.textPrimary }}>
            {isToday ? "Aujourd'hui" : selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </Text>
          {dayAppointments.length > 0 && (
            <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 1 }}>
              {dayAppointments.length} rendez-vous
            </Text>
          )}
        </View>
      </View>

      {/* État vide compact */}
      {dayAppointments.length === 0 ? (
        <View style={{
          backgroundColor: theme.surface,
          borderWidth: 1, borderColor: theme.border,
          borderRadius: 16, padding: 20,
          alignItems: "center", gap: 8,
        }}>
          <View style={{
            width: 44, height: 44, borderRadius: 22,
            backgroundColor: theme.primaryBg,
            borderWidth: 1, borderColor: theme.primaryBorder,
            alignItems: "center", justifyContent: "center",
          }}>
            <Feather name="calendar" size={20} color={theme.primary} />
          </View>
          <Text style={{ fontSize: 14, fontWeight: "600", color: theme.textPrimary }}>
            Aucun RDV ce jour
          </Text>
          <Text style={{ fontSize: 12, color: theme.textMuted, textAlign: "center" }}>
            Appuie sur + pour planifier un rendez-vous
          </Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {dayAppointments.map((apt) => {
            const startTime = new Date(apt.start_date);
            const endTime = apt.end_date ? new Date(apt.end_date) : null;

            return (
              <TouchableOpacity
                key={apt.id}
                style={{
                  backgroundColor: theme.surface,
                  borderWidth: 1, borderColor: theme.border,
                  borderRadius: 16, padding: 14,
                  flexDirection: "row", gap: 12,
                }}
                activeOpacity={0.7}
              >
                {/* Heure */}
                <View style={{ alignItems: "center", minWidth: 44 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: theme.primary }}>
                    {startTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                  {endTime && (
                    <Text style={{ fontSize: 11, color: theme.textHint, marginTop: 2 }}>
                      {endTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  )}
                </View>

                {/* Ligne verticale colorée */}
                <View style={{
                  width: 3, borderRadius: 2,
                  backgroundColor: theme.primary,
                  alignSelf: "stretch",
                }} />

                {/* Contenu */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: theme.textPrimary }}>
                    {apt.title ?? "Rendez-vous"}
                  </Text>
                  {apt.contact_name && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 }}>
                      <Feather name="user" size={11} color={theme.textMuted} />
                      <Text style={{ fontSize: 12, color: theme.textMuted }}>
                        {apt.contact_name}
                      </Text>
                    </View>
                  )}
                  {apt.notes && (
                    <Text style={{ fontSize: 12, color: theme.textHint, marginTop: 3 }} numberOfLines={1}>
                      {apt.notes}
                    </Text>
                  )}
                </View>

                <Feather name="chevron-right" size={16} color={theme.textHint} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}
```

---

### 5. Bottom sheet "Nouveau RDV" redesigné

Le sheet existant garde sa logique mais améliore son style :

```tsx
// Dans le sheet, remplacer les chips de contacts par
// une FlatList horizontale avec avatars

<Text style={{ fontSize: 11, color: theme.textHint, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "600", marginBottom: 10 }}>
  Contact
</Text>
<FlatList
  horizontal
  data={contacts}
  showsHorizontalScrollIndicator={false}
  keyExtractor={(c) => c.id}
  contentContainerStyle={{ gap: 8 }}
  renderItem={({ item }) => {
    const isSelected = selectedContactId === item.id;
    return (
      <TouchableOpacity
        onPress={() => setSelectedContactId(isSelected ? null : item.id)}
        style={{
          flexDirection: "row", alignItems: "center", gap: 6,
          paddingHorizontal: 12, paddingVertical: 7,
          borderRadius: 100,
          backgroundColor: isSelected ? theme.primaryBg : theme.surface,
          borderWidth: 1,
          borderColor: isSelected ? theme.primaryBorder : theme.border,
        }}
      >
        <Avatar name={item.full_name} status={item.status} size="sm" />
        <Text style={{
          fontSize: 12, fontWeight: "600",
          color: isSelected ? theme.primary : theme.textMuted,
        }}>
          {item.full_name.split(" ")[0]}
        </Text>
      </TouchableOpacity>
    );
  }}
/>
```

---

## Critères de validation

- [ ] Le toggle Semaine/Mois est un pill compact dans le header (pas full width)
- [ ] Le bouton + est un FAB flottant en bas à droite
- [ ] La vue semaine affiche 7 jours compacts avec points indicateurs RDV
- [ ] La vue mois affiche une grille dense avec cercles sur les jours sélectionnés
- [ ] Les jours avec RDV ont des petits points verts sous le numéro
- [ ] Aujourd'hui est toujours mis en évidence (cercle bordé ou plein)
- [ ] La liste des RDV affiche heure + ligne colorée + titre + contact
- [ ] L'état vide est compact avec icône et texte centré
- [ ] Le sheet nouveau RDV affiche les contacts avec avatars colorés
- [ ] Aucune régression fonctionnelle
- [ ] Aucune erreur TypeScript
