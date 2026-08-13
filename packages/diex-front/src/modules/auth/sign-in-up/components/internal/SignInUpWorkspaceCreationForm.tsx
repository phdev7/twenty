import { useSignUpInNewWorkspace } from '@/auth/sign-in-up/hooks/useSignUpInNewWorkspace';
import { OnboardingAnimatedReveal } from '@/onboarding/components/OnboardingAnimatedReveal';
import { OnboardingStepAnimatedItem } from '@/onboarding/components/OnboardingStepAnimatedItem';
import { ONBOARDING_CONTENT_BLOCK_WIDTH } from '@/onboarding/constants/OnboardingContentBlockWidth';
import { useWorkspaceSubdomainField } from '@/auth/sign-in-up/hooks/useWorkspaceSubdomainField';
import { isCreatingWorkspaceState } from '@/auth/states/isCreatingWorkspaceState';
import { isMultiWorkspaceEnabledState } from '@/client-config/states/isMultiWorkspaceEnabledState';
import { domainConfigurationState } from '@/domain-manager/states/domainConfigurationState';
import { TextInput } from '@/ui/input/components/TextInput';
import { TextArea } from '@/ui/input/components/TextArea';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useEffect, useRef, useState } from 'react';
import { Key } from 'ts-key-enum';
import { isDefined } from 'diex-shared/utils';
import { Avatar } from 'diex-ui/data-display';
import { IconTrash, IconUpload } from 'diex-ui/icon';
import { Button, LightIconButton, MainButton } from 'diex-ui/input';
import { themeCssVariables } from 'diex-ui/theme-constants';

const StyledContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[14]};
  max-width: 100%;
  width: ${ONBOARDING_CONTENT_BLOCK_WIDTH}px;
`;

const StyledHeading = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
`;

const StyledTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.xl};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  line-height: 1.2;
`;

const StyledSubtitle = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.md};
  line-height: 1.4;
`;

const StyledFormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[8]};
  padding-bottom: ${themeCssVariables.spacing[4]};
  width: 100%;
`;

const StyledLogoRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledLogoAvatar = styled(Avatar)`
  height: ${themeCssVariables.spacing[8]};
  width: ${themeCssVariables.spacing[8]};
`;

const StyledLogoButtons = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing['0.5']};
`;

const StyledHiddenFileInput = styled.input`
  display: none;
`;

const StyledSubdomainSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  width: 100%;
`;

const StyledAlternativesBox = styled.div`
  background-color: ${themeCssVariables.background.transparent.lighter};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledAlternativesLabel = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding-bottom: ${themeCssVariables.spacing[1]};
`;

const StyledAlternativeRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledAlternativeRow = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  color: ${themeCssVariables.color.green};
  cursor: pointer;
  display: flex;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  gap: ${themeCssVariables.spacing[1]};
  padding: 2px 0;
  text-align: left;
`;

const StyledAvailabilityDotBox = styled.div`
  display: flex;
  padding: ${themeCssVariables.spacing[1]};
`;

const StyledAvailabilityDot = styled.div`
  background-color: ${themeCssVariables.color.green};
  border-radius: 50%;
  box-shadow: 0 0 0 3px ${themeCssVariables.color.green5};
  corner-shape: round;
  flex-shrink: 0;
  height: 6px;
  width: 6px;
`;

const StyledStepIndicator = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledActions = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: 120px minmax(0, 1fr);
  width: 100%;
`;

const StyledChoiceGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  width: 100%;
`;

const StyledOptionalHint = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  line-height: 1.4;
  margin: 0;
