import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getAssignmentDetailRoute, getCanvasCreateRoute } from "@/core/navigation/deepLinks";
import { colors, spacing } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { EmptyState, ErrorState, LoadingState, OfflineBanner, StatusState, SuccessState } from "@/shared/components/feedback";
import { Screen } from "@/shared/components/layout";

import {
  BannerPositionPicker,
  CanvasHeader,
  CanvasHeightControl,
  CanvasSurface,
  ColorPickerPopover,
  EdgeRevealHandle,
  FloatingToolBanner,
} from "../components";
import { useCanvasWorkspace } from "../hooks/useCanvas";
import { useCanvasToolStore } from "../stores/canvasToolStore";
import { CANVAS_HEIGHT_LEVELS, CANVAS_PAGE_COUNTS, type CanvasBannerPosition } from "../types";

const EDGE_TAP_THICKNESS = 18;
/** Inset that keeps tool popovers clear of the banner's thickness. */
const POPOVER_BANNER_INSET = 62;
const BANNER_EDGE_CENTER_INSET = 42;
const BANNER_DRAG_THRESHOLD = 8;

type ActivePopover = "color" | "height" | "position" | null;
type DragOffset = { x: number; y: number };
type CanvasAreaSize = { height: number; width: number };

function getParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getBannerCenter(position: CanvasBannerPosition, size: CanvasAreaSize): DragOffset {
  switch (position) {
    case "top":
      return { x: size.width / 2, y: BANNER_EDGE_CENTER_INSET };
    case "bottom":
      return { x: size.width / 2, y: Math.max(BANNER_EDGE_CENTER_INSET, size.height - BANNER_EDGE_CENTER_INSET) };
    case "left":
      return { x: BANNER_EDGE_CENTER_INSET, y: size.height / 2 };
    case "right":
      return { x: Math.max(BANNER_EDGE_CENTER_INSET, size.width - BANNER_EDGE_CENTER_INSET), y: size.height / 2 };
  }
}

function getNearestBannerPosition(point: DragOffset, size: CanvasAreaSize): CanvasBannerPosition {
  const distances = [
    { distance: point.y, position: "top" as const },
    { distance: Math.max(0, size.height - point.y), position: "bottom" as const },
    { distance: point.x, position: "left" as const },
    { distance: Math.max(0, size.width - point.x), position: "right" as const },
  ];

  return distances.reduce((nearest, candidate) => (candidate.distance < nearest.distance ? candidate : nearest)).position;
}

