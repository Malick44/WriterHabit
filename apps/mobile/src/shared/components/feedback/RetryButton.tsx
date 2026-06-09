import { Button, type ButtonProps } from "@/shared/components/buttons/Button";

export interface RetryButtonProps
  extends Omit<ButtonProps, "label" | "loading" | "onPress" | "variant"> {
  label: string;
  onRetry?: ButtonProps["onPress"];
  retrying?: boolean;
}

export function RetryButton({
  label,
  onRetry,
  retrying = false,
  disabled,
  size = "sm",
  ...buttonProps
}: RetryButtonProps) {
  return (
    <Button
      {...buttonProps}
      disabled={disabled}
      label={label}
      loading={retrying}
      onPress={onRetry}
      size={size}
      variant="secondary"
    />
  );
}
