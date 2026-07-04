import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  colors,
  radius,
  spacing,
  typography,
  type GradeBand,
} from "@/design/tokens";
import { useI18n } from "@/i18n";
import { StatusState } from "@/shared/components/feedback";
import {
  getAccessibleHitSlop,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { formatAttachmentSize } from "../services/attachmentFormat";
import type {
  AssignmentAttachment,
  AttachmentError,
} from "../hooks/useAssignmentAttachments";

const dashboard = colors.dashboard;

interface SourceTile {
  icon: keyof typeof Ionicons.glyphMap;
  labelKey:
    | "assignments.attachments.takePhoto"
    | "assignments.attachments.choosePhoto"
    | "assignments.attachments.uploadFile";
  accessibilityKey:
    | "assignments.attachments.takePhotoAccessibility"
    | "assignments.attachments.choosePhotoAccessibility"
    | "assignments.attachments.uploadFileAccessibility";
  onPress: () => void;
}

interface AssignmentAttachmentUploaderProps {
  attachments: AssignmentAttachment[];
  gradeBand: GradeBand;
  isPicking: boolean;
  error: AttachmentError | null;
  onTakePhoto: () => void;
  onPickPhoto: () => void;
  onPickFile: () => void;
  onRemove: (id: string) => void;
  onRetryExtraction: (id: string) => void;
}

export function AssignmentAttachmentUploader({
  attachments,
  gradeBand,
  isPicking,
  error,
  onTakePhoto,
  onPickPhoto,
  onPickFile,
  onRemove,
  onRetryExtraction,
}: AssignmentAttachmentUploaderProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];

  const tiles: SourceTile[] = [
    {
      icon: "camera-outline",
      labelKey: "assignments.attachments.takePhoto",
      accessibilityKey: "assignments.attachments.takePhotoAccessibility",
      onPress: onTakePhoto,
    },
    {
      icon: "images-outline",
      labelKey: "assignments.attachments.choosePhoto",
      accessibilityKey: "assignments.attachments.choosePhotoAccessibility",
      onPress: onPickPhoto,
    },
    {
      icon: "document-attach-outline",
      labelKey: "assignments.attachments.uploadFile",
      accessibilityKey: "assignments.attachments.uploadFileAccessibility",
      onPress: onPickFile,
    },
  ];

  return (
    <View style={styles.container} testID="assignment-attachment-uploader">
      <Text
        style={[getAccessibleTextStyle(type.body, settings), styles.subtitle]}
      >
        {t("assignments.attachments.sectionSubtitle")}
      </Text>

      <View style={styles.sourceRow}>
        {tiles.map((tile) => (
          <Pressable
            accessibilityLabel={t(tile.accessibilityKey)}
            accessibilityRole="button"
            accessibilityState={{ disabled: isPicking }}
            disabled={isPicking}
            hitSlop={getAccessibleHitSlop(settings)}
            key={tile.labelKey}
            onPress={tile.onPress}
            style={({ pressed }) => [
              styles.tile,
              pressed ? styles.tilePressed : null,
              isPicking ? styles.tileDisabled : null,
            ]}
          >
            <View style={styles.tileIcon}>
              <Ionicons color={dashboard.primary} name={tile.icon} size={20} />
            </View>
            <Text
              style={[
                getAccessibleTextStyle(type.caption, settings),
                styles.tileLabel,
              ]}
            >
              {t(tile.labelKey)}
            </Text>
          </Pressable>
        ))}
      </View>

      {isPicking ? (
        <View
          accessibilityLabel={t("assignments.attachments.picking")}
          style={styles.pickingRow}
        >
          <ActivityIndicator color={dashboard.primary} size="small" />
          <Text
            style={[
              getAccessibleTextStyle(type.caption, settings),
              styles.pickingText,
            ]}
          >
            {t("assignments.attachments.picking")}
          </Text>
        </View>
      ) : null}

      {error ? (
        <StatusState
          accessibilityLabel={t(`assignments.attachments.error.${error}Title`)}
          description={t(`assignments.attachments.error.${error}Description`)}
          gradeBand={gradeBand}
          title={t(`assignments.attachments.error.${error}Title`)}
          tone={error === "permission" ? "warning" : "error"}
        />
      ) : null}

      {attachments.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons
            color={dashboard.outline}
            name="cloud-upload-outline"
            size={20}
          />
          <View style={styles.emptyText}>
            <Text
              style={[
                getAccessibleTextStyle(type.bodyStrong, settings),
                styles.emptyTitle,
              ]}
            >
              {t("assignments.attachments.emptyTitle")}
            </Text>
            <Text
              style={[
                getAccessibleTextStyle(type.caption, settings),
                styles.emptyDescription,
              ]}
            >
              {t("assignments.attachments.emptyDescription")}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.list}>
          {attachments.map((attachment) => {
            const sizeLabel = formatAttachmentSize(attachment.sizeBytes);

            return (
              <View
                accessibilityLabel={t(
                  attachment.kind === "image"
                    ? "assignments.attachments.imageAccessibility"
                    : "assignments.attachments.fileAccessibility",
                  { name: attachment.name },
                )}
                accessible
                key={attachment.id}
                style={styles.row}
              >
                {attachment.kind === "image" ? (
                  <Image
                    source={{ uri: attachment.uri }}
                    style={styles.thumbnail}
                  />
                ) : (
                  <View style={styles.fileIcon}>
                    <Ionicons
                      color={dashboard.tertiaryText}
                      name="document-text-outline"
                      size={22}
                    />
                  </View>
                )}

                <View style={styles.rowBody}>
                  <Text
                    numberOfLines={1}
                    style={[
                      getAccessibleTextStyle(type.bodyStrong, settings),
                      styles.rowName,
                    ]}
                  >
                    {attachment.name}
                  </Text>
                  {sizeLabel ? (
                    <Text
                      style={[
                        getAccessibleTextStyle(type.caption, settings),
                        styles.rowMeta,
                      ]}
                    >
                      {sizeLabel}
                    </Text>
                  ) : null}

                  {attachment.extraction.status === "extracting" ? (
                    <View style={styles.statusRow}>
                      <ActivityIndicator
                        color={dashboard.primary}
                        size="small"
                      />
                      <Text
                        style={[
                          getAccessibleTextStyle(type.caption, settings),
                          styles.statusExtracting,
                        ]}
                      >
                        {t("assignments.attachments.extracting")}
                      </Text>
                    </View>
                  ) : null}

                  {attachment.extraction.status === "done" ? (
                    <View style={styles.statusRow}>
                      <Ionicons
                        color={dashboard.secondary}
                        name="checkmark-circle"
                        size={14}
                      />
                      <Text
                        style={[
                          getAccessibleTextStyle(type.caption, settings),
                          styles.statusDone,
                        ]}
                      >
                        {t("assignments.attachments.extracted")}
                      </Text>
                    </View>
                  ) : null}

                  {attachment.extraction.status === "error" ? (
                    <View style={styles.statusRow}>
                      <Ionicons
                        color={dashboard.error}
                        name="alert-circle"
                        size={14}
                      />
                      <Text
                        style={[
                          getAccessibleTextStyle(type.caption, settings),
                          styles.statusError,
                        ]}
                      >
                        {t("assignments.attachments.extractFailed")}
                      </Text>
                      <Pressable
                        accessibilityLabel={t(
                          "assignments.attachments.retryAccessibility",
                          { name: attachment.name },
                        )}
                        accessibilityRole="button"
                        hitSlop={getAccessibleHitSlop(settings)}
                        onPress={() => onRetryExtraction(attachment.id)}
                      >
                        <Text
                          style={[
                            getAccessibleTextStyle(type.caption, settings),
                            styles.retryLink,
                          ]}
                        >
                          {t("assignments.attachments.retry")}
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>

                <Pressable
                  accessibilityLabel={t(
                    "assignments.attachments.removeAccessibility",
                    { name: attachment.name },
                  )}
                  accessibilityRole="button"
                  hitSlop={getAccessibleHitSlop(settings)}
                  onPress={() => onRemove(attachment.id)}
                  style={({ pressed }) => [
                    styles.removeButton,
                    pressed ? styles.removePressed : null,
                  ]}
                >
                  <Ionicons color={dashboard.outline} name="close" size={18} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  empty: {
    alignItems: "center",
    backgroundColor: dashboard.surfaceContainerLow,
    borderColor: dashboard.outlineVariant,
    borderCurve: "continuous",
    borderRadius: radius.md,
    borderStyle: "dashed",
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  emptyDescription: {
    color: dashboard.onSurfaceVariant,
  },
  emptyText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  emptyTitle: {
    color: dashboard.onSurface,
  },
  fileIcon: {
    alignItems: "center",
    backgroundColor: dashboard.tertiaryContainer,
    borderRadius: radius.md,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  list: {
    gap: spacing.sm,
  },
  pickingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  pickingText: {
    color: dashboard.onSurfaceVariant,
  },
  removeButton: {
    alignItems: "center",
    backgroundColor: dashboard.surfaceContainerLow,
    borderRadius: radius.full,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  removePressed: {
    opacity: 0.6,
  },
  row: {
    alignItems: "center",
    backgroundColor: dashboard.card,
    borderColor: dashboard.outlineVariant,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.sm,
  },
  rowBody: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  rowMeta: {
    color: dashboard.onSurfaceVariant,
  },
  rowName: {
    color: dashboard.onSurface,
  },
  retryLink: {
    color: dashboard.primary,
    fontWeight: "700",
  },
  sourceRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statusDone: {
    color: dashboard.secondary,
    fontWeight: "600",
  },
  statusError: {
    color: dashboard.error,
    fontWeight: "600",
  },
  statusExtracting: {
    color: dashboard.onSurfaceVariant,
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: 2,
  },
  subtitle: {
    color: dashboard.onSurfaceVariant,
  },
  thumbnail: {
    backgroundColor: dashboard.surfaceContainer,
    borderRadius: radius.md,
    height: 48,
    width: 48,
  },
  tile: {
    alignItems: "center",
    backgroundColor: dashboard.card,
    borderColor: dashboard.outlineVariant,
    borderCurve: "continuous",
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  tileDisabled: {
    opacity: 0.5,
  },
  tileIcon: {
    alignItems: "center",
    backgroundColor: dashboard.primaryContainer,
    borderRadius: radius.sm,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  tileLabel: {
    color: dashboard.onSurface,
    fontWeight: "600",
    textAlign: "center",
  },
  tilePressed: {
    opacity: 0.85,
  },
});
