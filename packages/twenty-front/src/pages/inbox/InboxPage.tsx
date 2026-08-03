import { styled } from '@linaria/react';
import { IconInbox } from 'twenty-ui/icon';

import { Inbox } from '@/inbox/components/Inbox';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';

const StyledBody = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
  padding: 4px;
`;

export const InboxPage = () => (
  <PageCardLayout header={<PageHeader title="Inbox" Icon={IconInbox} />}>
    <StyledBody>
      <Inbox />
    </StyledBody>
  </PageCardLayout>
);
