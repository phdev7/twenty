import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';

import { currentUserState } from '@/auth/states/currentUserState';
import {
  type CustomerSuccessAiAction,
  type CustomerSuccessHandoffOpportunity,
  type CustomerSuccessMilestone,
  type CustomerSuccessPlan,
  type CustomerSuccessWorkspaceMember,
} from '@/diex-command-centers/customer-success/types';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

const CUSTOMER_SUCCESS_COMMAND_CENTER_QUERY = gql`
  query DiexCustomerSuccessCommandCenter {
    successPlans(first: 100, orderBy: [{ renewalDate: AscNullsLast }]) {
      totalCount
      edges {
        node {
          id
          name
          lifecycle
          health
          healthScore
          activeUseRating
          valueEvidenceRating
          expansionSignal
          recurringRevenue {
            amountMicros
            currencyCode
          }
          startDate
          renewalDate
          nextReviewAt
          objectives {
            markdown
          }
          successCriteria {
            markdown
          }
          risks {
            markdown
          }
          executiveSummary {
            markdown
          }
          updatedAt
          company {
            id
            name
          }
          primaryContact {
            id
            name {
              firstName
              lastName
            }
          }
          owner {
            id
            userId
            name {
              firstName
              lastName
            }
          }
          opportunity {
            id
            name
          }
          milestones {
            edges {
              node {
                id
                name
                category
                status
                dueAt
                completedAt
                impact
                outcome {
                  markdown
                }
                evidence {
                  markdown
                }
              }
            }
          }
          aiActions {
            edges {
              node {
                id
                name
                status
                requestedAt
              }
            }
          }
        }
      }
    }
    opportunities(
      first: 100
      filter: { stage: { eq: CUSTOMER } }
      orderBy: [{ updatedAt: DescNullsLast }]
    ) {
      totalCount
      edges {
        node {
          id
          name
          closeDate
          updatedAt
          amount {
            amountMicros
            currencyCode
          }
          company {
            id
            name
            diexLifecycle
          }
          pointOfContact {
            id
            name {
              firstName
              lastName
            }
          }
          owner {
            id
            userId
            name {
              firstName
              lastName
            }
          }
          diexOffer {
            id
            name
            pricingModel
            valueProposition {
              markdown
            }
          }
        }
      }
    }
    workspaceMembers(first: 200) {
      edges {
        node {
          id
          userId
          name {
            firstName
            lastName
          }
        }
      }
    }
  }
`;

type SuccessPlanNode = Omit<CustomerSuccessPlan, 'milestones' | 'aiActions'> & {
  milestones?: { edges?: Array<{ node: CustomerSuccessMilestone }> } | null;
  aiActions?: { edges?: Array<{ node: CustomerSuccessAiAction }> } | null;
};
type QueryData = {
  successPlans?: {
    totalCount?: number;
    edges?: Array<{ node: SuccessPlanNode }>;
  };
  opportunities?: {
    totalCount?: number;
    edges?: Array<{ node: CustomerSuccessHandoffOpportunity }>;
  };
  workspaceMembers?: {
    edges?: Array<{ node: CustomerSuccessWorkspaceMember }>;
  };
};

export const useCustomerSuccessCommandCenter = () => {
  const currentUser = useAtomStateValue(currentUserState);
  const { data, loading, error, refetch } = useQuery<QueryData>(
    CUSTOMER_SUCCESS_COMMAND_CENTER_QUERY,
    {
      fetchPolicy: 'network-only',
      notifyOnNetworkStatusChange: true,
    },
  );
  const plans =
    data?.successPlans?.edges?.map(({ node }) => ({
      ...node,
      milestones:
        node.milestones?.edges?.map(({ node: milestone }) => milestone) ?? [],
      aiActions: node.aiActions?.edges?.map(({ node: action }) => action) ?? [],
    })) ?? [];
  const workspaceMembers =
    data?.workspaceMembers?.edges?.map(({ node }) => node) ?? [];
  const coveredOpportunityIds = new Set(
    plans
      .map(({ opportunity }) => opportunity?.id)
      .filter((id): id is string => Boolean(id)),
  );
  const handoffOpportunities =
    data?.opportunities?.edges
      ?.map(({ node }) => node)
      .filter(({ id }) => !coveredOpportunityIds.has(id)) ?? [];
  const currentWorkspaceMemberId =
    workspaceMembers.find(({ userId }) => userId === currentUser?.id)?.id ??
    null;
  const planTotalCount = data?.successPlans?.totalCount ?? plans.length;
  const handoffTotalCount =
    data?.opportunities?.totalCount ?? handoffOpportunities.length;
  const dataLoadedAt = useMemo(
    () => (data ? new Date().toISOString() : null),
    [data],
  );

  return {
    plans,
    handoffOpportunities,
    workspaceMembers,
    currentWorkspaceMemberId,
    planTotalCount,
    handoffTotalCount,
    isPartial:
      planTotalCount > plans.length ||
      handoffTotalCount > (data?.opportunities?.edges?.length ?? 0),
    dataLoadedAt,
    isLoading: loading,
    errorMessage: error ? 'Não foi possível carregar Customer Success.' : null,
    load: refetch,
  };
};