export function HandwritingCanvasScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ assignmentId?: string | string[]; canvasId?: string | string[] }>();
  const canvasId = useMemo(() => getParamValue(params.canvasId), [params.canvasId]);
  const assignmentId = useMemo(() => getParamValue(params.assignmentId), [params.assignmentId]);
  const state = useCanvasWorkspace(canvasId, assignmentId);

  const bannerHidden = useCanvasToolStore((store) => store.bannerHidden);
  const bannerPosition = useCanvasToolStore((store) => store.bannerPosition);
  const heightLevel = useCanvasToolStore((store) => store.heightLevel);
  const toggleBanner = useCanvasToolStore((store) => store.toggleBanner);
  const setBannerPosition = useCanvasToolStore((store) => store.setBannerPosition);
  const setBannerHidden = useCanvasToolStore((store) => store.setBannerHidden);

  const [activePopover, setActivePopover] = useState<ActivePopover>(null);
  const [bannerDragOffset, setBannerDragOffset] = useState<DragOffset | null>(null);
  const [canvasAreaSize, setCanvasAreaSize] = useState<CanvasAreaSize>({
    height: Math.max(360, Dimensions.get("window").height - 160),
    width: Math.max(320, Dimensions.get("window").width),
  });
  const [viewportHeight, setViewportHeight] = useState(() => Math.max(360, Dimensions.get("window").height - 160));
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "error">("idle");
  const [attachStatus, setAttachStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const bannerDragPositionRef = useRef(bannerPosition);
  const canvasAreaSizeRef = useRef(canvasAreaSize);
  const closePopover = useCallback(() => setActivePopover(null), []);

  useEffect(() => {
    bannerDragPositionRef.current = bannerPosition;
  }, [bannerPosition]);

  useEffect(() => {
    canvasAreaSizeRef.current = canvasAreaSize;
  }, [canvasAreaSize]);

  const bannerPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gestureState) =>
          Math.abs(gestureState.dx) > BANNER_DRAG_THRESHOLD || Math.abs(gestureState.dy) > BANNER_DRAG_THRESHOLD,
        onPanResponderGrant: () => {
          closePopover();
          setBannerDragOffset({ x: 0, y: 0 });
        },
        onPanResponderMove: (_event, gestureState) => {
          setBannerDragOffset({ x: gestureState.dx, y: gestureState.dy });
        },
        onPanResponderRelease: (_event, gestureState) => {
          const size = canvasAreaSizeRef.current;
          const start = getBannerCenter(bannerDragPositionRef.current, size);
          const end = {
            x: Math.max(0, Math.min(size.width, start.x + gestureState.dx)),
            y: Math.max(0, Math.min(size.height, start.y + gestureState.dy)),
          };

          setBannerDragOffset(null);
          setBannerPosition(getNearestBannerPosition(end, size));
        },
        onPanResponderTerminate: () => {
          setBannerDragOffset(null);
        },
      }),
    [closePopover, setBannerPosition],
  );

  useEffect(() => {
    if (attachStatus !== "success") {
      return;
    }

    const timeout = setTimeout(() => setAttachStatus("idle"), 2500);
    return () => clearTimeout(timeout);
  }, [attachStatus]);

  // Closing the banner also dismisses any open tool popover.
  useEffect(() => {
    if (bannerHidden && activePopover) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- popovers cannot stay open without their banner trigger
      setActivePopover(null);
    }
  }, [activePopover, bannerHidden]);

  const togglePopover = (popover: Exclude<ActivePopover, null>) => {
    setActivePopover((current) => (current === popover ? null : popover));
  };

  const saveNow = async () => {
    if (state.status !== "success") {
      return;
    }

    setSaveStatus("saving");
    const saved = await state.saveNow();
    setSaveStatus(saved ? "idle" : "error");
  };

  const attachNow = async () => {
    if (state.status !== "success" || !state.viewModel.document) {
      return;
    }

    const targetAssignmentId = assignmentId ?? state.viewModel.document.assignmentId;

    if (!targetAssignmentId) {
      setAttachStatus("error");
      return;
    }

    setAttachStatus("loading");
    const attached = await state.attach(targetAssignmentId);
    setAttachStatus(attached ? "success" : "error");
  };

  if (state.status === "success" && state.viewModel.document) {
    const { document, syncStatus } = state.viewModel;
    const pageCount = CANVAS_PAGE_COUNTS[heightLevel] ?? CANVAS_PAGE_COUNTS[CANVAS_HEIGHT_LEVELS[0]];

    return (
      <View
        style={[styles.shell, { backgroundColor: colors.background.canvas }]}
        testID="handwriting-canvas-screen"
      >
        <CanvasHeader
          assignmentTitle={document.title}
          canAttach={state.viewModel.canAttach}
          gradeBand={state.gradeBand}
          isAttaching={attachStatus === "loading"}
          onAttach={() => {
            void attachNow();
          }}
          onBack={() => router.back()}
          pageCount={pageCount}
          paddingTop={Math.max(insets.top, spacing.md)}
          syncStatus={syncStatus}
        />

        {state.viewModel.isOffline || syncStatus === "sync_failed" || saveStatus === "error" || attachStatus === "success" ? (
          <View style={styles.statusStack}>
            {state.viewModel.isOffline ? (
              <OfflineBanner
                actionLabel={t("canvas.workspace.offlineAction")}
                accessibilityLabel={t("canvas.workspace.offlineAccessibility")}
                description={t("canvas.workspace.offlineDescription")}
                gradeBand={state.gradeBand}
                isRetrying={state.isRefreshing}
                onRetry={state.refetch}
                title={t("canvas.workspace.offlineTitle")}
              />
            ) : null}

            {syncStatus === "sync_failed" || saveStatus === "error" ? (
              <StatusState
                actionLabel={t("canvas.handwriting.autosave.retry")}
                actionLoading={saveStatus === "saving"}
                accessibilityLabel={t("canvas.workspace.recoveryAccessibility")}
                description={t("canvas.workspace.recoveryDescription")}
                gradeBand={state.gradeBand}
                onActionPress={() => {
                  void saveNow();
                }}
                title={t("canvas.workspace.recoveryTitle")}
                tone="error"
              />
            ) : null}

            {attachStatus === "success" ? (
              <SuccessState
                actionLabel={assignmentId ? t("canvas.workspace.backToWritingCta") : undefined}
                accessibilityLabel={t("canvas.workspace.attachSuccessAccessibility")}
                description={t("canvas.workspace.attachSuccessDescription")}
                gradeBand={state.gradeBand}
                onActionPress={assignmentId ? () => router.push(getAssignmentDetailRoute(assignmentId)) : undefined}
                title={t("canvas.workspace.attachSuccessTitle")}
              />
            ) : null}
          </View>
        ) : null}

        <View
          onLayout={(event) => {
            const { height, width } = event.nativeEvent.layout;
            setViewportHeight(height);
            setCanvasAreaSize({ height, width });
          }}
          style={styles.canvasArea}
        >
          <ScrollView
            contentContainerStyle={[
              styles.canvasScroll,
              {
                paddingBottom: bannerPosition === "bottom" && !bannerHidden ? 88 : spacing.xl,
                paddingTop: bannerPosition === "top" && !bannerHidden ? 58 : spacing.lg,
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <CanvasSurface
              document={document}
              gradeAdaptation={state.viewModel.gradeAdaptation}
              gradeBand={state.gradeBand}
              onBeginStroke={state.beginStroke}
              onEndStroke={state.endStroke}
              onExtendStroke={state.extendStroke}
              viewportHeight={viewportHeight}
            />
          </ScrollView>

          <EdgeTapZones onToggle={toggleBanner} />

          {bannerHidden ? (
            <EdgeRevealHandle
              gradeBand={state.gradeBand}
              insets={insets}
              onPress={() => setBannerHidden(false)}
              position={bannerPosition}
            />
          ) : (
            <View
              pointerEvents="box-none"
              style={[
                styles.bannerLayer,
                bannerAnchorStyle(bannerPosition, insets),
                bannerDragOffset ? { transform: [{ translateX: bannerDragOffset.x }, { translateY: bannerDragOffset.y }] } : null,
              ]}
              {...bannerPanResponder.panHandlers}
            >
              <FloatingToolBanner
                colorPickerOpen={activePopover === "color"}
                gradeBand={state.gradeBand}
                heightOpen={activePopover === "height"}
                onHide={() => setBannerHidden(true)}
                onToggleColorPicker={() => togglePopover("color")}
                onToggleHeight={() => togglePopover("height")}
                onTogglePosition={() => togglePopover("position")}
                position={bannerPosition}
                positionOpen={activePopover === "position"}
              />
            </View>
          )}

          {activePopover ? (
            <>
              <Pressable
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                onPress={closePopover}
                style={styles.dismissOverlay}
                testID="canvas-popover-dismiss"
              />
              <View pointerEvents="box-none" style={[styles.bannerLayer, popoverAnchorStyle(bannerPosition, insets)]}>
                {activePopover === "color" ? <ColorPickerPopover gradeBand={state.gradeBand} onClose={closePopover} /> : null}
                {activePopover === "height" ? <CanvasHeightControl gradeBand={state.gradeBand} /> : null}
                {activePopover === "position" ? (
                  <BannerPositionPicker gradeBand={state.gradeBand} onClose={closePopover} />
                ) : null}
              </View>
            </>
          ) : null}
        </View>
      </View>
    );
  }

  const title =
    state.status === "success" && state.viewModel.document
      ? state.viewModel.document.title
      : t("canvas.handwriting.screenTitle");

  return (
    <Screen
      backgroundColor={colors.background.canvas}
      gradeBand={state.gradeBand}
      subtitle={t("canvas.workspace.subtitle")}
      testID="handwriting-canvas-screen"
      title={title}
    >
      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("canvas.workspace.loadingAccessibility")}
          description={t("canvas.workspace.loadingDescription")}
          gradeBand={state.gradeBand}
          label={t("canvas.workspace.loadingTitle")}
          testID="canvas-workspace-loading"
        />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("canvas.workspace.errorAccessibility")}
          description={t("canvas.workspace.errorDescription")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          testID="canvas-workspace-error"
          title={t("canvas.workspace.errorTitle")}
        />
      ) : null}

      {state.status === "missing" ? (
        <EmptyState
          actionLabel={t("canvas.workspace.missingAction")}
          accessibilityLabel={t("canvas.workspace.missingAccessibility")}
          description={t("canvas.workspace.missingDescription")}
          gradeBand={state.gradeBand}
          onActionPress={() => router.replace(getCanvasCreateRoute(assignmentId))}
          testID="canvas-workspace-missing"
          title={t("canvas.workspace.missingTitle")}
        />
      ) : null}
    </Screen>
  );
}

