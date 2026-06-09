import type { AuthSignInInput, AuthSignUpInput } from "@/core/auth/authTypes";

async function getSessionService() {
  const { sessionService } = await import("@/core/auth/sessionService");
  return sessionService;
}

export const authApi = {
  async getCurrentSession() {
    return getSessionService().then((sessionService) => sessionService.getCurrentSession());
  },

  async signInWithEmail(input: AuthSignInInput) {
    return getSessionService().then((sessionService) => sessionService.signInWithEmail(input));
  },

  async signUpWithEmail(input: AuthSignUpInput) {
    return getSessionService().then((sessionService) => sessionService.signUpWithEmail(input));
  },

  async completeOnboarding() {
    return getSessionService().then((sessionService) => sessionService.completeOnboarding());
  },

  async signOut() {
    return getSessionService().then((sessionService) => sessionService.signOut());
  },
};
