import { BaseEmail } from 'src/components/BaseEmail';
import { CallToAction } from 'src/components/CallToAction';
import { MainText } from 'src/components/MainText';
import { Title } from 'src/components/Title';
import { type APP_LOCALES } from 'diex-shared/translations';

type WorkspaceApprovedEmailProps = {
  workspaceName: string;
  link: string;
  locale: keyof typeof APP_LOCALES;
};

export const WorkspaceApprovedEmail = ({
  workspaceName,
  link,
  locale,
}: WorkspaceApprovedEmailProps) => (
  <BaseEmail width={420} locale={locale}>
    <Title value="Seu workspace foi aprovado" />
    <MainText>
      <span>
        O workspace <strong>{workspaceName}</strong> foi liberado no Diex CRM.
        Seu contexto inicial de IA já foi preparado com as respostas do
        cadastro. Agora conecte o WhatsApp, confira o Inbox Comercial e faça o
        diagnóstico da operação com a IA.
      </span>
    </MainText>
    <br />
    <CallToAction href={link} value="Configurar meu CRM" />
    <br />
    <br />
  </BaseEmail>
);

WorkspaceApprovedEmail.PreviewProps = {
  workspaceName: 'Diex',
  link: 'https://app.crm.bydiex.com/onboarding',
  locale: 'pt-BR',
} as WorkspaceApprovedEmailProps;

export default WorkspaceApprovedEmail;
