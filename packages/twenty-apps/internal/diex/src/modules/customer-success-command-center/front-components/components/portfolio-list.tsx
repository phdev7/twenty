import { themeCssVariables } from 'twenty-ui/theme-constants';

import { customerSuccessCommandCenterStyles as styles } from 'src/modules/customer-success-command-center/front-components/customer-success-command-center.styles';
import { type CustomerSuccessPlan } from 'src/modules/customer-success-command-center/front-components/customer-success-command-center.types';
import {
  formatPlanMoney,
  getDatePressureLabel,
  getHealthLabel,
  getHealthTone,
  getLifecycleLabel,
  getRecordName,
} from 'src/modules/customer-success-command-center/front-components/utils/customer-success-formatters';
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
} from 'src/ui/shadcn-twenty';

const PORTFOLIO_FILTERS = [
  ['ALL', 'Todos'],
  ['RISK', 'Risco'],
  ['RENEWAL', 'Renovação'],
  ['EXPANSION', 'Expansão'],
  ['OVERDUE', 'Revisão vencida'],
];

type PortfolioListProps = {
  plans: CustomerSuccessPlan[];
  selectedPlanId: string | null;
  filter: string;
  onFilterChange: (filter: string) => void;
  onSelectPlan: (planId: string) => void;
};

export const PortfolioList = ({
  plans,
  selectedPlanId,
  filter,
  onFilterChange,
  onSelectPlan,
}: PortfolioListProps) => (
  <Card style={styles.portfolioCard}>
    <CardHeader style={styles.portfolioHeader}>
      <CardTitle>Carteira priorizada</CardTitle>
      <CardDescription>
        Risco, revisão vencida e renovação próxima aparecem primeiro.
      </CardDescription>
      <div style={styles.filterRow}>
        {PORTFOLIO_FILTERS.map(([value, label]) => (
          <Button
            key={value}
            variant={filter === value ? 'default' : 'ghost'}
            style={{ height: themeCssVariables.spacing[7] }}
            onClick={() => onFilterChange(value)}
          >
            {label}
          </Button>
        ))}
      </div>
    </CardHeader>
    <div style={styles.portfolioList}>
      {plans.length === 0 ? (
        <div style={styles.empty}>Nenhum plano encontrado neste recorte.</div>
      ) : (
        plans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            style={{
              ...styles.planButton,
              ...(selectedPlanId === plan.id ? styles.planButtonSelected : {}),
            }}
            onClick={() => onSelectPlan(plan.id)}
          >
            <div style={styles.planTop}>
              <p style={styles.planName}>{plan.name}</p>
              <Badge tone={getHealthTone(plan.health)}>
                {getHealthLabel(plan.health)}
              </Badge>
            </div>
            <p style={styles.planCompany}>
              {getRecordName(plan.company) || 'Empresa não vinculada'} ·{' '}
              {getLifecycleLabel(plan.lifecycle)}
            </p>
            <Progress
              value={plan.healthScore ?? 0}
              tone={getHealthTone(plan.health)}
            />
            <div style={styles.planMeta}>
              <span>{formatPlanMoney(plan.recurringRevenue)}</span>
              <span>renovação {getDatePressureLabel(plan.renewalDate)}</span>
            </div>
          </button>
        ))
      )}
    </div>
  </Card>
);
