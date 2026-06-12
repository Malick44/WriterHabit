import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

export const BOTTOM_MENU_SCROLL_EVENT_THROTTLE = 16;

const SCROLL_COLLAPSE_DELTA = 14;
const SCROLL_TOP_EXPAND_OFFSET = 8;

interface BottomMenuContextValue {
  collapse: () => void;
  expand: () => void;
  isCollapsed: boolean;
}

const noop = () => undefined;

const BottomMenuContext = createContext<BottomMenuContextValue>({
  collapse: noop,
  expand: noop,
  isCollapsed: false,
});

export function BottomMenuProvider({ children }: PropsWithChildren) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const collapse = useCallback(() => {
    setIsCollapsed(true);
  }, []);

  const expand = useCallback(() => {
    setIsCollapsed(false);
  }, []);

  const value = useMemo(
    () => ({
      collapse,
      expand,
      isCollapsed,
    }),
    [collapse, expand, isCollapsed],
  );

  return <BottomMenuContext.Provider value={value}>{children}</BottomMenuContext.Provider>;
}

export function useBottomMenu() {
  return useContext(BottomMenuContext);
}

export function useBottomMenuScrollHandler() {
  const { collapse, expand } = useBottomMenu();
  const lastOffsetYRef = useRef(0);

  return useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextOffsetY = Math.max(0, event.nativeEvent.contentOffset.y);
      const delta = nextOffsetY - lastOffsetYRef.current;

      if (nextOffsetY <= SCROLL_TOP_EXPAND_OFFSET) {
        expand();
      } else if (delta > SCROLL_COLLAPSE_DELTA) {
        collapse();
      }

      lastOffsetYRef.current = nextOffsetY;
    },
    [collapse, expand],
  );
}