/** Thin tap zones along each screen edge. Tapping any edge hides or shows the
 * tool banner so the canvas can feel distraction-free. */
function EdgeTapZones({ onToggle }: { onToggle: () => void }) {
  const { t } = useI18n();
  const label = t("canvas.handwriting.edgeTap.accessibility");
  const edges: { key: CanvasBannerPosition; style: ViewStyle }[] = [
    { key: "top", style: { height: EDGE_TAP_THICKNESS, left: 0, right: 0, top: 0 } },
    { key: "bottom", style: { bottom: 0, height: EDGE_TAP_THICKNESS, left: 0, right: 0 } },
    { key: "left", style: { bottom: 0, left: 0, top: 0, width: EDGE_TAP_THICKNESS } },
    { key: "right", style: { bottom: 0, right: 0, top: 0, width: EDGE_TAP_THICKNESS } },
  ];

  return (
    <>
      {edges.map((edge) => (
        <Pressable
          accessibilityLabel={label}
          accessibilityRole="button"
          key={edge.key}
          onPress={onToggle}
          style={[styles.edgeZone, edge.style]}
          testID={`canvas-edge-tap-${edge.key}`}
        />
      ))}
    </>
  );
}

function bannerAnchorStyle(position: CanvasBannerPosition, insets: { bottom: number; left: number; right: number }): ViewStyle {
  switch (position) {
    case "bottom":
      return { alignItems: "center", bottom: insets.bottom + spacing.md, left: 0, right: 0 };
    case "top":
      return { alignItems: "center", left: 0, right: 0, top: spacing.sm };
    case "left":
      return { bottom: 0, justifyContent: "center", left: insets.left + spacing.md, top: 0 };
    case "right":
      return { bottom: 0, justifyContent: "center", right: insets.right + spacing.md, top: 0 };
  }
}

function popoverAnchorStyle(position: CanvasBannerPosition, insets: { bottom: number; left: number; right: number }): ViewStyle {
  switch (position) {
    case "bottom":
      return { alignItems: "center", bottom: insets.bottom + POPOVER_BANNER_INSET, left: 0, right: 0 };
    case "top":
      return { alignItems: "center", left: 0, right: 0, top: POPOVER_BANNER_INSET };
    case "left":
      return { bottom: 0, justifyContent: "center", left: insets.left + POPOVER_BANNER_INSET, top: 0 };
    case "right":
      return { bottom: 0, justifyContent: "center", right: insets.right + POPOVER_BANNER_INSET, top: 0 };
  }
}

const styles = StyleSheet.create({
  bannerLayer: {
    position: "absolute",
  },
  canvasArea: {
    flex: 1,
    position: "relative",
  },
  canvasScroll: {
    paddingHorizontal: spacing.lg,
  },
  dismissOverlay: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  edgeZone: {
    position: "absolute",
  },
  shell: {
    flex: 1,
  },
  statusStack: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
});
