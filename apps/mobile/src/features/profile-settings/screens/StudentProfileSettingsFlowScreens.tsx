import { useCallback, useEffect, useMemo, useState, type ComponentProps, type ReactNode } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { WritingGoal } from "@writewise/shared";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthSession } from "@/core/auth/useAuthSession";
import { notificationDeliveryService } from "@/core/notifications/notificationDeliveryService";
import { defaultNotificationPreferences, type NotificationPreferences } from "@/core/notifications/notificationService";
import { layout, radius, spacing, typography } from "@/design/tokens";
import { useI18n, type TranslationKey } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { Card } from "@/shared/components/cards";
import { ErrorState, LoadingState, StatusState, SuccessState } from "@/shared/components/feedback";
import { CheckboxRow, ChoiceCard, TextField } from "@/shared/components/forms";
import { AppHeader } from "@/shared/components/navigation";
import {
  getAccessibleTextStyle,
  getMinimumTouchTarget,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { notificationPreferencesService } from "../services/notificationPreferencesService";
import {
  getDefaultStudentProfileSettingsPreferences,
  isGradeLevel,
  profileDailyPracticeOptions,
  profileLanguageOptions,
  studentProfileSettingsPreferenceService,
  type ProfileDailyPracticeMinutes,
  type ProfileLanguage,
} from "../services/studentProfileSettingsPreferenceService";

type IconName = ComponentProps<typeof Ionicons>["name"];
type LoadState = "loading" | "ready" | "error";

const settingsFlowColors = {
  background: "#F8F9FF",
  border: "#C3C6D5",
  muted: "#434653",
  primary: "#00327D",
  surface: "#FFFFFF",
  surfaceSoft: "#EFF4FF",
  text: "#0B1C30",
} as const;

const editableGoals = [
  {
    descriptionKey: "profileSettings.goals.goalOptions.grammar.description",
    icon: "text-outline",
    labelKey: "profileSettings.goals.goalOptions.grammar.label",
    value: "improve_grammar",
  },
  {
    descriptionKey: "profileSettings.goals.goalOptions.paragraphs.description",
    icon: "list-outline",
    labelKey: "profileSettings.goals.goalOptions.paragraphs.label",
    value: "write_paragraphs",
  },
  {
    descriptionKey: "profileSettings.goals.goalOptions.creative.description",
    icon: "bulb-outline",
    labelKey: "profileSettings.goals.goalOptions.creative.label",
    value: "creative_writing",
  },
  {
    descriptionKey: "profileSettings.goals.goalOptions.handwriting.description",
    icon: "pencil-outline",
    labelKey: "profileSettings.goals.goalOptions.handwriting.label",
    value: "improve_handwriting",
  },
  {
    descriptionKey: "profileSettings.goals.goalOptions.spelling.description",
    icon: "sparkles-outline",
    labelKey: "profileSettings.goals.goalOptions.spelling.label",
    value: "improve_spelling",
  },
] as const satisfies readonly {
  descriptionKey: TranslationKey;
  icon: IconName;
  labelKey: TranslationKey;
  value: WritingGoal;
}[];

const dailyPracticeKeyByValue = {
  5: "five",
  10: "ten",
  15: "fifteen",
  20: "twenty",
  30: "thirty",
} as const satisfies Record<ProfileDailyPracticeMinutes, string>;

const dailyPracticeChoices = profileDailyPracticeOptions.map((value) => {
  const key = dailyPracticeKeyByValue[value];

  return {
    descriptionKey: `profileSettings.goals.dailyPracticeOptions.${key}.description`,
    labelKey: `profileSettings.goals.dailyPracticeOptions.${key}.label`,
    value,
  };
}) as readonly {
  descriptionKey: TranslationKey;
  labelKey: TranslationKey;
  value: ProfileDailyPracticeMinutes;
}[];

const languageChoices = profileLanguageOptions.map((value) => ({
  descriptionKey: `profileSettings.language.options.${value}.description` as TranslationKey,
  labelKey: `profileSettings.language.options.${value}.label` as TranslationKey,
  value,
})) as readonly {
  descriptionKey: TranslationKey;
  labelKey: TranslationKey;
  value: ProfileLanguage;
}[];

function ProfileSettingsScaffold({
  backAccessibilityLabelKey,
  children,
  subtitle,
  testID,
  titleKey,
}: {
  backAccessibilityLabelKey: TranslationKey;
  children: ReactNode;
  subtitle: string;
  testID: string;
  titleKey: TranslationKey;
}) {
  const insets = useSafeAreaInsets();
  const { settings } = useAccessibilityContext();

  return (
    <View style={styles.root}>
      <AppHeader
        leftAction={{
          accessibilityLabelKey: backAccessibilityLabelKey,
          type: "back",
        }}
        style={styles.header}
        titleKey={titleKey}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(insets.bottom + 40, 64),
          },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        testID={testID}
      >
        <View style={styles.content}>
          <Text
            selectable
            style={[getAccessibleTextStyle(typography.gradeBands.middle.body, settings), styles.subtitle]}
          >
            {subtitle}
          </Text>
          {children}
        </View>
      </ScrollView>
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  const { settings } = useAccessibilityContext();

  return (
    <Text
      accessibilityRole="header"
      selectable
      style={[getAccessibleTextStyle(typography.gradeBands.middle.title, settings), styles.sectionLabel]}
    >
      {children}
    </Text>
  );
}

function IconRow({
  children,
  icon,
}: {
  children: ReactNode;
  icon: IconName;
}) {
  return (
    <View style={styles.iconRow}>
      <View style={styles.iconBadge}>
        <Ionicons color={settingsFlowColors.primary} name={icon} size={22} />
      </View>
      <View style={styles.iconRowBody}>{children}</View>
    </View>
  );
}

function SettingsLoadState({
  onRetry,
  state,
}: {
  onRetry: () => void;
  state: LoadState;
}) {
  const { t } = useI18n();

  if (state === "loading") {
    return (
      <LoadingState
        description={t("profileSettings.loadingDescription")}
        label={t("profileSettings.loadingTitle")}
      />
    );
  }

  if (state === "error") {
    return (
      <ErrorState
        actionLabel={t("common.retry")}
        description={t("profileSettings.loadErrorDescription")}
        onActionPress={onRetry}
        title={t("profileSettings.loadErrorTitle")}
      />
    );
  }

  return null;
}

function useStudentProfilePreferenceState() {
  const { session, setSession } = useAuthSession();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [preferences, setPreferences] = useState(() =>
    getDefaultStudentProfileSettingsPreferences({
      displayName: session?.user.displayName,
      gradeLevel: session?.user.gradeLevel,
    }),
  );
  const [reloadCount, setReloadCount] = useState(0);
  const studentId = session?.user.id ?? "preview-student";
  const defaultPreferences = useMemo(
    () =>
      getDefaultStudentProfileSettingsPreferences({
        displayName: session?.user.displayName,
        gradeLevel: session?.user.gradeLevel,
      }),
    [session?.user.displayName, session?.user.gradeLevel],
  );

  useEffect(() => {
    let active = true;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- restarts the loading state whenever the storage fetch re-runs
    setLoadState("loading");
    void studentProfileSettingsPreferenceService
      .getPreferences(studentId, defaultPreferences)
      .then((storedPreferences) => {
        if (!active) {
          return;
        }

        setPreferences(storedPreferences);
        setLoadState("ready");
      })
      .catch(() => {
        if (active) {
          setLoadState("error");
        }
      });

    return () => {
      active = false;
    };
  }, [defaultPreferences, reloadCount, studentId]);

  const retry = useCallback(() => {
    setReloadCount((count) => count + 1);
  }, []);

  return {
    defaultPreferences,
    loadState,
    preferences,
    retry,
    session,
    setSession,
    setPreferences,
    studentId,
  };
}

function SavedState({ description, title }: { description: string; title: string }) {
  return <SuccessState description={description} title={title} />;
}

function SaveErrorState() {
  const { t } = useI18n();

  return (
    <StatusState
      description={t("profileSettings.saveErrorDescription")}
      title={t("profileSettings.saveErrorTitle")}
      tone="error"
    />
  );
}

export function EditProfileSettingsScreen() {
  const { t } = useI18n();
  const {
    defaultPreferences,
    loadState,
    preferences,
    retry,
    session,
    setSession,
    setPreferences,
    studentId,
  } = useStudentProfilePreferenceState();
  const [gradeInput, setGradeInput] = useState(String(preferences.gradeLevel));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [validationErrorKey, setValidationErrorKey] = useState<TranslationKey | null>(null);

  useEffect(() => {
    if (loadState === "ready") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs the stored grade level into the editable input once preferences load
      setGradeInput(String(preferences.gradeLevel));
    }
  }, [loadState, preferences.gradeLevel]);

  const handleSave = useCallback(() => {
    const trimmedDisplayName = preferences.displayName.trim();
    const parsedGrade = Number.parseInt(gradeInput, 10);

    if (!trimmedDisplayName) {
      setValidationErrorKey("profileSettings.editProfile.fields.displayName.error");
      return;
    }

    if (!isGradeLevel(parsedGrade)) {
      setValidationErrorKey("profileSettings.editProfile.fields.grade.error");
      return;
    }

    setSaving(true);
    setSaveError(false);
    setValidationErrorKey(null);
    void studentProfileSettingsPreferenceService
      .updatePreferences(
        studentId,
        {
          displayName: trimmedDisplayName,
          gradeLevel: parsedGrade,
          learningFocusNote: preferences.learningFocusNote,
        },
        defaultPreferences,
      )
      .then((nextPreferences) => {
        setPreferences(nextPreferences);
        setGradeInput(String(nextPreferences.gradeLevel));
        if (session) {
          setSession({
            ...session,
            user: {
              ...session.user,
              displayName: nextPreferences.displayName,
              gradeLevel: nextPreferences.gradeLevel,
            },
          });
        }
        setSaved(true);
      })
      .catch(() => {
        setSaveError(true);
      })
      .finally(() => {
        setSaving(false);
      });
  }, [
    defaultPreferences,
    gradeInput,
    preferences.displayName,
    preferences.learningFocusNote,
    session,
    setSession,
    setPreferences,
    studentId,
  ]);

  const loadContent = <SettingsLoadState onRetry={retry} state={loadState} />;

  return (
    <ProfileSettingsScaffold
      backAccessibilityLabelKey="profileSettings.editProfile.headerBackAccessibility"
      subtitle={t("profileSettings.editProfile.subtitle")}
      testID="student-edit-profile-settings-screen"
      titleKey="profileSettings.editProfile.title"
    >
      {loadContent}
      {loadState === "ready" ? (
        <>
          {saved ? (
            <SavedState
              description={t("profileSettings.editProfile.savedDescription")}
              title={t("profileSettings.editProfile.savedTitle")}
            />
          ) : null}
          {saveError ? <SaveErrorState /> : null}
          <Card contentStyle={styles.cardStack}>
            <TextField
              accessibilityLabel={t("profileSettings.editProfile.fields.displayName.label")}
              error={validationErrorKey === "profileSettings.editProfile.fields.displayName.error" ? t(validationErrorKey) : undefined}
              hint={t("profileSettings.editProfile.fields.displayName.hint")}
              label={t("profileSettings.editProfile.fields.displayName.label")}
              onChangeText={(value) => {
                setSaved(false);
                setValidationErrorKey(null);
                setPreferences((current) => ({ ...current, displayName: value }));
              }}
              placeholder={t("profileSettings.editProfile.fields.displayName.placeholder")}
              value={preferences.displayName}
            />
            <TextField
              accessibilityLabel={t("profileSettings.editProfile.fields.grade.label")}
              error={validationErrorKey === "profileSettings.editProfile.fields.grade.error" ? t(validationErrorKey) : undefined}
              hint={t("profileSettings.editProfile.fields.grade.hint")}
              keyboardType="number-pad"
              label={t("profileSettings.editProfile.fields.grade.label")}
              maxLength={2}
              onChangeText={(value) => {
                setSaved(false);
                setValidationErrorKey(null);
                setGradeInput(value);
              }}
              value={gradeInput}
            />
            <TextField
              accessibilityLabel={t("profileSettings.editProfile.fields.email.label")}
              editable={false}
              hint={t("profileSettings.editProfile.fields.email.hint")}
              label={t("profileSettings.editProfile.fields.email.label")}
              value={session?.user.email ?? t("common.unavailable")}
            />
            <TextField
              accessibilityLabel={t("profileSettings.editProfile.fields.focus.label")}
              hint={t("profileSettings.editProfile.fields.focus.hint")}
              label={t("profileSettings.editProfile.fields.focus.label")}
              multiline
              onChangeText={(value) => {
                setSaved(false);
                setPreferences((current) => ({ ...current, learningFocusNote: value }));
              }}
              placeholder={t("profileSettings.editProfile.fields.focus.placeholder")}
              value={preferences.learningFocusNote}
            />
          </Card>
          <Button
            accessibilityLabel={t("profileSettings.editProfile.saveAccessibility")}
            fullWidth
            label={t("profileSettings.editProfile.save")}
            loading={saving}
            onPress={handleSave}
          />
        </>
      ) : null}
    </ProfileSettingsScaffold>
  );
}

