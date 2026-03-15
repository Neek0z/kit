import { useRef, useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  PanResponder,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from "react-native";
import { PipelineStatus, PIPELINE_LABELS } from "../../types";

const STEPS: PipelineStatus[] = ["new", "contacted", "interested", "follow_up", "client"];

const STEP_COLORS: Record<PipelineStatus, string> = {
  new: "#64748b",
  contacted: "#378ADD",
  interested: "#1D9E75",
  follow_up: "#BA7517",
  client: "#639922",
  inactive: "#334155",
};

const THUMB_SIZE = 28;
const TRACK_HEIGHT = 8;

interface PipelineArcProps {
  status: PipelineStatus;
  onChange: (status: PipelineStatus) => void;
}

export function PipelineArc({ status, onChange }: PipelineArcProps) {
  const currentIndex = Math.max(0, STEPS.indexOf(status));
  const color = STEP_COLORS[status] ?? STEP_COLORS.new;
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const indexToX = useCallback((index: number) => {
    const w = trackWidthRef.current || trackWidth;
    if (w <= 0) return 0;
    const step = (w - THUMB_SIZE) / (STEPS.length - 1);
    return index * step;
  }, [trackWidth]);

  const xToIndex = useCallback((x: number) => {
    const w = trackWidthRef.current || trackWidth;
    if (w <= 0) return 0;
    const step = (w - THUMB_SIZE) / (STEPS.length - 1);
    if (step <= 0) return 0;
    const index = Math.round(x / step);
    return Math.max(0, Math.min(STEPS.length - 1, index));
  }, [trackWidth]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {},
      onPanResponderMove: (
        _e: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        const w = trackWidthRef.current;
        if (w <= 0) return;
        const step = (w - THUMB_SIZE) / (STEPS.length - 1);
        const startX = currentIndexRef.current * step;
        const newX = startX + gestureState.dx;
        const clampedX = Math.max(0, Math.min(w - THUMB_SIZE, newX));
        const newIndex = Math.round(clampedX / step);
        const clampedIndex = Math.max(0, Math.min(STEPS.length - 1, newIndex));
        if (clampedIndex !== currentIndexRef.current) {
          onChange(STEPS[clampedIndex]);
        }
      },
      onPanResponderRelease: (
        _e: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        const w = trackWidthRef.current;
        if (w <= 0) return;
        const step = (w - THUMB_SIZE) / (STEPS.length - 1);
        const startX = currentIndexRef.current * step;
        const newX = startX + gestureState.dx;
        const clampedX = Math.max(0, Math.min(w - THUMB_SIZE, newX));
        const newIndex = Math.round(clampedX / step);
        const clampedIndex = Math.max(0, Math.min(STEPS.length - 1, newIndex));
        onChange(STEPS[clampedIndex]);
      },
    })
  ).current;

  return (
    <View className="gap-3">
      {/* Piste + curseur */}
      <View
        className="w-full"
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0) {
            trackWidthRef.current = w;
            setTrackWidth(w);
          }
        }}
      >
        <View
          style={{
            height: TRACK_HEIGHT,
            borderRadius: TRACK_HEIGHT / 2,
            backgroundColor: "#334155",
            marginHorizontal: THUMB_SIZE / 2,
            marginTop: (THUMB_SIZE - TRACK_HEIGHT) / 2,
          }}
        >
          {/* Partie remplie (progression) */}
          {(trackWidth || trackWidthRef.current) > 0 && (
            <View
              style={{
                position: "absolute",
                left: THUMB_SIZE / 2,
                top: 0,
                height: TRACK_HEIGHT,
                width: Math.max(
                  0,
                  ((trackWidthRef.current || trackWidth) - THUMB_SIZE) *
                    (currentIndex / (STEPS.length - 1))
                ),
                borderRadius: TRACK_HEIGHT / 2,
                backgroundColor: color,
              }}
            />
          )}
        </View>

        {/* Curseur glissant */}
        <View
          {...panResponder.panHandlers}
          style={{
            position: "absolute",
            left: indexToX(currentIndex),
            top: 0,
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: THUMB_SIZE / 2,
            backgroundColor: color,
            borderWidth: 3,
            borderColor: "rgba(255,255,255,0.4)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 4,
          }}
        />

        {/* Zones tactiles sur les étapes (tap = aller directement) */}
        {STEPS.map((step, i) => (
          <TouchableOpacity
            key={step}
            onPress={() => onChange(step)}
            style={{
              position: "absolute",
              left: indexToX(i) - 4,
              top: 0,
              width: THUMB_SIZE + 8,
              height: THUMB_SIZE,
            }}
          />
        ))}
      </View>

      {/* Labels sous la piste */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingHorizontal: 2,
        }}
      >
        {STEPS.map((step, i) => {
          const isCurrent = i === currentIndex;
          return (
            <Text
              key={step}
              numberOfLines={1}
              style={{
                fontSize: 10,
                maxWidth: `${100 / STEPS.length}%`,
                textAlign: "center",
                color: isCurrent ? color : "#64748b",
                fontWeight: isCurrent ? "600" : "400",
              }}
            >
              {PIPELINE_LABELS[step]}
            </Text>
          );
        })}
      </View>
    </View>
  );
}
