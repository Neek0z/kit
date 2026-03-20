# KIT — Redesign fiche contact [id].tsx

## Contexte

On restructure complètement le layout de la fiche contact.
L'objectif : meilleure hiérarchie visuelle, moins de scroll, sections secondaires compactes.
Toute la logique métier existante est conservée — on ne touche qu'au layout et aux styles.

---

## Nouvel ordre des sections

```
1. Header (retour + nom + édition)
2. Ligne décorative
3. Hero (avatar + nom + StatusPill)
4. Boutons d'action rapide (Appeler, WhatsApp, Email, KIT)
5. Card : Infos contact + Pipeline (fusionnés)
6. Card : Prochaine relance (compacte)
7. Card : Tâches (avec badge compteur)
8. Row : Groupes + Tags (côte à côte)
9. Card : Historique interactions
10. Card : Workflow client (replié par défaut)
11. Bouton Prévoir un RDV
12. Bouton Supprimer (discret)
```

---

## Ce que tu dois faire

### 1. Hero section

```tsx
<View style={{ alignItems: "center", paddingVertical: 20, paddingHorizontal: 16, gap: 8 }}>
  <Avatar
    name={contact.full_name}
    url={contact.avatar_url}
    status={contact.status}
    size="lg"
  />
  <Text style={{
    fontSize: 20, fontWeight: "800",
    color: theme.textPrimary, letterSpacing: -0.5,
  }}>
    {contact.full_name}
  </Text>
  <StatusPill status={contact.status} />
</View>
```

---

### 2. Boutons d'action rapide

Remplacer les boutons ronds actuels par des boutons carrés arrondis (borderRadius 14)
plus grands et plus visibles, disposés en grille de 4 :

```tsx
const ACTIONS = [
  { label: "Appeler",   icon: "phone",          color: theme.primary,  onPress: handleCall,       show: !!contact.phone },
  { label: "WhatsApp",  icon: "message-circle",  color: "#22c55e",      onPress: handleWhatsApp,   show: !!contact.phone },
  { label: "Email",     icon: "mail",            color: "#818cf8",      onPress: handleEmail,      show: !!contact.email },
  { label: "KIT",       icon: "message-square",  color: theme.primary,  onPress: handleKitMessage, show: true },
].filter((a) => a.show);

<View style={{
  flexDirection: "row", justifyContent: "center",
  gap: 10, paddingHorizontal: 16, paddingBottom: 14,
}}>
  {ACTIONS.map((action) => (
    <TouchableOpacity
      key={action.label}
      onPress={action.onPress}
      style={{ alignItems: "center", gap: 5, flex: 1 }}
    >
      <View style={{
        width: 48, height: 48, borderRadius: 14,
        backgroundColor: theme.surface,
        borderWidth: 1, borderColor: `${action.color}25`,
        alignItems: "center", justifyContent: "center",
      }}>
        <Feather name={action.icon as any} size={19} color={action.color} />
      </View>
      <Text style={{ fontSize: 10, color: theme.textMuted }}>{action.label}</Text>
    </TouchableOpacity>
  ))}
</View>
```

---

### 3. Card : Infos contact + Pipeline fusionnés

Une seule card qui contient le téléphone, l'email ET le pipeline.
Ça évite deux cards séparées pour si peu d'info :

```tsx
<Card style={{ marginHorizontal: 16, marginBottom: 10 }}>
  {/* Téléphone */}
  {contact.phone && (
    <TouchableOpacity onPress={handleCall} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 }}>
      <Feather name="phone" size={14} color={theme.textHint} />
      <Text style={{ fontSize: 13, color: theme.textPrimary, flex: 1 }}>{contact.phone}</Text>
      <Feather name="chevron-right" size={12} color={theme.textHint} />
    </TouchableOpacity>
  )}

  {contact.phone && contact.email && (
    <View style={{ height: 1, backgroundColor: theme.border }} />
  )}

  {/* Email */}
  {contact.email && (
    <TouchableOpacity onPress={handleEmail} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 }}>
      <Feather name="mail" size={14} color={theme.textHint} />
      <Text style={{ fontSize: 13, color: theme.textPrimary, flex: 1 }}>{contact.email}</Text>
      <Feather name="chevron-right" size={12} color={theme.textHint} />
    </TouchableOpacity>
  )}

  {/* Séparateur avant pipeline */}
  <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 10 }} />

  {/* Pipeline */}
  <Text style={{
    fontSize: 10, color: theme.textHint,
    textTransform: "uppercase", letterSpacing: 0.8,
    fontWeight: "600", marginBottom: 10,
  }}>
    Pipeline
  </Text>
  <PipelineArc
    status={contact.status as PipelineStatus}
    onChange={async (newStatus) => {
      await updateContact(contact.id, { status: newStatus });
    }}
  />
</Card>
```

---

### 4. Card : Prochaine relance compacte