function toggleGoal(currentGoals: WritingGoal[], goal: WritingGoal): WritingGoal[] {
  if (currentGoals.includes(goal)) {
    return currentGoals.filter((currentGoal) => currentGoal !== goal);
  }

  return [...currentGoals, goal];
}

export function WritingGoalsSettingsScreen() {
  const { t } = useI18n();
  const {
    defaultPreferences,
    loadState,
    preferences,
    retry,
    setPreferences,
    studentId,
  } = useStudentProfilePreferenceState();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const handleSave = useCallback(() => {
    if (preferences.writingGoals.length === 0) {
      setShowValidation(true);
      return;
    }

    setSaving(true);
    setSaveError(false);
    setShowValidation(false);
    void studentProfileSettingsPreferenceService
      .updatePreferences(
        studentId,
        {
          dailyPracticeMinutes: preferences.dailyPracticeMinutes,
          writingGoals: preferences.writingGoals,
        },
        defaultPreferences,
      )
      .then((nextPreferences) => {
        setPreferences(nextPreferences);
        setSaved(true);
      })
      .catch(() => {
        setSaveError(true);
      })
      .finally(() => {
        setSaving(false);
      });
  }, [
    defaultPreferences,
    preferences.dailyPracticeMinutes,
    preferences.writingGoals,
    setPreferences,
    studentId,
  ]);

  return (
    <ProfileSettingsScaffold
      backAccessibilityLabelKey="profileSettings.goals.headerBackAccessibility"
      subtitle={t("profileSettings.goals.subtitle")}
      testID="student-writing-goals-settings-screen"
      titleKey="profileSettings.goals.title"
    >
      <SettingsLoadState onRetry={retry} state={loadState} />
      {loadState === "ready" ? (
        <>
          {saved ? (
            <SavedState
              description={t("profileSettings.goals.savedDescription")}
              title={t("profileSettings.goals.savedTitle")}
            />
          ) : null}
          {saveError ? <SaveErrorState /> : null}
          {showValidation ? (
            <StatusState
              description={t("profileSettings.goals.validationDescription")}
              title={t("profileSettings.goals.validationTitle")}
              tone="warning"
            />
          ) : null}
          <SectionLabel>{t("profileSettings.goals.sections.writingGoals")}</SectionLabel>
          <Card contentStyle={styles.cardStack}>
            {editableGoals.map((goal) => {
              const selected = preferences.writingGoals.includes(goal.value);

              return (
                <IconRow icon={goal.icon} key={goal.value}>
                  <CheckboxRow
                    accessibilityHint={t("profileSettings.goals.goalAccessibilityHint")}
                    checked={selected}
                    description={t(goal.descriptionKey)}
                    label={t(goal.labelKey)}
                    onPress={() => {
                      setSaved(false);
                      setShowValidation(false);
                      setPreferences((current) => ({
                        ...current,
                        writingGoals: toggleGoal(current.writingGoals, goal.value),
                      }));
                    }}
                  />
                </IconRow>
              );
            })}
          </Card>

          <SectionLabel>{t("profileSettings.goals.sections.dailyPractice")}</SectionLabel>
          <View style={styles.choiceStack}>
            {dailyPracticeChoices.map((choice) => (
              <ChoiceCard
                description={t(choice.descriptionKey)}
                key={choice.value}
                label={t(choice.labelKey)}
                onPress={() => {
                  setSaved(false);
                  setPreferences((current) => ({
                    ...current,
                    dailyPracticeMinutes: choice.value,
                  }));
                }}
                selected={preferences.dailyPracticeMinutes === choice.value}
              />
            ))}
          </View>
          <Button
            accessibilityLabel={t("profileSettings.goals.saveAccessibility")}
            fullWidth
            label={t("profileSettings.goals.save")}
            loading={saving}
            onPress={handleSave}
          />
        </>
      ) : null}
    </ProfileSettingsScaffold>
  );
}

