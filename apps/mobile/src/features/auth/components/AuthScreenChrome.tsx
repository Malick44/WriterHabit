import { useMemo, type ComponentProps, type ReactNode } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type KeyboardTypeOptions,
  type ReturnKeyTypeOptions,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  getAccessibleHitSlop,
  getMinimumTouchTarget,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

export const authScreenColors = {
  background: "#F8F9FF",
  border: "#C3C6D5",
  danger: "#BA1A1A",
  inputBackground: "#EFF4FF",
  muted: "#434653",
  outline: "#737784",
  primary: "#00327D",
  primarySubtle: "rgba(0, 50, 125, 0.05)",
  secondary: "#006C49",
  surface: "#FFFFFF",
  surfaceContainer: "#DCE9FF",
  text: "#0B1C30",
} as const;

const patternCellSize = 24;

export type AuthSocialProvider = "google" | "apple";
export type AuthIconName = ComponentProps<typeof Ionicons>["name"];

type AuthScreenFrameProps = {
  title: string;
  subtitle: string;
  heroImageAccessibilityLabel: string;
  children: ReactNode;
  footer?: ReactNode;
  supportBadgeLabel?: string;
  supportBadgeAccessibilityLabel?: string;
  heroIconName?: AuthIconName;
  testID?: string;
  contentStyle?: StyleProp<ViewStyle>;
};

type AuthSocialButtonProps = {
  disabled: boolean;
  label: string;
  onPress: () => void;
  provider: AuthSocialProvider;
};

type AuthSeparatorProps = {
  label: string;
};

type AuthTextFieldProps = Omit<
  TextInputProps,
  "accessibilityLabel" | "placeholder" | "style" | "onChangeText" | "value"
> & {
  accessibilityLabel: string;
  error?: string;
  iconName: AuthIconName;
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
  keyboardType?: KeyboardTypeOptions;
  returnKeyType?: ReturnKeyTypeOptions;
};

type AuthSubmitButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  iconName?: AuthIconName;
  tone?: "primary" | "success";
};

type AuthFooterLinkProps = {
  prompt: string;
  linkLabel: string;
  onPress: () => void;
};

function BackgroundPattern({ width, height }: { width: number; height: number }) {
  const dots = useMemo(() => {
    const columns = Math.ceil(width / patternCellSize) + 1;
    const rows = Math.ceil(height / patternCellSize) + 1;

    return Array.from({ length: columns * rows }, (_, index) => ({
      id: index,
      left: (index % columns) * patternCellSize,
      top: Math.floor(index / columns) * patternCellSize,
    }));
  }, [height, width]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {dots.map((dot) => (
        <View
          key={dot.id}
          style={[
            styles.patternDot,
            {
              left: dot.left,
              top: dot.top,
            },
          ]}
        />
      ))}
    </View>
  );
}

