import { StatusState, type StatusStateProps } from "./StatusState";

export type SuccessStateProps = Omit<StatusStateProps, "tone">;

export function SuccessState(props: SuccessStateProps) {
  return <StatusState {...props} tone="success" />;
}