Remplacer le bloc relance actuel par une version plus compacte.
Les chips de raccourci sur une seule ligne scrollable horizontalement,
et le date picker en dessous uniquement si aucune date n'est sélectionnée :

```tsx
<Card style={{ marginHorizontal: 16, marginBottom: 10 }}>
  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
    <Text style={{
      fontSize: 10, color: theme.textHint,
      textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "600",
    }}>
      Prochaine relance
    </Text>
    {contact.next_follow_up && (
      <TouchableOpacity onPress={() => handleFollowUpChange(null)}>
        <Text style={{ fontSize: 11, color: "#f87171" }}>Supprimer</Text>
      </TouchableOpacity>
    )}
  </View>

  {/* Date actuelle si définie */}
  {contact.next_follow_up && (
    <View style={{
      flexDirection: "row", alignItems: "center", gap: 8,
      backgroundColor: theme.primaryBg,
      borderWidth: 1, borderColor: theme.primaryBorder,
      borderRadius: 10, padding: 10, marginBottom: 10,
    }}>
      <Feather name="calendar" size={14} color={theme.primary} />
      <Text style={{ fontSize: 13, color: theme.primary, fontWeight: "600" }}>
        {new Date(contact.next_follow_up).toLocaleDateString("fr-FR", {
          weekday: "long", day: "numeric", month: "long",
        })}
      </Text>
    </View>
  )}

  {/* Chips raccourcis */}
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
    <View style={{ flexDirection: "row", gap: 6 }}>
      {[
        { label: "Demain", days: 1 },
        { label: "3 jours", days: 3 },
        { label: "1 semaine", days: 7 },
        { label: "2 semaines", days: 14 },
        { label: "1 mois", days: 30 },
      ].map((opt) => (
        <TouchableOpacity
          key={opt.days}
          onPress={() => {
            const d = new Date();
            d.setDate(d.getDate() + opt.days);
            d.setHours(9, 0, 0, 0);
            handleFollowUpChange(d);
          }}
          style={{
            paddingHorizontal: 12, paddingVertical: 6,
            borderRadius: 100,
            backgroundColor: theme.surface,
            borderWidth: 1, borderColor: theme.border,
          }}
        >
          <Text style={{ fontSize: 12, color: theme.textMuted }}>{opt.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </ScrollView>

  {/* Récurrence — compacte */}
  <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
    {["Aucune", "Semaine", "2 semaines", "Mois"].map((r) => (
      <TouchableOpacity
        key={r}
        style={{
          paddingHorizontal: 10, paddingVertical: 4,
          borderRadius: 100,
          backgroundColor: theme.bg,
          borderWidth: 1, borderColor: theme.border,
        }}
      >
        <Text style={{ fontSize: 11, color: theme.textMuted }}>{r}</Text>
      </TouchableOpacity>
    ))}
  </View>
</Card>
```

---

### 5. Card : Tâches

Le composant `ContactTasksSection` existant — juste s'assurer qu'il est bien placé
après la relance et avant les groupes :

```tsx
<View style={{ marginHorizontal: 16, marginBottom: 10 }}>
  <ContactTasksSection contactId={contact.id} />
</View>
```

---

### 6. Groupes + Tags côte à côte

Remplacer les deux cards séparées par une row de deux demi-cards :

```tsx
<View style={{ flexDirection: "row", gap: 10, marginHorizontal: 16, marginBottom: 10 }}>

  {/* Groupes */}
  <View style={{
    flex: 1, backgroundColor: theme.surface,
    borderWidth: 1, borderColor: theme.border,
    borderRadius: 14, padding: 12,
  }}>
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
      <Text style={{ fontSize: 10, color: theme.textHint, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "600" }}>
        Groupes
      </Text>
      <TouchableOpacity onPress={() => setShowGroupPicker(true)}>
        <Feather name="plus" size={14} color={theme.primary} />
      </TouchableOpacity>
    </View>
    {contactGroups.length === 0 ? (
      <TouchableOpacity onPress={() => setShowGroupPicker(true)}>
        <Text style={{ fontSize: 11, color: theme.textHint }}>Ajouter...</Text>
      </TouchableOpacity>
    ) : (
      <View style={{ gap: 4 }}>
        {contactGroups.slice(0, 2).map((group) => (
          <GroupBadge key={group.id} group={group} size="sm" />
        ))}
        {contactGroups.length > 2 && (
          <Text style={{ fontSize: 10, color: theme.textMuted }}>+{contactGroups.length - 2}</Text>
        )}
      </View>
    )}
  </View>

  {/* Tags */}
  <View style={{
    flex: 1, backgroundColor: theme.surface,
    borderWidth: 1, borderColor: theme.border,
    borderRadius: 14, padding: 12,
  }}>
    <Text style={{ fontSize: 10, color: theme.textHint, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "600", marginBottom: 8 }}>
      Tags
    </Text>
    {/* Garder le composant tags existant ici */}
    {contact.tags?.length === 0 ? (
      <Text style={{ fontSize: 11, color: theme.textHint }}>Aucun tag</Text>
    ) : (
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
        {contact.tags?.slice(0, 3).map((tag) => (
          <View key={tag} style={{
            backgroundColor: "rgba(129,140,248,0.1)",
            borderWidth: 1, borderColor: "rgba(129,140,248,0.2)",
            borderRadius: 100, paddingHorizontal: 8, paddingVertical: 2,
          }}>
            <Text style={{ fontSize: 10, color: "#818cf8", fontWeight: "600" }}>{tag}</Text>
          </View>
        ))}
      </View>
    )}
  </View>

</View>
```

