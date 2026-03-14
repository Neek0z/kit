import { View, ViewProps } from "react-native";

interface CardProps extends ViewProps {
  padding?: "sm" | "md" | "lg";
}

const paddings = {
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function Card({
  padding = "md",
  className = "",
  children,
  ...props
}: CardProps & { className?: string }) {
  return (
    <View
      className={`bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-2xl ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
