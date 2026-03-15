import { useEffect, useRef } from "react";
import {
  View,
  Dimensions,
  Animated,
  PanResponder,
  TouchableOpacity,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from "react-native";
import { Text, Badge } from "../ui";
import { Contact, PIPELINE_LABELS, PipelineStatus } from "../../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const STEPS: PipelineStatus[] = ["new", "contacted", "interested", "follow_up", "client"];
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

const STATUS_VARIANTS: Record<
  PipelineStatus,
  "success" | "info" | "warning" | "neutral" | "danger"
> = {
  new: "neutral",
  contacted: "info",
  interested: "warning",
  follow_up: "danger",
  client: "success",
  inactive: "neutral",
};

interface SwipeCardProps {
  contact: Contact;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  onSwipeUp: () => void;
  isTop: boolean;
  index: number;
}

export function SwipeCard({
  contact,
  onSwipeRight,
  onSwipeLeft,
  onSwipeUp,
  isTop,
  index,
}: SwipeCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    translateX.setValue(0);
    translateY.setValue(0);
  }, [contact.id]);

  const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        isTop &&
        (Math.abs(gestureState.dx) > 8 || Math.abs(gestureState.dy) > 8),
      onPanResponderMove: (
        _e: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        if (!isTop) return;
        translateX.setValue(gestureState.dx);
        translateY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (
        _e: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        if (!isTop) return;
        const { dx, dy } = gestureState;
        if (dx > SWIPE_THRESHOLD) {
          Animated.timing(translateX, {
            toValue: SCREEN_WIDTH * 1.5,
            duration: 200,
            useNativeDriver: true,
          }).start(onSwipeRight);
        } else if (dx < -SWIPE_THRESHOLD) {
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH * 1.5,
            duration: 200,
            useNativeDriver: true,
          }).start(onSwipeLeft);
        } else if (dy < -SWIPE_THRESHOLD) {
          Animated.timing(translateY, {
            toValue: -600,
            duration: 200,
            useNativeDriver: true,
          }).start(onSwipeUp);
        } else {
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 80,
              friction: 10,
            }),
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 80,
              friction: 10,
            }),
          ]).start();
        }
      },
    });

  const rotate = translateX.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ["-15deg", "0deg", "15deg"],
    extrapolate: "clamp",
  });

  const cardScale = isTop ? 1 : index === 1 ? 0.97 : 0.94;
  const cardTranslateY = isTop ? 0 : index === 1 ? -8 : -16;

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const daysSince = contact.last_interaction_at
    ? Math.floor(
        (Date.now() - new Date(contact.last_interaction_at).getTime()) /
          86400000
      )
    : null;

  const currentStep = Math.max(0, STEPS.indexOf(contact.status as PipelineStatus));
  const prevStatusLabel = currentStep > 0 ? PIPELINE_LABELS[STEPS[currentStep - 1]] : null;
  const nextStatusLabel = currentStep < STEPS.length - 1 ? PIPELINE_LABELS[STEPS[currentStep + 1]] : null;

  return (
    <Animated.View
      {...(isTop ? panResponder.panHandlers : {})}
      style={[
        {
          position: "absolute",
          width: "100%",
          transform: [
            { scale: cardScale },
            { translateY: cardTranslateY },
            ...(isTop
              ? [
                  { translateX },
                  { translateY },
                  { rotate },
                ]
              : []),
          ],
        },
      ]}
    >
      <View
        className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-2xl px-6 py-6 min-h-[300px] items-center"
        style={{ marginHorizontal: 4 }}
      >
        {isTop && (
          <>
            <View
              style={{
                position: "absolute",
                top: 16,
                left: 16,
                backgroundColor: "rgba(248, 113, 113, 0.2)",
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 8,
              }}
            >
              <Text
                style={{ fontSize: 12, fontWeight: "600", color: "#f87171" }}
                numberOfLines={1}
              >
                ← {prevStatusLabel ?? "—"}
              </Text>
            </View>
            <View
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                backgroundColor: "rgba(29, 158, 117, 0.2)",
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 8,
              }}
            >
              <Text
                style={{ fontSize: 12, fontWeight: "600", color: "#1D9E75" }}
                numberOfLines={1}
              >
                {nextStatusLabel ?? "—"} →
              </Text>
            </View>
          </>
        )}

        <View className="w-[72px] h-[72px] rounded-full bg-primary/20 items-center justify-center mb-3">
          <Text className="text-primary text-xl font-semibold">
            {getInitials(contact.full_name)}
          </Text>
        </View>

        <Text variant="h2" className="text-center mb-1">
          {contact.full_name}
        </Text>

        {daysSince !== null && (
          <Text variant="muted" className="text-xs mb-3">
            Dernier contact il y a {daysSince} jour{daysSince > 1 ? "s" : ""}
          </Text>
        )}

        <Badge
          label={
            PIPELINE_LABELS[contact.status as PipelineStatus] ?? contact.status
          }
          variant={
            STATUS_VARIANTS[contact.status as PipelineStatus] ?? "neutral"
          }
        />

        {contact.notes && (
          <View className="mt-4 bg-background dark:bg-background-dark rounded-xl p-3 w-full">
            <Text
              variant="muted"
              className="text-xs leading-relaxed"
              numberOfLines={3}
            >
              "{contact.notes}"
            </Text>
          </View>
        )}

        {contact.phone && (
          <Text variant="muted" className="text-xs mt-3">
            {contact.phone}
          </Text>
        )}

        {isTop && (
          <TouchableOpacity
            onPress={onSwipeUp}
            className="mt-4 py-2.5 px-5 rounded-xl border border-border dark:border-border-dark"
            activeOpacity={0.7}
          >
            <Text variant="muted" className="text-sm font-medium">
              Ignorer
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}