`;

const OPERATION_STEPS = [
  'goal',
  'description',
  'customer',
  'process',
  'size',
  'voice',
  'channel',
] as const;

type WorkspaceCreationStep = 'workspace' | (typeof OPERATION_STEPS)[number];

const COMMERCIAL_GOALS = [
  { key: 'SELL_MORE', label: 'Vender mais' },
  { key: 'RESPOND_FASTER', label: 'Responder leads mais rápido' },
  { key: 'ORGANIZE_WHATSAPP', label: 'Organizar o WhatsApp' },
  { key: 'CONTROL_FOLLOWUPS', label: 'Controlar follow-ups' },
  {
    key: 'CUSTOMER_SUCCESS_RENEWALS',
    label: 'Melhorar Customer Success e renovações',
  },
] as const;

const PRIMARY_CHANNELS = [
  { key: 'WHATSAPP', label: 'WhatsApp' },
  { key: 'EMAIL', label: 'E-mail' },
  { key: 'IMPORT', label: 'Importar uma base' },
  { key: 'MANUAL', label: 'Operar sem integração' },
] as const;

export const SignInUpWorkspaceCreationForm = () => {
  const { t } = useLingui();
  const { createWorkspace } = useSignUpInNewWorkspace();
  const { frontDomain } = useAtomStateValue(domainConfigurationState);
  const isMultiWorkspaceEnabled = useAtomStateValue(
    isMultiWorkspaceEnabledState,
  );

  const isCreatingWorkspace = useAtomStateValue(isCreatingWorkspaceState);
  const setIsCreatingWorkspace = useSetAtomState(isCreatingWorkspaceState);
  const [logo, setLogo] = useState<File | undefined>(undefined);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | undefined>(
    undefined,
  );
  const hiddenFileInputRef = useRef<HTMLInputElement>(null);
  const [formStep, setFormStep] = useState<WorkspaceCreationStep>('workspace');
  const [whatsapp, setWhatsapp] = useState('');
  const [primaryChannel, setPrimaryChannel] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [idealCustomerProfile, setIdealCustomerProfile] = useState('');
  const [toneOfVoice, setToneOfVoice] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [currentProcess, setCurrentProcess] = useState('');

  const {
    workspaceName,
    subdomain,
    status,
    errorMessage,
    suggestions,
    isAvailable,
    handleWorkspaceNameChange,
    handleSubdomainChange,
    applySuggestionValue,
  } = useWorkspaceSubdomainField({
    isSubdomainEnabled: isMultiWorkspaceEnabled,
  });

  const isWorkspaceStepDisabled =
    workspaceName.trim() === '' ||
    isCreatingWorkspace ||
    (isMultiWorkspaceEnabled && !isAvailable);
  const whatsappDigits = whatsapp.replace(/\D/g, '');
  const isWhatsappValid =
    primaryChannel !== 'WHATSAPP' ||
    whatsappDigits.length === 0 ||
    (whatsappDigits.length >= 10 && whatsappDigits.length <= 15);
  const isCurrentStepDisabled =
    isCreatingWorkspace ||
    (formStep === 'workspace'
      ? isWorkspaceStepDisabled
      : formStep === 'goal'
        ? primaryGoal === ''
        : formStep === 'description'
          ? companyDescription.trim().length < 10
          : formStep === 'customer'
            ? idealCustomerProfile.trim().length < 5
            : formStep === 'process'
              ? currentProcess.trim().length < 5
              : formStep === 'size'
                ? companySize.trim() === ''
                : formStep === 'voice'
                  ? toneOfVoice.trim().length < 3
                  : primaryChannel === '' || !isWhatsappValid);
  const allSteps = ['workspace', ...OPERATION_STEPS] as const;
  const currentStepIndex = allSteps.indexOf(formStep);

  const openFilePicker = () => {
    hiddenFileInputRef.current?.click();
  };

  const handleLogoUpload = (file: File) => {
    if (!isDefined(file)) {
      return;
    }
    setLogo(file);
    setLogoPreviewUrl(URL.createObjectURL(file));
  };

  const handleLogoRemove = () => {
    setLogo(undefined);
    setLogoPreviewUrl(undefined);
  };

  useEffect(() => {
    if (!isDefined(logoPreviewUrl)) {
      return;
    }

    return () => {
      URL.revokeObjectURL(logoPreviewUrl);
    };
  }, [logoPreviewUrl]);

  const handleSubmit = async () => {
    if (
      isWorkspaceStepDisabled ||
      primaryChannel === '' ||
      !isWhatsappValid ||
      companyDescription.trim().length < 10 ||
      idealCustomerProfile.trim().length < 5 ||
      toneOfVoice.trim().length < 3 ||
      primaryGoal === '' ||
      companySize.trim() === '' ||
      currentProcess.trim().length < 5
    ) {
      return;
    }

    setIsCreatingWorkspace(true);

    const isWorkspaceCreated = await createWorkspace({
      displayName: workspaceName.trim(),
      ...(isMultiWorkspaceEnabled ? { subdomain } : {}),
      logo,
      whatsapp:
        primaryChannel === 'WHATSAPP'
          ? whatsapp.trim() || undefined
          : undefined,
      primaryChannel,
      companyDescription: companyDescription.trim(),
      idealCustomerProfile: idealCustomerProfile.trim(),
      toneOfVoice: toneOfVoice.trim(),
      primaryGoal: primaryGoal.trim(),
      companySize: companySize.trim(),
      currentProcess: currentProcess.trim(),
    });

    if (!isWorkspaceCreated) {
      setIsCreatingWorkspace(false);
    }
  };

  const goToNextStep = () => {
    if (isCurrentStepDisabled) {
      return;
    }

    if (formStep === 'channel') {
      void handleSubmit();
      return;
    }

    const nextStep = allSteps[currentStepIndex + 1];

    if (isDefined(nextStep)) {
      setFormStep(nextStep);
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0 && !isCreatingWorkspace) {
      const previousStep = allSteps[currentStepIndex - 1];

      if (isDefined(previousStep)) {
        setFormStep(previousStep);
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) {
      return;
    }
    if (event.key === Key.Enter) {
      event.preventDefault();
      goToNextStep();
    }
  };

  const subdomainError =
    status === 'invalid'
      ? errorMessage
      : status === 'unavailable'
        ? t`This address is already taken`
        : status === 'error'
          ? t`Couldn't check availability. Please try again.`
          : undefined;

  const stepTitle: Record<WorkspaceCreationStep, string> = {
    workspace: 'Crie seu workspace',
    goal: 'Qual resultado vem primeiro?',
    description: 'O que sua empresa vende?',
    customer: 'Quem é o cliente ideal?',
    process: 'Como a operação funciona hoje?',
    size: 'Quem participa da operação?',
    voice: 'Como a empresa deve se comunicar?',
    channel: 'Como os clientes entram?',
  };

  const stepSubtitle: Record<WorkspaceCreationStep, string> = {
    workspace: 'Defina a identidade e o endereço do seu CRM.',
    goal: 'O Diex priorizará a configuração pelo resultado com maior impacto.',
    description:
      'Informe produto, serviço, segmento e como a empresa gera receita.',
    customer: 'Descreva segmento, perfil, problema e momento de compra.',
    process: 'Conte as etapas, ferramentas atuais e o principal gargalo.',
    size: 'Informe o tamanho da equipe e quantas pessoas atendem ou vendem.',
    voice: 'Defina o tom que a IA deve respeitar nas sugestões.',
    channel:
      'WhatsApp é opcional. O CRM também pode operar por e-mail, importação ou cadastro manual.',
  };

  return (
    <StyledContentContainer>
      <StyledHeading>
        <OnboardingStepAnimatedItem index={0}>
          <StyledStepIndicator>
            Etapa {currentStepIndex + 1} de {allSteps.length}
          </StyledStepIndicator>
          <StyledTitle>{stepTitle[formStep]}</StyledTitle>
        </OnboardingStepAnimatedItem>
        <OnboardingStepAnimatedItem index={1}>
          <StyledSubtitle>{stepSubtitle[formStep]}</StyledSubtitle>
        </OnboardingStepAnimatedItem>
      </StyledHeading>
      {formStep === 'workspace' ? (
        <>
          <StyledFormSection>
            <OnboardingStepAnimatedItem index={2}>
              <StyledLogoRow>
                <StyledLogoAvatar
                  avatarUrl={logoPreviewUrl}
                  placeholder={
                    isNonEmptyString(workspaceName) ? workspaceName : '?'
                  }
                  placeholderColorSeed={workspaceName}
                  type="squared"
                  size="xl"
                  onClick={openFilePicker}
                />
                <StyledHiddenFileInput
                  type="file"
                  ref={hiddenFileInputRef}
                  accept="image/jpeg, image/png, image/gif"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (isDefined(file)) {
                      handleLogoUpload(file);
                    }
                    event.target.value = '';
                  }}
                />
                <StyledLogoButtons>
                  <Button
                    Icon={IconUpload}
                    title={t`Upload logo`}
                    variant="secondary"
                    onClick={openFilePicker}
                  />
                  <LightIconButton
                    Icon={IconTrash}
                    accent="tertiary"
                    size="medium"
                    onClick={handleLogoRemove}
                    disabled={!isDefined(logoPreviewUrl)}
                    aria-label={t`Remove logo`}
                  />
                </StyledLogoButtons>
              </StyledLogoRow>
            </OnboardingStepAnimatedItem>
            <OnboardingStepAnimatedItem index={3}>
              <TextInput
                autoFocus
                label="Nome da empresa"
                value={workspaceName}
                placeholder="Sua empresa"
                onChange={handleWorkspaceNameChange}
                onKeyDown={handleKeyDown}
                fullWidth
              />
            </OnboardingStepAnimatedItem>
            {isMultiWorkspaceEnabled && (
              <OnboardingStepAnimatedItem index={4}>
                <StyledSubdomainSection>
                  <TextInput
                    label="Endereço"
                    value={subdomain}
                    placeholder="sua-empresa"
                    onChange={handleSubdomainChange}
                    onKeyDown={handleKeyDown}
                    rightAdornment={
                      isNonEmptyString(frontDomain)
                        ? `.${frontDomain}`
                        : undefined
                    }
                    error={subdomainError}
                    noErrorHelper={
                      status === 'unavailable' || !isDefined(subdomainError)
                    }
                    fullWidth
                  />
                  <OnboardingAnimatedReveal
                    isVisible={status === 'unavailable'}
                  >
                    <StyledAlternativesBox>
                      <StyledAlternativesLabel>
                        Este endereço já está em uso. Escolha uma alternativa:
                      </StyledAlternativesLabel>
                      <StyledAlternativeRows>
                        {suggestions.map((alternative) => (
                          <StyledAlternativeRow
                            key={alternative}
                            type="button"
                            onClick={() => applySuggestionValue(alternative)}
                          >
                            <StyledAvailabilityDotBox>
                              <StyledAvailabilityDot />
                            </StyledAvailabilityDotBox>
                            {alternative}
                          </StyledAlternativeRow>
                        ))}
                      </StyledAlternativeRows>
                    </StyledAlternativesBox>
                  </OnboardingAnimatedReveal>
                </StyledSubdomainSection>
              </OnboardingStepAnimatedItem>
            )}
          </StyledFormSection>
          <OnboardingStepAnimatedItem index={isMultiWorkspaceEnabled ? 5 : 4}>
            <MainButton
              title="Continuar"
              onClick={goToNextStep}
              disabled={isCurrentStepDisabled}
              fullWidth
            />
          </OnboardingStepAnimatedItem>
        </>
      ) : (
        <>
          <StyledFormSection>
            {formStep === 'goal' ? (
              <OnboardingStepAnimatedItem key={formStep} index={2}>
                <StyledChoiceGrid>
                  {COMMERCIAL_GOALS.map((goal) => (
                    <Button
                      key={goal.key}
                      title={goal.label}
                      variant={
                        primaryGoal === goal.key ? 'primary' : 'secondary'
                      }
                      onClick={() => setPrimaryGoal(goal.key)}
                    />
                  ))}
                </StyledChoiceGrid>
              </OnboardingStepAnimatedItem>
            ) : null}
            {formStep === 'description' ? (
              <OnboardingStepAnimatedItem key={formStep} index={2}>
                <TextArea
                  textAreaId="workspace-company-description"
                  label="Empresa, segmento e ofertas"
                  value={companyDescription}
                  placeholder="Explique o serviço, produto, mercado e como a empresa gera receita."
                  minRows={3}
                  maxRows={6}
                  onChange={setCompanyDescription}
                />
              </OnboardingStepAnimatedItem>
            ) : null}
            {formStep === 'customer' ? (
              <OnboardingStepAnimatedItem key={formStep} index={2}>
                <TextArea
                  textAreaId="workspace-ideal-customer"
                  label="Quem é o cliente ideal"
                  value={idealCustomerProfile}
                  placeholder="Segmento, porte, problema e momento de compra."
                  minRows={2}
                  maxRows={5}
                  onChange={setIdealCustomerProfile}
                />
              </OnboardingStepAnimatedItem>
            ) : null}
            {formStep === 'process' ? (
              <OnboardingStepAnimatedItem key={formStep} index={2}>
                <TextArea
                  textAreaId="workspace-current-process"
                  label="Processo atual e gargalos"
                  value={currentProcess}
                  placeholder="Ferramentas, etapas comerciais, responsáveis e pontos onde a receita se perde."
                  minRows={3}
                  maxRows={6}
                  onChange={setCurrentProcess}
                />
              </OnboardingStepAnimatedItem>
            ) : null}
            {formStep === 'size' ? (
              <OnboardingStepAnimatedItem key={formStep} index={2}>
                <TextInput
                  autoFocus
                  label="Tamanho da operação"
                  value={companySize}
                  placeholder="Ex.: 8 pessoas, sendo 3 em vendas"
                  onChange={setCompanySize}
                  onKeyDown={handleKeyDown}
                  fullWidth
                />
              </OnboardingStepAnimatedItem>
            ) : null}
            {formStep === 'voice' ? (
              <OnboardingStepAnimatedItem key={formStep} index={2}>
                <TextInput
                  autoFocus
                  label="Tom de voz da empresa"
                  value={toneOfVoice}
                  placeholder="Ex.: consultivo, direto, técnico e humano"
                  onChange={setToneOfVoice}
                  onKeyDown={handleKeyDown}
                  fullWidth
                />
              </OnboardingStepAnimatedItem>
            ) : null}
            {formStep === 'channel' ? (
              <OnboardingStepAnimatedItem key={formStep} index={2}>
                <StyledFormSection>
                  <StyledChoiceGrid>
                    {PRIMARY_CHANNELS.map((channel) => (
                      <Button
                        key={channel.key}
                        title={channel.label}
                        variant={
                          primaryChannel === channel.key
                            ? 'primary'
                            : 'secondary'
                        }
                        onClick={() => setPrimaryChannel(channel.key)}
                      />
                    ))}
                  </StyledChoiceGrid>
                  <OnboardingAnimatedReveal
                    isVisible={primaryChannel === 'WHATSAPP'}
                  >
                    <TextInput
                      autoFocus
                      label="Número de contato (opcional)"
                      value={whatsapp}
                      placeholder="+55 31 99999-9999"
                      onChange={setWhatsapp}
                      onKeyDown={handleKeyDown}
                      error={
                        whatsapp.length > 0 && !isWhatsappValid
                          ? 'Informe um número válido ou deixe em branco.'
                          : undefined
                      }
                      fullWidth
                    />
                  </OnboardingAnimatedReveal>
                  <StyledOptionalHint>
                    Nenhuma conexão será criada antes da aprovação. Depois, você
                    decide se gera o QR Code ou continua sem WhatsApp.
                  </StyledOptionalHint>
                </StyledFormSection>
              </OnboardingStepAnimatedItem>
            ) : null}
          </StyledFormSection>
          <OnboardingStepAnimatedItem index={3}>
            <StyledActions>
              <Button
                title="Voltar"
                variant="secondary"
                onClick={goToPreviousStep}
              />
              <MainButton
                title={
                  formStep === 'channel' ? 'Enviar para aprovação' : 'Continuar'
                }
                onClick={goToNextStep}
                disabled={isCurrentStepDisabled}
                fullWidth
              />
            </StyledActions>
          </OnboardingStepAnimatedItem>
        </>
      )}
    </StyledContentContainer>
  );
};
