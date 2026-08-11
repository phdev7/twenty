import { styled } from '@linaria/react';
import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconArrowRight, IconRocket } from 'diex-ui/icon';
import { Button, Card, CardContent, CardHeader, Loader, Tag } from 'diex-ui';
import { themeCssVariables } from 'diex-ui/theme-constants';

const StyledPage = styled.main`
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  min-height: 0;
  overflow: auto;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledHeader = styled.header`
  align-items: flex-start;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[4]};
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[5]};
`;

const StyledTitle = styled.h1`
  font-size: 28px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: -0.03em;
  line-height: 1.15;
  margin: 0;
`;

const StyledDescription = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  line-height: 1.5;
  margin: ${themeCssVariables.spacing[2]} 0 0;
  max-width: 760px;
`;

const StyledMetricGrid = styled.section`
  display: grid;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
`;

const StyledMetricLabel = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  margin: 0;
  text-transform: uppercase;
`;

const StyledMetricValue = styled.p`
  font-size: 24px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: ${themeCssVariables.spacing[2]} 0 0;
`;

const StyledContentGrid = styled.section<{ columns?: number }>`
  align-items: start;
  display: grid;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: repeat(
    ${({ columns = 2 }) => columns},
    minmax(0, 1fr)
  );

  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
  }
`;

const StyledCardTitle = styled.h2`
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledCardAction = styled.div`
  margin-top: ${themeCssVariables.spacing[3]};
`;

const StyledEmptyState = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  line-height: 1.5;
  margin: 0;
`;

const StyledStartState = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  max-width: 680px;
`;

const StyledStartTitle = styled.h3`
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledStartText = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  line-height: 1.5;
  margin: 0;
`;

const StyledList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledRow = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[2]} 0;

  &:last-child {
    border-bottom: 0;
  }
`;

const StyledRowMain = styled.div`
  min-width: 0;
`;

const StyledRowTitle = styled.p`
  font-weight: ${themeCssVariables.font.weight.medium};
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledRowDetail = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  margin: ${themeCssVariables.spacing[1]} 0 0;
`;

export const CommandCenterPage = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <StyledPage>
    <StyledHeader>
      <div>
        <StyledTitle>{title}</StyledTitle>
        <StyledDescription>{description}</StyledDescription>
      </div>
      <Tag color="green" text="Operação ativa" />
    </StyledHeader>
    {children}
  </StyledPage>
);

export const CommandCenterMetrics = ({ children }: { children: ReactNode }) => (
  <StyledMetricGrid>{children}</StyledMetricGrid>
);

export const CommandCenterMetric = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <Card fullWidth>
    <CardContent>
      <StyledMetricLabel>{label}</StyledMetricLabel>
      <StyledMetricValue>{value}</StyledMetricValue>
    </CardContent>
  </Card>
);

export const CommandCenterGrid = ({
  children,
  columns,
}: {
  children: ReactNode;
  columns?: number;
}) => <StyledContentGrid columns={columns}>{children}</StyledContentGrid>;

export const CommandCenterCard = ({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) => (
  <Card fullWidth>
    <CardHeader>
      <StyledCardTitle>{title}</StyledCardTitle>
    </CardHeader>
    <CardContent>
      {children}
      {action ? <StyledCardAction>{action}</StyledCardAction> : null}
    </CardContent>
  </Card>
);

export const CommandCenterEmptyState = ({
  message,
  actionLabel = 'Continuar ativação comercial',
  to = '/diex/first-steps',
}: {
  message: string;
  actionLabel?: string;
  to?: string;
}) => {
  const navigate = useNavigate();

  return (
    <StyledEmptyState>
      <span>{message}</span>
      <div>
        <Button
          title={actionLabel}
          variant="secondary"
          onClick={() => navigate(to)}
        />
      </div>
    </StyledEmptyState>
  );
};

export const CommandCenterStartState = ({
  title,
  message,
  actionLabel = 'Abrir primeiros passos',
  to = '/diex/first-steps',
}: {
  title: string;
  message: string;
  actionLabel?: string;
  to?: string;
}) => {
  const navigate = useNavigate();

  return (
    <StyledStartState>
      <IconRocket size={24} />
      <StyledStartTitle>{title}</StyledStartTitle>
      <StyledStartText>{message}</StyledStartText>
      <div>
        <Button
          title={actionLabel}
          Icon={IconArrowRight}
          variant="primary"
          onClick={() => navigate(to)}
        />
      </div>
    </StyledStartState>
  );
};

export const CommandCenterLoadingState = () => <Loader color="blue" />;

export const CommandCenterList = ({ children }: { children: ReactNode }) => (
  <StyledList>{children}</StyledList>
);

export const CommandCenterRow = ({
  title,
  detail,
  action,
}: {
  title: string;
  detail?: string;
  action?: ReactNode;
}) => (
  <StyledRow>
    <StyledRowMain>
      <StyledRowTitle>{title}</StyledRowTitle>
      {detail ? <StyledRowDetail>{detail}</StyledRowDetail> : null}
    </StyledRowMain>
    {action}
  </StyledRow>
);