function NotificationSwitchRow({
  disabled = false,
  icon,
  label,
  onValueChange,
  value,
}: {
  disabled?: boolean;
  icon: IconName;
  label: string;
  onValueChange: (value: boolean) => void;
  value: boolean;
}) {
  const { settings } = useAccessibilityContext();
  const minimumTouchTarget = getMinimumTouchTarget(settings);

  return (
    <View
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      accessible
      style={[
        styles.notificationRow,
        { minHeight: Math.max(64, minimumTouchTarget + spacing.lg) },
        disabled ? styles.disabledRow : null,
      ]}
    >
      <View style={styles.notificationRowLabel}>
        <View style={styles.iconBadge}>
          <Ionicons color={settingsFlowColors.primary} name={icon} size={22} />
        </View>
        <Text
          numberOfLines={2}
          selectable
          style={[getAccessibleTextStyle(typography.gradeBands.middle.body, settings), styles.notificationRowText]}
        >
          {label}
        </Text>
      </View>
      <Switch
        accessibilityLabel={label}
        disabled={disabled}
        ios_backgroundColor={settingsFlowColors.border}
        onValueChange={onValueChange}
        thumbColor={settingsFlowColors.surface}
        trackColor={{
          false: settingsFlowColors.border,
          true: settingsFlowColors.primary,
        }}
        value={value}
      />
    </View>
  );
}

