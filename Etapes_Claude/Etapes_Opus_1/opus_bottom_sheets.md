# KIT — Redesign Bottom Sheets & Modals

## Contexte

App mobile React Native, Expo SDK 54, NativeWind, Supabase, Stripe.
Code dans le dossier `kit/`.
Le redesign UI global Sleek a déjà été effectué (fond #f8f9fb, cards blanches,
accent #10b981, shadows douces).

Les bottom sheets et modals n'ont pas été inclus dans le redesign global.
Tu vas les identifier et les mettre en cohérence avec le nouveau style.

---

## ÉTAPE 1 — Identifier tous les bottom sheets / modals

Commence par faire une recherche exhaustive dans tout le projet de :
- `Modal` (React Native)
- `BottomSheet`
- `sheet`, `Sheet` dans les noms de fichiers et composants
- `position: "absolute"` avec `bottom: 0`
- `KeyboardAvoidingView` utilisé comme sheet
- Tout composant qui s'ouvre "from bottom"

Liste tous les fichiers trouvés avant de modifier quoi que ce soit.

---

## ÉTAPE 2 — Appliquer le nouveau style sur chaque sheet

### Style de référence pour tous les bottom sheets

```tsx
// Container principal du sheet
<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
  <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    style={{ flex: 1, justifyContent: "flex-end" }}
  >
    {/* Overlay semi-transparent */}
    <TouchableOpacity
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.4)" }}
      onPress={onClose}
      activeOpacity={1}
    />

    {/* Sheet content */}
    <View style={{
      backgroundColor: "#fff",           // blanc pur en light mode
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingBottom: Platform.OS === "ios" ? 34 : 24, // safe area bottom
      maxHeight: "90%",
    }}>
      {/* Handle */}
      <View style={{
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: "#e2e8f0",
        alignSelf: "center",
        marginTop: 12, marginBottom: 4,
      }} />

      {/* Contenu scrollable si nécessaire */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Titre du sheet */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#0f172a" }}>
            Titre du sheet
          </Text>
        </View>

        {/* Contenu */}
        <View style={{ paddingHorizontal: 20, gap: 16 }}>
          {/* ... */}
        </View>
      </ScrollView>

      {/* Boutons bas */}
      <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingTop: 16 }}>
        <TouchableOpacity
          onPress={onClose}
          style={{
            flex: 1, paddingVertical: 14,
            borderRadius: 14, alignItems: "center",
            backgroundColor: "#f8fafc",
            borderWidth: 1, borderColor: "#e2e8f0",
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#64748b" }}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          style={{
            flex: 2, paddingVertical: 14,
            borderRadius: 14, alignItems: "center",
            backgroundColor: "#10b981",
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>Confirmer</Text>
        </TouchableOpacity>
      </View>
    </View>
  </KeyboardAvoidingView>
</Modal>
```

---

### Style pour les inputs dans les sheets

```tsx
// Label
<Text style={{ fontSize: 12, fontWeight: "600", color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
  Label
</Text>

// Input
<TextInput
  style={{
    backgroundColor: "#f8fafc",
    borderWidth: 1, borderColor: "#e2e8f0",
    borderRadius: 12, padding: 14,
    fontSize: 15, color: "#0f172a",
  }}
  placeholderTextColor="#94a3b8"
/>
```

---

### Style pour les chips de sélection dans les sheets

```tsx
// Chip non sélectionné
<TouchableOpacity style={{
  paddingHorizontal: 14, paddingVertical: 8,
  borderRadius: 100,
  backgroundColor: "#f8fafc",
  borderWidth: 1, borderColor: "#e2e8f0",
}}>
  <Text style={{ fontSize: 13, fontWeight: "500", color: "#64748b" }}>Option</Text>
</TouchableOpacity>

// Chip sélectionné
<TouchableOpacity style={{
  paddingHorizontal: 14, paddingVertical: 8,
  borderRadius: 100,
  backgroundColor: "#f0fdf4",
  borderWidth: 1, borderColor: "#10b981",
}}>
  <Text style={{ fontSize: 13, fontWeight: "600", color: "#10b981" }}>Option</Text>
</TouchableOpacity>
```

---

### Style pour les items de liste dans les sheets (type sélecteur)

```tsx
<TouchableOpacity style={{
  flexDirection: "row", alignItems: "center",
  paddingVertical: 14, paddingHorizontal: 4,
  gap: 12,
}}>
  {/* Icône */}
  <View style={{
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#f0fdf4",
    alignItems: "center", justifyContent: "center",
  }}>
    <Feather name="icon" size={16} color="#10b981" />
  </View>
  
  {/* Label */}
  <Text style={{ flex: 1, fontSize: 15, color: "#0f172a", fontWeight: "500" }}>
    Label
  </Text>
  
  {/* Check si sélectionné */}
  {isSelected && <Feather name="check" size={18} color="#10b981" />}
</TouchableOpacity>
```

---

## ÉTAPE 3 — Sheets spécifiques à revoir

### AddInteractionSheet (ajouter une interaction)

- Header : "Nouvelle interaction"
- Types d'interaction : chips horizontaux scrollables (Appel, Message, Email, Réunion, Note)
- Chip actif : fond vert clair + bordure verte + texte vert
- Textarea pour le contenu : fond gris clair, border gris, radius 12
- Boutons bas : Annuler (gris) + Ajouter (vert plein)

### FollowUpPicker (planifier une relance)

- Header : "Planifier une relance"
- Raccourcis : chips horizontaux (Demain, 3 jours, 1 semaine, 2 semaines, 1 mois)
- Date picker si "Choisir une date" sélectionné
- Récurrence : chips (Aucune, Semaine, 2 semaines, Mois)
- Bouton : "Enregistrer la relance" (vert plein)

### AddTaskSheet (ajouter une tâche)

- Header : "Nouvelle tâche"
- Suggestions rapides : chips en grille 2 colonnes ou horizontaux scrollables
- Input pour tâche custom : fond gris clair
- Priorité : 3 chips (Faible, Normal, Urgent) avec couleurs respectives
  - Faible : gris
  - Normal : vert
  - Urgent : rouge
- Bouton : "Ajouter la tâche" (vert plein)

### AppointmentSheet / NewAppointmentSheet (nouveau RDV)

- Header : "Nouveau rendez-vous"
- Sélecteur contact : avatars horizontaux scrollables avec nom
- Contact sélectionné : bordure verte + fond vert clair
- Date/heure : row avec icône calendrier + texte formaté, tap pour ouvrir picker
- Input titre (optionnel)
- Textarea notes (optionnel)
- Boutons : Annuler + Créer (vert)

### GroupPicker (choisir un groupe)

- Header : "Ajouter à un groupe"
- Liste des groupes : items avec emoji + nom + check si sélectionné
- Bouton bas : "Confirmer" (vert)

### NewContactSheet ou écran new contact

- Si c'est un écran : vérifier qu'il est cohérent avec le nouveau style
- Si c'est un sheet : appliquer le même style

---

## ÉTAPE 4 — Vérifications supplémentaires

- Les `Alert.alert` natifs sont OK — ne pas les modifier
- Les `DateTimePicker` natifs sont OK — ne pas les modifier
- Vérifier que le `maxHeight: "90%"` est bien appliqué sur tous les sheets
  pour éviter qu'un sheet prenne tout l'écran
- S'assurer que l'overlay semi-transparent ferme bien le sheet au tap

---

## Critères de validation

- [ ] Tous les bottom sheets ont le handle gris en haut
- [ ] Fond blanc `#fff` sur tous les sheets (pas de fond sombre ou gris)
- [ ] BorderTopRadius 24 sur tous les sheets
- [ ] Les chips de sélection utilisent le style vert/gris cohérent
- [ ] Les inputs ont le style `#f8fafc` + border `#e2e8f0`
- [ ] Les boutons primaires sont verts pleins avec texte blanc
- [ ] Les boutons secondaires sont gris clair avec texte gris
- [ ] L'overlay ferme le sheet au tap
- [ ] Aucun crash sur l'ouverture/fermeture des sheets
- [ ] Aucune erreur TypeScript
