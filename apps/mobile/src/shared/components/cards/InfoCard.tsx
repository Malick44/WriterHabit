import { Card, type CardProps } from "./Card";

export type InfoCardProps = CardProps;

export function InfoCard(props: InfoCardProps) {
  return <Card {...props} />;
}
