import { type ReactNode } from 'react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { commercialIntelligenceStyles as styles } from 'src/modules/commercial-intelligence/front-components/commercial-intelligence.styles';
import {
  type CommercialOpportunity,
} from 'src/modules/commercial-intelligence/front-components/commercial-intelligence.types';
import {
  BadgeTone,
  getRecordName,
  getRiskLabel,
  getRiskTone,
  openRecord,
} from 'src/modules/commercial-intelligence/front-components/utils/commercial-intelligence-formatters';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  Progress,
} from 'src/ui/shadcn-twenty';

export const KpiCard = ({
  title,
  value,
  description,
  tone,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  tone: BadgeTone;
  icon: ReactNode;
}) => (
  <Card>
    <CardHeader style={{ paddingBottom: themeCssVariables.spacing[2] }}>
      <div style={styles.sectionHeader}>
        <CardDescription>{title}</CardDescription>
        <Badge tone={tone}>{icon}</Badge>
      </div>
    </CardHeader>
    <CardContent>
      <div style={styles.kpiContent}>
        <span style={styles.kpiValue}>{value}</span>
        <CardDescription style={{ maxWidth: 130, textAlign: 'right' }}>
          {description}
        </CardDescription>
      </div>
    </CardContent>
  </Card>
);
export const OpportunityRank = ({
  opportunity,
}: {
  opportunity: CommercialOpportunity;
}) => {
  const score = Math.max(0, Math.min(100, opportunity.commercialScore ?? 0));
  const scoreTone: BadgeTone =
    score >= 75 ? 'green' : score >= 50 ? 'orange' : 'gray';

  return (
    <button
      type="button"
      style={{
        background: 'transparent',
        border: 0,
        cursor: 'pointer',
        fontFamily: themeCssVariables.font.family,
        padding: 0,
        textAlign: 'left',
        width: '100%',
      }}
      onClick={() => void openRecord(opportunity.id, 'opportunity')}
    >
      <div style={styles.opportunityHeader}>
        <p style={styles.opportunityName}>
          {getRecordName(opportunity) || 'Oportunidade sem nome'}
        </p>
        <Badge tone={scoreTone}>{Math.round(score)} pts</Badge>
      </div>
      <p style={styles.opportunityMeta}>
        {getRecordName(opportunity.company) || 'Empresa não vinculada'} ·{' '}
        {opportunity.stage || 'Sem etapa'}
      </p>
      <Progress value={score} tone={scoreTone} />
      <div style={{ marginTop: themeCssVariables.spacing[2] }}>
        <Badge tone={getRiskTone(opportunity.dealRisk)}>
          {getRiskLabel(opportunity.dealRisk)}
        </Badge>
      </div>
    </button>
  );
};