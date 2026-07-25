import { type ReactNode } from 'react';

import { customerSuccessCommandCenterStyles as styles } from 'src/modules/customer-success-command-center/front-components/customer-success-command-center.styles';
import { type BadgeTone } from 'src/modules/customer-success-command-center/front-components/utils/customer-success-formatters';
import { Badge, Card } from 'src/ui/shadcn-twenty';

type MetricCardProps = {
  label: string;
  value: string | number;
  note: string;
  tone: BadgeTone;
  icon: ReactNode;
};

export const MetricCard = ({
  label,
  value,
  note,
  tone,
  icon,
}: MetricCardProps) => (
  <Card style={styles.metricCard}>
    <div style={styles.metricTop}>
      <p style={styles.metricLabel}>{label}</p>
      <Badge tone={tone}>{icon}</Badge>
    </div>
    <p style={styles.metricValue}>{value}</p>
    <p style={styles.smallMuted}>{note}</p>
  </Card>
);