export function AuthScreenFrame({
  title,
  subtitle,
  heroImageAccessibilityLabel,
  children,
  footer,
  supportBadgeLabel,
  supportBadgeAccessibilityLabel,
  heroIconName = "library",
  testID,
  contentStyle,
}: AuthScreenFrameProps) {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const isTablet = width >= 768;
  const showSupportBadge = width >= 1024 && supportBadgeLabel;
  const contentPadding = isTablet ? 40 : 32;

  return (
    <View style={styles.root} testID={testID}>
      <BackgroundPattern height={height} width={width} />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            minHeight: height,
            paddingBottom: Math.max(insets.bottom, 32),
            paddingTop: Math.max(insets.top, 32),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.hero}>
            <LinearGradient
              colors={[authScreenColors.primarySubtle, "rgba(255, 255, 255, 0)"]}
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
            />
            <Image
              accessibilityLabel={heroImageAccessibilityLabel}
              source={require("../../../../assets/generated/auth/sign-in-coach-hero.png")}
              style={styles.heroImage}
            />
            <View style={styles.heroIcon}>
              <Ionicons
                accessible={false}
                color="#FFFFFF"
                importantForAccessibility="no"
                name={heroIconName}
                size={27}
              />
            </View>
          </View>

          <View style={[styles.content, { padding: contentPadding }, contentStyle]}>
            <View style={styles.header}>
              <Text accessibilityRole="header" style={styles.title}>
                {title}
              </Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            {children}

            {footer}
          </View>
        </View>
      </ScrollView>

      {showSupportBadge ? (
        <View
          accessibilityLabel={supportBadgeAccessibilityLabel ?? supportBadgeLabel}
          style={[
            styles.supportBadge,
            {
              bottom: Math.max(insets.bottom, 32),
            },
          ]}
        >
          <View style={styles.supportIcon}>
            <Ionicons
              accessible={false}
              color="#FFFFFF"
              importantForAccessibility="no"
              name="help"
              size={23}
            />
          </View>
          <Text style={styles.supportText}>{supportBadgeLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function AuthSocialButton({ disabled, label, onPress, provider }: AuthSocialButtonProps) {
  const { settings } = useAccessibilityContext();
  const minHeight = Math.max(48, getMinimumTouchTarget(settings));
  const icon =
    provider === "google" ? (
      <FontAwesome
        accessible={false}
        color="#4285F4"
        importantForAccessibility="no"
        name="google"
        size={20}
      />
    ) : (
      <Ionicons
        accessible={false}
        color={authScreenColors.text}
        importantForAccessibility="no"
        name="logo-apple"
        size={22}
      />
    );

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={getAccessibleHitSlop(settings)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.socialButton,
        {
          minHeight,
        },
        pressed && !disabled ? styles.pressed : null,
      ]}
    >
      {icon}
      <Text style={styles.socialButtonText}>{label}</Text>
    </Pressable>
  );
}

export function AuthSeparator({ label }: AuthSeparatorProps) {
  return (
    <View style={styles.separator}>
      <View style={styles.separatorLine} />
      <Text style={styles.separatorText}>{label}</Text>
      <View style={styles.separatorLine} />
    </View>
  );
}

export function AuthTextField({
  accessibilityHint,
  accessibilityLabel,
  editable = true,
  error,
  iconName,
  label,
  placeholder,
  value,
  onChangeText,
  ...inputProps
}: AuthTextFieldProps) {
  const { settings } = useAccessibilityContext();
  const minimumTouchTarget = getMinimumTouchTarget(settings);

  return (
    <View style={styles.fieldStack}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View
        style={[
          styles.inputShell,
          {
            borderColor: error ? authScreenColors.danger : authScreenColors.border,
            minHeight: Math.max(48, minimumTouchTarget),
          },
        ]}
      >
        <Ionicons
          accessible={false}
          color={authScreenColors.outline}
          importantForAccessibility="no"
          name={iconName}
          size={20}
        />
        <TextInput
          accessibilityHint={accessibilityHint ?? error}
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ disabled: !editable }}
          editable={editable}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={authScreenColors.outline}
          style={styles.input}
          value={value}
          {...inputProps}
        />
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function AuthSubmitButton({
  label,
  onPress,
  disabled = false,
  accessibilityLabel,
  iconName = "sparkles",
  tone = "primary",
}: AuthSubmitButtonProps) {
  const { settings } = useAccessibilityContext();
  const minimumTouchTarget = getMinimumTouchTarget(settings);
  const backgroundColor = tone === "success" ? authScreenColors.secondary : authScreenColors.primary;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={getAccessibleHitSlop(settings)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.submitButton,
        {
          backgroundColor,
          minHeight: Math.max(56, minimumTouchTarget),
        },
        pressed && !disabled ? styles.pressed : null,
      ]}
    >
      <Text style={styles.submitButtonText}>{label}</Text>
      <Ionicons
        accessible={false}
        color="#FFFFFF"
        importantForAccessibility="no"
        name={iconName}
        size={22}
      />
    </Pressable>
  );
}

