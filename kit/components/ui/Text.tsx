import { Text as RNText, TextProps } from "react-native";

interface KitTextProps extends TextProps {
  variant?: "h1" | "h2" | "h3" | "body" | "small" | "muted";
}

const variants = {
  h1: "text-2xl font-bold text-textMain dark:text-textMain-dark tracking-tight",
  h2: "text-xl font-bold text-textMain dark:text-textMain-dark tracking-tight",
  h3: "text-lg font-semibold text-textMain dark:text-textMain-dark",
  body: "text-base text-textMain dark:text-textMain-dark leading-relaxed",
  small: "text-sm text-textMain dark:text-textMain-dark",
  muted: "text-sm text-textMuted dark:text-textMuted-dark",
};

export function Text({
  variant = "body",
  className = "",
  ...props
}: KitTextProps & { className?: string }) {
  return (
    <RNText
      className={`${variants[variant]} ${className}`}
      {...props}
    />
  );
}
