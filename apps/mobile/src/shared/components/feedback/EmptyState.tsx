import { StatusState, type StatusStateProps } from "./StatusState";

export type EmptyStateProps = Omit<StatusStateProps, "tone">;

export function EmptyState(props: EmptyStateProps) {
  return <StatusState {...props} tone="neutral" />;
}
