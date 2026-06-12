import { sessionService } from "@/core/auth/sessionService";
import type { AuthLoginLinkInput, AuthSignInInput, AuthSignUpInput } from "@/core/auth/authTypes";

export const authApi = {
  async getCurrentSession() {
    return sessionService.getCurrentSession();
  },

  async signInWithEmail(input: AuthSignInInput) {
    return sessionService.signInWithEmail(input);
  },

  async signInWithEmailLink(input: AuthLoginLinkInput) {
    return sessionService.signInWithEmailLink(input);
  },

  async signUpWithEmail(input: AuthSignUpInput) {
    return sessionService.signUpWithEmail(input);
  },

  async completeOnboarding() {
    return sessionService.completeOnboarding();
  },

  async signOut() {
    return sessionService.signOut();
  },
};
