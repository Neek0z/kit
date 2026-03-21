import { useRef, useEffect, useMemo, useCallback } from "react";
import { useLocalSearchParams } from "expo-router";
import {
  View,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuthContext } from "../../../lib/AuthContext";
import { Header } from "../../../components/layout";
import { Text } from "../../../components/ui";
import { MessageBubble, MessageInput } from "../../../components/messages";
import { useMessages } from "../../../hooks/useMessages";
import { useConversationDetails } from "../../../hooks/useConversationDetails";
import { useContacts } from "../../../hooks/useContacts";
import { useInteractions } from "../../../hooks/useInteractions";
import { useToast } from "../../../lib/ToastContext";
import { useTheme } from "../../../lib/theme";

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthContext();
  const listRef = useRef<FlatList>(null);
  const theme = useTheme();
  const { showToast } = useToast();
  const {
    otherParticipant,
    isGroup,
    groupPreview,
    participants,
    loading: detailsLoading,
  } = useConversationDetails(id ?? null);
  const { messages, loading: messagesLoading, sending, sendMessage } =
    useMessages(id ?? null);
  const { contacts } = useContacts();
  const contactMatch =
    !isGroup && otherParticipant?.email
      ? contacts.find(
          (c) =>
            c.email?.toLowerCase() === otherParticipant.email?.toLowerCase()
        )
      : null;
  const { addInteraction } = useInteractions(contactMatch?.id ?? "");

  const senderLabelByUserId = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of participants) {
      m.set(p.id, p.full_name?.trim() || p.email || "Membre");
    }
    return m;
  }, [participants]);

  const renderMessage = useCallback(
    ({ item }: { item: (typeof messages)[number] }) => (
      <View className="px-4 py-1">
        <MessageBubble
          message={item}
          isOwn={item.sender_id === user?.id}
          senderLabel={
            isGroup && item.sender_id !== user?.id
              ? senderLabelByUserId.get(item.sender_id) ?? "Membre"
              : undefined
          }
        />
      </View>
    ),
    [user?.id, isGroup, senderLabelByUserId]
  );

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  const displayName = isGroup
    ? groupPreview?.name ?? "Groupe"
    : otherParticipant?.full_name || otherParticipant?.email || "Conversation";

  const subtitle = isGroup
    ? `${participants.length} participant${participants.length > 1 ? "s" : ""}`
    : otherParticipant?.email;

  if (detailsLoading) {
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
      <Header
        title={displayName}
        showBack
        subtitle={subtitle}
        rightAction={
          contactMatch
            ? {
                icon: "user",
                onPress: () =>
                  router.push(`/(app)/contacts/${contactMatch.id}`),
              }
            : undefined
        }
      />
      {isGroup && !groupPreview && (
        <View className="mx-5 py-2 border-b border-border dark:border-border-dark">
          <Text variant="muted" className="text-xs">
            Le groupe source a été supprimé — la conversation reste disponible.
          </Text>
        </View>
      )}
      {contactMatch && !isGroup && (
        <TouchableOpacity
          onPress={async () => {
            const ok = await addInteraction(
              contactMatch.id,
              "message",
              "Conversation KIT"
            );
            if (ok) {
              showToast("Interaction ajoutée");
              router.push(`/(app)/contacts/${contactMatch.id}`);
            }
          }}
          className="mx-5 py-2.5 flex-row items-center gap-2 border-b border-border dark:border-border-dark"
        >
          <Feather name="check-circle" size={16} color={theme.primary} />
          <Text className="text-primary text-sm font-medium">
            Enregistrer comme interaction
          </Text>
        </TouchableOpacity>
      )}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {messagesLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : messages.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text variant="muted" className="text-center">
              Aucun message. Envoie le premier.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={{
              paddingVertical: 12,
              paddingBottom: 8,
            }}
            windowSize={15}
            initialNumToRender={20}
            maxToRenderPerBatch={10}
            removeClippedSubviews={true}
            keyboardShouldPersistTaps="handled"
          />
        )}
        <MessageInput onSend={sendMessage} sending={sending} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
