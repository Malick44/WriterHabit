import { memo, useEffect, useMemo, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import type { EdgeInsets } from "react-native-safe-area-context";

import { colors, duration, easing, layout, palette, radius, spacing, typography } from "@/design/tokens";

import { useBottomMenu } from "./BottomMenuContext";

type TabRouteParams = Readonly<object> | undefined;

interface TabRoute {
  key: string;
  name: string;
  params?: TabRouteParams;
}

interface TabBarIconProps {
  color: string;
  focused: boolean;
  size: number;
}

interface TabBarLabelProps {
  children: string;
  color: string;
  focused: boolean;
  position: "below-icon";
}

interface TabOptions {
  tabBarAccessibilityLabel?: string;
  tabBarIcon?: (props: TabBarIconProps) => ReactNode;
  tabBarLabel?: string | ((props: TabBarLabelProps) => ReactNode);
  tabBarButtonTestID?: string;
  tabBarStyle?: unknown;
  title?: string;
}

interface TabDescriptor {
  options: TabOptions;
}

interface TabNavigation {
  emit: (options: { canPreventDefault?: boolean; target: string; type: "tabLongPress" | "tabPress" }) => unknown;
  navigate: (name: string, params?: TabRouteParams) => void;
}

interface TabState {
  index: number;
  key: string;
  routes: TabRoute[];
}

interface RoleBottomMenuProps {
  activeTintColor?: string;
  backgroundColor?: string;
  descriptors: Record<string, TabDescriptor>;
  homeRouteName: string;
  inactiveTintColor?: string;
  insets: EdgeInsets;
  navigation: TabNavigation;
  state: TabState;
  visibleRouteNames: readonly string[];
}

interface VisibleRoute {
  descriptor: TabDescriptor;
  index: number;
  isHome: boolean;
  route: TabRoute;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const ICON_SIZE = 24;
const HOME_ITEM_WIDTH = 70;
const MENU_HORIZONTAL_PADDING = spacing.sm;
const COLLAPSED_MENU_WIDTH = HOME_ITEM_WIDTH + MENU_HORIZONTAL_PADDING * 2;
const MENU_ITEM_WIDTH = 74;
const MIN_BOTTOM_PADDING = 14;
const TOP_PADDING = 8;
const SURFACE_HEIGHT = 62;

export const RoleBottomMenu = memo(function RoleBottomMenu({
  activeTintColor = colors.dashboard.primary,
  backgroundColor = colors.background.surface,
  descriptors,
  homeRouteName,
  inactiveTintColor = palette.slate[400],
  insets,
  navigation,
  state,
  visibleRouteNames,
}: RoleBottomMenuProps) {
  const { expand, isCollapsed } = useBottomMenu();
  const { width } = useWindowDimensions();
  const visibleRouteNameSet = useMemo(() => new Set(visibleRouteNames), [visibleRouteNames]);
  const visibleRoutes = useMemo(
    () =>
      state.routes.reduce<VisibleRoute[]>((routes, route, index) => {
        const descriptor = descriptors[route.key];

        if (!descriptor || !visibleRouteNameSet.has(route.name)) {
          return routes;
        }

        routes.push({
          descriptor,
          index,
          isHome: route.name === homeRouteName,
          route,
        });

        return routes;
      }, []),
    [descriptors, homeRouteName, state.routes, visibleRouteNameSet],
  );
  const progress = useSharedValue(isCollapsed ? 1 : 0);
  const reducedMotion = useReducedMotion();
  const activeRoute = state.routes[state.index];
  const activeDescriptor = activeRoute ? descriptors[activeRoute.key] : undefined;
  const shouldHideMenu = hasDisplayNone(activeDescriptor?.options.tabBarStyle);
  const expandedWidth = Math.max(
    COLLAPSED_MENU_WIDTH,
    Math.min(width - spacing.lg * 2, visibleRoutes.length * MENU_ITEM_WIDTH + MENU_HORIZONTAL_PADDING * 2),
  );

  useEffect(() => {
    progress.value = withTiming(isCollapsed ? 1 : 0, {
      duration: reducedMotion ? duration.instant : duration.md,
      easing: Easing.bezier(...easing.emphasized),
    });
  }, [isCollapsed, progress, reducedMotion]);

  const surfaceStyle = useAnimatedStyle(() => ({
    width: expandedWidth - (expandedWidth - COLLAPSED_MENU_WIDTH) * progress.value,
  }));

  if (shouldHideMenu) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.root,
        {
          height: SURFACE_HEIGHT + TOP_PADDING + Math.max(insets.bottom, MIN_BOTTOM_PADDING),
          paddingBottom: Math.max(insets.bottom, MIN_BOTTOM_PADDING),
        },
      ]}
    >
      <Animated.View style={[styles.surface, { backgroundColor }, surfaceStyle]}>
        <View accessibilityRole="tablist" style={styles.items}>
          {visibleRoutes.map(({ descriptor, index, isHome, route }) => {
            const focused = state.index === index;

            return (
              <RoleBottomMenuItem
                activeTintColor={activeTintColor}
                descriptor={descriptor}
                focused={focused}
                inactiveTintColor={inactiveTintColor}
                isCollapsed={isCollapsed}
                isHome={isHome}
                key={route.key}
                onLongPress={() => {
                  navigation.emit({ target: route.key, type: "tabLongPress" });
                }}
                onPress={() => {
                  if (isHome && isCollapsed) {
                    expand();
                    return;
                  }

                  const event = navigation.emit({
                    canPreventDefault: true,
                    target: route.key,
                    type: "tabPress",
                  });

                  if (!isDefaultPrevented(event)) {
                    navigation.navigate(route.name, route.params);
                  }
                }}
                progress={progress}
                routeName={route.name}
              />
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
});

interface RoleBottomMenuItemProps {
  activeTintColor: string;
  descriptor: TabDescriptor;
  focused: boolean;
  inactiveTintColor: string;
  isCollapsed: boolean;
  isHome: boolean;
  onLongPress: () => void;
  onPress: () => void;
  progress: SharedValue<number>;
  routeName: string;
}

function RoleBottomMenuItem({
  activeTintColor,
  descriptor,
  focused,
  inactiveTintColor,
  isCollapsed,
  isHome,
  onLongPress,
  onPress,
  progress,
  routeName,
}: RoleBottomMenuItemProps) {
  const color = focused ? activeTintColor : inactiveTintColor;
  const label = getRouteLabel(descriptor.options, routeName);
  const isHidden = isCollapsed && !isHome;
  const accessibilityLabel = descriptor.options.tabBarAccessibilityLabel ?? label;
  const animatedStyle = useAnimatedStyle(() => {
    if (isHome) {
      return {
        opacity: 1,
        transform: [{ scale: 1 + progress.value * 0.04 }],
        width: HOME_ITEM_WIDTH,
      };
    }

    return {
      opacity: 1 - progress.value,
      transform: [{ scale: 1 - progress.value * 0.18 }],
      width: MENU_ITEM_WIDTH * (1 - progress.value),
    };
  });

  return (
    <AnimatedPressable
      accessibilityElementsHidden={isHidden}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      disabled={isHidden}
      hitSlop={layout.hitSlop}
      importantForAccessibility={isHidden ? "no-hide-descendants" : "auto"}
      onLongPress={onLongPress}
      onPress={onPress}
      style={[styles.item, focused ? styles.itemFocused : null, animatedStyle]}
      testID={descriptor.options.tabBarButtonTestID}
    >
      <View style={[styles.iconShell, focused ? styles.iconShellFocused : null]}>
        {descriptor.options.tabBarIcon?.({ color, focused, size: ICON_SIZE }) ?? null}
      </View>
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        numberOfLines={1}
        style={[styles.label, { color }, focused ? styles.labelFocused : null]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

function getRouteLabel(options: TabOptions, routeName: string) {
  if (typeof options.tabBarLabel === "string") {
    return options.tabBarLabel;
  }

  if (typeof options.title === "string") {
    return options.title;
  }

  return routeName;
}

function hasDisplayNone(style: unknown): boolean {
  if (!style) {
    return false;
  }

  if (Array.isArray(style)) {
    return style.some(hasDisplayNone);
  }

  if (typeof style !== "object") {
    return false;
  }

  return "display" in style && (style as { display?: unknown }).display === "none";
}

function isDefaultPrevented(event: unknown): boolean {
  return (
    typeof event === "object" &&
    event !== null &&
    "defaultPrevented" in event &&
    (event as { defaultPrevented?: unknown }).defaultPrevented === true
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    backgroundColor: "transparent",
    justifyContent: "flex-end",
    paddingTop: TOP_PADDING,
  },
  surface: {
    borderColor: palette.slate[100],
    borderRadius: radius.full,
    borderWidth: 1,
    elevation: 10,
    height: SURFACE_HEIGHT,
    overflow: "hidden",
    paddingHorizontal: MENU_HORIZONTAL_PADDING,
    shadowColor: palette.slate[900],
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  items: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
  },
  item: {
    alignItems: "center",
    borderRadius: radius.full,
    gap: 2,
    height: 52,
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: spacing.xs,
  },
  itemFocused: {
    backgroundColor: colors.dashboard.primaryFixed,
  },
  iconShell: {
    alignItems: "center",
    height: 26,
    justifyContent: "center",
    width: 32,
  },
  iconShellFocused: {
    transform: [{ translateY: -1 }],
  },
  label: {
    ...typography.gradeBands.middle.caption,
    fontWeight: "700",
    maxWidth: MENU_ITEM_WIDTH - spacing.sm,
    textAlign: "center",
  },
  labelFocused: {
    fontWeight: "800",
  },
});