export function NotificationSettingsScreen() {
  const { session } = useAuthSession();
  const { t } = useI18n();
  const studentId = session?.user.id ?? "preview-student";
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultNotificationPreferences);
  const [reloadCount, setReloadCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    let active = true;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- restarts the loading state whenever the storage fetch re-runs
    setLoadState("loading");
    void notificationPreferencesService
      .getPreferences(studentId)
      .then((storedPreferences) => {
        if (!active) {
          return;
        }

        setPreferences(storedPreferences);
        setLoadState("ready");
      })
      .catch(() => {
        if (active) {
          setLoadState("error");
        }
      });

    return () => {
      active = false;
    };
  }, [reloadCount, studentId]);

  const handleSave = useCallback(() => {
    setSaving(true);
    setSaveError(false);
    void notificationPreferencesService
      .updatePreferences(studentId, preferences)
      .then((nextPreferences) => {
        setPreferences(nextPreferences);
        void notificationDeliveryService
          .syncNotificationDelivery({
            preferences: nextPreferences,
            studentId,
          })
          .catch(() => undefined);
        setSaved(true);
      })
      .catch(() => {
        setSaveError(true);
      })
      .finally(() => {
        setSaving(false);
      });
  }, [preferences, studentId]);

  return (
    <ProfileSettingsScaffold
      backAccessibilityLabelKey="profileSettings.notifications.headerBackAccessibility"
      subtitle={t("profileSettings.notifications.subtitle")}
      testID="student-notification-settings-screen"
      titleKey="profileSettings.notifications.title"
    >
      <SettingsLoadState onRetry={() => setReloadCount((count) => count + 1)} state={loadState} />
      {loadState === "ready" ? (
        <>
          <StatusState
            description={t("profileSettings.notifications.deliveryNoticeDescription")}
            title={t("profileSettings.notifications.deliveryNoticeTitle")}
            tone="info"
          />
          {saved ? (
            <SavedState
              description={t("profileSettings.notifications.savedDescription")}
              title={t("profileSettings.notifications.savedTitle")}
            />
          ) : null}
          {saveError ? <SaveErrorState /> : null}
          <Card contentStyle={styles.cardStack}>
            <NotificationSwitchRow
              icon="notifications-outline"
              label={t("profileSettings.notifications.toggles.all")}
              onValueChange={(enabled) => {
                setSaved(false);
                setPreferences((current) => ({ ...current, enabled }));
              }}
              value={preferences.enabled}
            />
            <NotificationSwitchRow
              disabled={!preferences.enabled}
              icon="calendar-outline"
              label={t("profileSettings.notifications.toggles.dailyAssignment")}
              onValueChange={(enabled) => {
                setSaved(false);
                setPreferences((current) => ({
                  ...current,
                  dailyAssignment: { ...current.dailyAssignment, enabled },
                }));
              }}
              value={preferences.dailyAssignment.enabled}
            />
            <NotificationSwitchRow
              disabled={!preferences.enabled}
              icon="flame-outline"
              label={t("profileSettings.notifications.toggles.streak")}
              onValueChange={(enabled) => {
                setSaved(false);
                setPreferences((current) => ({
                  ...current,
                  streak: { ...current.streak, enabled },
                }));
              }}
              value={preferences.streak.enabled}
            />
            <NotificationSwitchRow
              disabled={!preferences.enabled}
              icon="document-text-outline"
              label={t("profileSettings.notifications.toggles.incompleteAssignment")}
              onValueChange={(enabled) => {
                setSaved(false);
                setPreferences((current) => ({
                  ...current,
                  incompleteAssignment: { ...current.incompleteAssignment, enabled },
                }));
              }}
              value={preferences.incompleteAssignment.enabled}
            />
            <NotificationSwitchRow
              disabled={!preferences.enabled}
              icon="stats-chart-outline"
              label={t("profileSettings.notifications.toggles.weeklyReport")}
              onValueChange={(enabled) => {
                setSaved(false);
                setPreferences((current) => ({
                  ...current,
                  weeklyReport: { ...current.weeklyReport, enabled },
                }));
              }}
              value={preferences.weeklyReport.enabled}
            />
          </Card>
          <Button
            accessibilityLabel={t("profileSettings.notifications.saveAccessibility")}
            fullWidth
            label={t("profileSettings.notifications.save")}
            loading={saving}
            onPress={handleSave}
          />
        </>
      ) : null}
    </ProfileSettingsScaffold>
  );
}

