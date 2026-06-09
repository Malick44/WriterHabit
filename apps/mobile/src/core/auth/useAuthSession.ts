import { useAuthStore } from "./authStore";

export function useAuthSession() {
  return useAuthStore();
}