---

### 7. Card : Historique interactions

Garder le composant existant mais s'assurer que le header est standardisé :

```tsx
<Card style={{ marginHorizontal: 16, marginBottom: 10 }}>
  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
    <Text style={{
      fontSize: 10, color: theme.textHint,
      textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "600",
    }}>
      Historique
    </Text>
    <TouchableOpacity onPress={() => setShowInteractionSheet(true)}>
      <Text style={{ fontSize: 11, color: theme.primary }}>+ Ajouter</Text>
    </TouchableOpacity>
  </View>
  {/* Liste interactions existante */}
</Card>
```

---

### 8. Card : Workflow client — replié par défaut

Envelopper `WorkflowTimeline` dans un accordion repliable.
Par défaut replié — l'utilisateur tape pour déplier :

```tsx
const [workflowExpanded, setWorkflowExpanded] = useState(false);

{contact.status === "client" && (
  <Card style={{ marginHorizontal: 16, marginBottom: 10 }}>
    <TouchableOpacity
      onPress={() => setWorkflowExpanded(!workflowExpanded)}
      style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={{
          fontSize: 10, color: theme.textHint,
          textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "600",
        }}>
          Workflow client
        </Text>
        {/* Badge progression */}
        <View style={{
          backgroundColor: theme.primaryBg, borderRadius: 10,
          paddingHorizontal: 7, paddingVertical: 1,
          borderWidth: 1, borderColor: theme.primaryBorder,
        }}>
          <Text style={{ fontSize: 10, fontWeight: "700", color: theme.primary }}>
            {completedTasksCount}/{totalWorkflowTasks}
          </Text>
        </View>
      </View>
      <Feather
        name={workflowExpanded ? "chevron-up" : "chevron-down"}
        size={16}
        color={theme.textHint}
      />
    </TouchableOpacity>

    {/* Barre de progression toujours visible */}
    <View style={{ height: 3, backgroundColor: theme.border, borderRadius: 2, marginTop: 10 }}>
      <View style={{
        height: 3, backgroundColor: theme.primary, borderRadius: 2,
        width: `${totalWorkflowTasks > 0 ? (completedTasksCount / totalWorkflowTasks) * 100 : 0}%`,
      }} />
    </View>

    {/* Contenu déplié */}
    {workflowExpanded && (
      <View style={{ marginTop: 12 }}>
        <WorkflowTimeline contactId={contact.id} />
      </View>
    )}
  </Card>
)}
```

---

### 9. Boutons bas de page

```tsx
{/* RDV */}
<TouchableOpacity
  onPress={handleCreateAppointment}
  style={{
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: theme.primaryBg,
    borderWidth: 1, borderColor: theme.primaryBorder,
    borderRadius: 12, padding: 14, alignItems: "center",
  }}
>
  <Text style={{ fontSize: 14, fontWeight: "600", color: theme.primary }}>
    Prévoir un RDV
  </Text>
</TouchableOpacity>

{/* Supprimer — discret */}
<TouchableOpacity
  onPress={handleDelete}
  style={{ marginHorizontal: 16, marginBottom: 32, padding: 12, alignItems: "center" }}
>
  <Text style={{ fontSize: 13, color: "#f87171" }}>Supprimer ce contact</Text>
</TouchableOpacity>
```

---

## Règles importantes

- **Ne pas toucher à la logique métier** — tous les handlers existants (handleCall, handleWhatsApp, handleFollowUpChange, updateContact, etc.) restent identiques
- **Conserver tous les imports existants** — juste réorganiser le JSX
- **Le ScrollView principal** enveloppe tout le contenu
- **Aucune couleur hardcodée** — utiliser uniquement theme.*
- **Ajouter la ligne décorative** en haut après SafeAreaView

## Critères de validation

- [ ] L'ordre des sections correspond exactement au plan ci-dessus
- [ ] Les boutons d'action sont bien en grille 4 colonnes avec icônes 48x48
- [ ] Infos contact et Pipeline sont dans la même card
- [ ] La relance est compacte avec chips horizontaux scrollables
- [ ] Groupes et Tags sont côte à côte sur la même ligne
- [ ] Le workflow est replié par défaut avec barre de progression visible
- [ ] Le bouton Supprimer est discret en bas
- [ ] Aucune régression fonctionnelle
- [ ] Aucune erreur TypeScript