export function LanguageSettingsScreen() {
  const { t } = useI18n();
  const {
    defaultPreferences,
    loadState,
    preferences,
    retry,
    setPreferences,
    studentId,
  } = useStudentProfilePreferenceState();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const handleSave = useCallback(() => {
    setSaving(true);
    setSaveError(false);
    void studentProfileSettingsPreferenceService
      .updatePreferences(studentId, { language: preferences.language }, defaultPreferences)
      .then((nextPreferences) => {
        setPreferences(nextPreferences);
        setSaved(true);
      })
      .catch(() => {
        setSaveError(true);
      })
      .finally(() => {
        setSaving(false);
      });
  }, [defaultPreferences, preferences.language, setPreferences, studentId]);

  return (
    <ProfileSettingsScaffold
      backAccessibilityLabelKey="profileSettings.language.headerBackAccessibility"
      subtitle={t("profileSettings.language.subtitle")}
      testID="student-language-settings-screen"
      titleKey="profileSettings.language.title"
    >
      <SettingsLoadState onRetry={retry} state={loadState} />
      {loadState === "ready" ? (
        <>
          {saved ? (
            <SavedState
              description={t("profileSettings.language.savedDescription")}
              title={t("profileSettings.language.savedTitle")}
            />
          ) : null}
          {saveError ? <SaveErrorState /> : null}
          <View style={styles.choiceStack}>
            {languageChoices.map((language) => (
              <ChoiceCard
                description={t(language.descriptionKey)}
                key={language.value}
                label={t(language.labelKey)}
                onPress={() => {
                  setSaved(false);
                  setPreferences((current) => ({
                    ...current,
                    language: language.value,
                  }));
                }}
                selected={preferences.language === language.value}
              />
            ))}
          </View>
          <Button
            accessibilityLabel={t("profileSettings.language.saveAccessibility")}
            fullWidth
            label={t("profileSettings.language.save")}
            loading={saving}
            onPress={handleSave}
          />
        </>
      ) : null}
    </ProfileSettingsScaffold>
  );
}

const styles = StyleSheet.create({
  cardStack: {
    gap: spacing.lg,
  },
  choiceStack: {
    gap: spacing.md,
  },
  content: {
    alignSelf: "center",
    gap: spacing.lg,
    maxWidth: layout.maxContentWidth,
    width: "100%",
  },
  disabledRow: {
    opacity: 0.48,
  },
  header: {
    backgroundColor: settingsFlowColors.background,
    borderBottomColor: settingsFlowColors.border,
  },
  iconBadge: {
    alignItems: "center",
    backgroundColor: settingsFlowColors.surfaceSoft,
    borderRadius: radius.full,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  iconRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  iconRowBody: {
    flex: 1,
  },
  notificationRow: {
    alignItems: "center",
    backgroundColor: settingsFlowColors.surface,
    borderColor: settingsFlowColors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.lg,
  },
  notificationRowLabel: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.md,
    minWidth: 0,
  },
  notificationRowText: {
    color: settingsFlowColors.text,
    flex: 1,
  },
  root: {
    backgroundColor: settingsFlowColors.background,
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: spacing.lg,
  },
  sectionLabel: {
    color: settingsFlowColors.text,
  },
  subtitle: {
    color: settingsFlowColors.muted,
  },
});
