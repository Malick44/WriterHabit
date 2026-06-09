import { useI18n } from "./index";

export function useT() {
  return useI18n().t;
}
