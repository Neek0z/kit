import { useState, useCallback, useMemo } from "react";
import { View, TouchableOpacity, FlatList } from "react-native";
import { Text } from "../ui";
import { SwipeCard } from "./SwipeCard";
import { useContacts } from "../../hooks/useContacts";
import { PipelineStatus, PIPELINE_LABELS } from "../../types";
import { Feather } from "@expo/vector-icons";

const STEPS: PipelineStatus[] = [
  "new",
  "contacted",
  "interested",
  "follow_up",
  "client",
];

const FILTERS: { label: string; value: PipelineStatus | "all" | "overdue" }[] = [
  { label: "Tous", value: "all" },
  { label: "En retard", value: "overdue" },
  { label: "À relancer", value: "follow_up" },
  { label: "Intéressés", value: "interested" },
  { label: "Clients", value: "client" },
  { label: "Nouveaux", value: "new" },
];

interface SwipeModeProps {
  onClose: () => void;
  onChanged?: () => void;
}

export function SwipeMode({ onClose, onChanged }: SwipeModeProps) {
  const { contacts, updateContact } = useContacts();
  const [activeFilter, setActiveFilter] = useState<PipelineStatus | "all" | "overdue">("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const queue = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return contacts.filter((c) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "overdue") {
        return !!c.next_follow_up && new Date(c.next_follow_up) < today;
      }
      return c.status === activeFilter;
    });
  }, [contacts, activeFilter]);

  const handleSwipeRight = useCallback(async () => {
    const contact = queue[currentIndex];
    if (!contact) return;
    const currentStep = STEPS.indexOf(contact.status as PipelineStatus);
    if (currentStep === STEPS.length - 1) {
      // Déjà au dernier statut : on ne bouge pas, on laisse tel quel
      setLastAction(
        `${contact.full_name} reste ${PIPELINE_LABELS[STEPS[currentStep]]}`
      );
      return;
    }
    const next = Math.min(STEPS.length - 1, currentStep + 1);
    await updateContact(contact.id, { status: STEPS[next] });
    onChanged?.();
    setLastAction(`${contact.full_name} → ${PIPELINE_LABELS[STEPS[next]]}`);
    setCurrentIndex((i) => i + 1);
  }, [currentIndex, queue, updateContact]);

  const handleSwipeLeft = useCallback(async () => {
    const contact = queue[currentIndex];
    if (!contact) return;
    const currentStep = STEPS.indexOf(contact.status as PipelineStatus);
    if (currentStep === 0) {
      // Déjà au premier statut : on ne bouge pas, on laisse tel quel
      setLastAction(
        `${contact.full_name} reste ${PIPELINE_LABELS[STEPS[currentStep]]}`
      );
      return;
    }
    const prev = Math.max(0, currentStep - 1);
    await updateContact(contact.id, { status: STEPS[prev] });
    onChanged?.();
    setLastAction(`${contact.full_name} → ${PIPELINE_LABELS[STEPS[prev]]}`);
    setCurrentIndex((i) => i + 1);
  }, [currentIndex, queue, updateContact]);

  const handleSwipeUp = useCallback(() => {
    const contact = queue[currentIndex];
    if (!contact) return;
    setLastAction(`${contact.full_name} ignoré`);
    onChanged?.();
    setCurrentIndex((i) => i + 1);
  }, [currentIndex, queue]);

  const remaining = queue.slice(currentIndex, currentIndex + 3);

  return (
    <View className="flex-1">
      <View className="flex-row items-center justify-between px-5 pt-2 pb-2">
        <Text variant="muted" className="text-sm">
          {queue.length === 0
            ? "Aucun contact"
            : `${currentIndex + 1} / ${queue.length}`}
        </Text>
        <TouchableOpacity onPress={onClose} className="p-2">
          <Feather name="x" size={22} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Pastilles de filtre */}
      <View className="mb-3">
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setActiveFilter(item.value);
                setCurrentIndex(0);
              }}
              className={`px-4 py-2 rounded-full border ${
                activeFilter === item.value
                  ? "bg-primary border-primary dark:border-primary"
                  : "bg-surface dark:bg-surface-dark border-border dark:border-border-dark"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  activeFilter === item.value
                    ? "text-onPrimary"
                    : "text-textMuted dark:text-textMuted-dark"
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Indication : il faut swiper */}
      <View className="items-center px-5 pb-2">
        <Text
          variant="muted"
          className="text-xs text-center"
          style={{ maxWidth: 320 }}
        >
          Gauche / droite = changer le statut. Glisse vers le haut ou appuie sur
          « Ignorer » pour passer sans modifier.
        </Text>
      </View>

      <View className="flex-1 items-center justify-center relative px-5">
        {remaining.length === 0 ? (
          <View className="items-center gap-3">
            <Text className="text-4xl">📋</Text>
            <Text variant="h3">
              {queue.length === 0 ? "Aucun contact" : "Plus de cartes"}
            </Text>
            <Text variant="muted" className="text-center">
              {queue.length === 0
                ? "Change de filtre ou ajoute des contacts."
                : "Tous les contacts de ce filtre ont été parcourus."}
            </Text>
            <TouchableOpacity
              onPress={() => setCurrentIndex(0)}
              className="mt-3 py-2 px-4 rounded-lg bg-primary/20"
            >
              <Text className="text-primary text-sm font-medium">
                Recommencer
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          [...remaining].reverse().map((contact, i) => (
            <SwipeCard
              key={contact.id}
              contact={contact}
              isTop={i === remaining.length - 1}
              index={remaining.length - 1 - i}
              onSwipeRight={handleSwipeRight}
              onSwipeLeft={handleSwipeLeft}
              onSwipeUp={handleSwipeUp}
            />
          ))
        )}
      </View>

      {lastAction && (
        <View className="items-center py-3">
          <Text variant="muted" className="text-xs">
            {lastAction}
          </Text>
        </View>
      )}
    </View>
  );
}
