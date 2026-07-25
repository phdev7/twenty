import { type ReactNode } from 'react';

import { renewalCommandCenterStyles as styles } from 'src/modules/renewal-command-center/front-components/renewal-command-center.styles';

export const MetricCell = ({
  label,
  value,
  note,
}: {
  label: string;
  value: ReactNode;
  note: string;
}) => (
  <div style={styles.metricCell}>
    <p style={styles.metricLabel}>{label}</p>
    <p style={styles.metricValue}>{value}</p>
    <p style={styles.metricNote}>{note}</p>
  </div>
);

export const Field = ({
  label,
  wide = false,
  children,
}: {
  label: string;
  wide?: boolean;
  children: ReactNode;
}) => (
  <label style={wide ? styles.fieldWide : styles.field}>
    <span style={styles.fieldLabel}>{label}</span>
    {children}
  </label>
);