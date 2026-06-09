import { Button, type ButtonProps } from "./Button";

export type PrimaryButtonProps = Omit<ButtonProps, "variant">;

export function PrimaryButton(props: PrimaryButtonProps) {
  return <Button {...props} variant="primary" />;
}
