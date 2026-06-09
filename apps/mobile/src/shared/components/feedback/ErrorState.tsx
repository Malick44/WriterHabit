import { StatusState, type StatusStateProps } from "./StatusState";

export type ErrorStateProps = Omit<StatusStateProps, "tone">;

export function ErrorState(props: ErrorStateProps) {
  return <StatusState {...props} tone="error" />;
}
