import { type I18n } from '@lingui/core';
import { MainText } from 'src/components/MainText';
import { SubTitle } from 'src/components/SubTitle';

type WhatIsDiexProps = {
  i18n: I18n;
};

export const WhatIsDiex = ({ i18n }: WhatIsDiexProps) => {
  return (
    <>
      <SubTitle value={i18n._('What is Diex CRM?')} />
      <MainText>
        {i18n._(
          "It's a commercial CRM with communication, automation, and artificial intelligence to help teams turn customer relationships into revenue.",
        )}
      </MainText>
    </>
  );
};