export function AuthFooterLink({ prompt, linkLabel, onPress }: AuthFooterLinkProps) {
  const { settings } = useAccessibilityContext();

  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>{prompt}</Text>
      <Pressable
        accessibilityLabel={linkLabel}
        accessibilityRole="button"
        hitSlop={getAccessibleHitSlop(settings)}
        onPress={onPress}
        style={({ pressed }) => [styles.footerLink, pressed ? styles.pressed : null]}
      >
        <Text style={styles.footerLinkText}>{linkLabel}</Text>
      </Pressable>
    </View>
  );
}

export const authScreenStyles = StyleSheet.create({
  form: {
    gap: 20,
  },
  helperText: {
    color: authScreenColors.muted,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    paddingHorizontal: 16,
    textAlign: "center",
  },
  roleList: {
    gap: 10,
  },
  socialStack: {
    gap: 12,
  },
  submitStack: {
    gap: 12,
  },
});

const styles = StyleSheet.create({
  card: {
    alignSelf: "center",
    backgroundColor: authScreenColors.surface,
    borderColor: authScreenColors.border,
    borderRadius: 24,
    borderWidth: 1,
    maxWidth: 480,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    width: "100%",
  },
  content: {
    gap: 32,
  },
  fieldError: {
    color: authScreenColors.danger,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    marginLeft: 4,
  },
  fieldLabel: {
    color: authScreenColors.muted,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    marginLeft: 4,
  },
  fieldStack: {
    gap: 6,
  },
  footer: {
    alignItems: "center",
    borderColor: authScreenColors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    justifyContent: "center",
    paddingTop: 24,
  },
  footerLink: {
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 8,
  },
  footerLinkText: {
    color: authScreenColors.primary,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  footerText: {
    color: authScreenColors.muted,
    fontSize: 16,
    lineHeight: 24,
  },
  header: {
    alignItems: "center",
    gap: 8,
  },
  hero: {
    alignItems: "center",
    aspectRatio: 4 / 3,
    backgroundColor: authScreenColors.background,
    justifyContent: "center",
    overflow: "hidden",
    padding: 24,
    position: "relative",
    width: "100%",
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: authScreenColors.primary,
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    width: 48,
  },
  heroImage: {
    height: "100%",
    opacity: 0.9,
    position: "absolute",
    resizeMode: "cover",
    width: "100%",
  },
  input: {
    color: authScreenColors.text,
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    minWidth: 0,
    padding: 0,
  },
  inputShell: {
    alignItems: "center",
    backgroundColor: authScreenColors.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
  },
  patternDot: {
    backgroundColor: authScreenColors.surfaceContainer,
    borderRadius: 1,
    height: 1,
    opacity: 0.85,
    position: "absolute",
    width: 1,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  root: {
    backgroundColor: authScreenColors.background,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  separator: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
  },
  separatorLine: {
    backgroundColor: authScreenColors.border,
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  separatorText: {
    color: authScreenColors.outline,
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 16,
    textTransform: "uppercase",
  },
  socialButton: {
    alignItems: "center",
    backgroundColor: authScreenColors.surface,
    borderColor: authScreenColors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  socialButtonText: {
    color: authScreenColors.text,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  submitButton: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 8,
    paddingHorizontal: 18,
    shadowColor: "#000000",
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 28,
    textAlign: "center",
  },
  subtitle: {
    color: authScreenColors.muted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  supportBadge: {
    alignItems: "center",
    backgroundColor: authScreenColors.surfaceContainer,
    borderColor: "#B1C5FF",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 16,
    position: "absolute",
    right: 32,
    shadowColor: "#000000",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  supportIcon: {
    alignItems: "center",
    backgroundColor: authScreenColors.primary,
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  supportText: {
    color: authScreenColors.primary,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 18,
    maxWidth: 120,
  },
  title: {
    color: authScreenColors.text,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 32,
    textAlign: "center",
  },
});
