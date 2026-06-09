import { useAuthSession } from "@/core/auth/useAuthSession";

export function useAuth() {
  const auth = useAuthSession();

  return {
    ...auth,
    clearError: () => auth.setErrorCode(null),
    isBusy: auth.operationStatus === "loading" || auth.status === "hydrating",
  };
}
