import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, shadows, spacing, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { EmptyState } from "@/shared/components/feedback";
import { Screen } from "@/shared/components/layout";
import { getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";

import { useStudentMessages, type StudentMessageThread } from "../hooks/useStudentMessages";

const messageColors = {
  background: colors.dashboard.background,
  card: colors.dashboard.card,
  coachAvatarBg: colors.dashboard.tertiaryContainer,
  coachAvatarFg: colors.dashboard.tertiaryText,
  muted: colors.dashboard.onSurfaceVariant,
  onSurface: colors.dashboard.onSurface,
  outline: colors.dashboard.outlineVariant,
  teacherAvatarBg: colors.dashboard.primaryContainer,
  teacherAvatarFg: colors.dashboard.primary,
  time: colors.dashboard.outline,
} as const;

const type = typography.gradeBands.middle;

function MessageThreadCard({ thread }: { thread: StudentMessageThread }) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const isCoach = thread.senderKind === "coach";

  return (
    <View
      accessibilityLabel={t("studentMessages.threadAccessibility", {
        sender: thread.senderName,
        preview: thread.preview,
      })}
      accessible
      style={styles.threadCard}
    >
      <View
        style={[
          styles.avatar,
          { backgroundColor: isCoach ? messageColors.coachAvatarBg : messageColors.teacherAvatarBg },
        ]}
      >
        {isCoach ? (
          <Ionicons color={messageColors.coachAvatarFg} name="sparkles" size={20} />
        ) : (
          <Text style={[getAccessibleTextStyle(type.label, settings), styles.avatarInitials]}>
            {thread.initials}
          </Text>
        )}
      </View>

      <View style={styles.threadBody}>
        <View style={styles.threadHeader}>
          <Text style={[getAccessibleTextStyle(type.label, settings), styles.senderName]}>{thread.senderName}</Text>
          <Text style={[getAccessibleTextStyle(type.caption, settings), styles.time]}>{thread.timeLabel}</Text>
        </View>
        <Text style={[getAccessibleTextStyle(type.body, settings), styles.preview]}>{thread.preview}</Text>
      </View>
    </View>
  );
}

export function StudentMessagesScreen() {
  const { t } = useI18n();
  const { refresh, status, threads } = useStudentMessages();

  return (
    <Screen
      backgroundColor={messageColors.background}
      testID="student-messages-screen"
      title={t("studentMessages.title")}
    >
      {status === "loading" ? (
        <EmptyState
          description={t("studentMessages.loadingDescription")}
          title={t("studentMessages.loadingTitle")}
        />
      ) : status === "error" ? (
        <EmptyState
          actionLabel={t("common.retry")}
          description={t("studentMessages.errorDescription")}
          onActionPress={() => {
            void refresh();
          }}
          title={t("studentMessages.errorTitle")}
        />
      ) : threads.length === 0 ? (
        <EmptyState
          description={t("studentMessages.emptyDescription")}
          title={t("studentMessages.emptyTitle")}
        />
      ) : (
        <View style={styles.threadList}>
          {threads.map((thread) => (
            <MessageThreadCard key={thread.id} thread={thread} />
          ))}
        </View>
      )}
      <View style={styles.bottomSpacer} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  avatarInitials: {
    color: messageColors.teacherAvatarFg,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 96,
  },
  preview: {
    color: messageColors.muted,
    marginTop: spacing.xs,
  },
  senderName: {
    color: messageColors.onSurface,
    fontWeight: "600",
  },
  threadBody: {
    flex: 1,
    minWidth: 0,
  },
  threadCard: {
    backgroundColor: messageColors.card,
    borderColor: messageColors.outline,
    borderCurve: "continuous",
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  threadHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  threadList: {
    gap: spacing.md,
  },
  time: {
    color: messageColors.time,
  },
});
