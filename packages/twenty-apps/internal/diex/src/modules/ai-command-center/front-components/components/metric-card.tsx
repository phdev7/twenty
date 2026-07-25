import { type ReactNode } from 'react';

import { aiCommandCenterStyles as styles } from 'src/modules/ai-command-center/front-components/ai-command-center.styles';
import { type BadgeTone } from 'src/modules/ai-command-center/front-components/utils/ai-command-center-formatters';
import { Badge, Card } from 'src/ui/shadcn-twenty';

export const MetricCard = ({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string | number;
  tone: BadgeTone;
  icon: ReactNode;
}) => (
  <Card style={styles.metricCard}>
    <div style={styles.queueTopLine}>
      <p style={styles.metricLabel}>{label}</p>
      <Badge tone={tone}>{icon}</Badge>
    </div>
    <p style={styles.metricValue}>{value}</p>
  </Card>
);
