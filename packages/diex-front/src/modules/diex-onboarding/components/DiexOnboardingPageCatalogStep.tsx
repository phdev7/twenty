import { useState } from 'react';
import { styled } from '@linaria/react';
import { Button } from 'diex-ui/input';
import { themeCssVariables } from 'diex-ui/theme-constants';

import {
  type DiexPageBlock,
  type DiexPageCatalogItem,
  type DiexPageCatalogState,
  type DiexPageRenderer,
  type DiexPageUpdateInput,
} from '@/diex-onboarding/types/diexOnboardingTypes';
import {
  DiexOnboardingStepCard,
  StyledActions,
  StyledText,
} from '@/diex-onboarding/components/DiexOnboardingStepCard';

const StyledList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledRow = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[2]} 0;
`;

const StyledRowText = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
`;

const StyledLabel = styled.strong`
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledDescription = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
`;

const StyledStatus = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xxs};
  text-transform: uppercase;
`;

const StyledForm = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const StyledInput = styled.input`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  min-height: 34px;
  padding: 0 ${themeCssVariables.spacing[2]};
`;

const StyledTextarea = styled.textarea`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  min-height: 64px;
  padding: ${themeCssVariables.spacing[2]};
  resize: vertical;
`;

const StyledSelect = styled.select`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  min-height: 34px;
  padding: 0 ${themeCssVariables.spacing[2]};
`;

const StyledEditor = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
  width: 100%;
`;

const StyledBlockEditor = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledAdvanced = styled.details`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  padding-top: ${themeCssVariables.spacing[2]};
`;

const StyledAdvancedSummary = styled.summary`
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.xs};
  margin-bottom: ${themeCssVariables.spacing[2]};
`;

const StyledBlockRow = styled.div`
  align-items: center;
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns:
    minmax(0, 1.4fr) minmax(120px, 0.8fr) minmax(0, 1.4fr)
    auto;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const PAGE_RENDERERS: DiexPageRenderer[] = [
  'INBOX',
  'DASHBOARD',
  'PIPELINE',
  'CALENDAR',
  'OPERATIONS',
  'CUSTOM',
];

type DiexOnboardingPageCatalogStepProps = {
  catalog: DiexPageCatalogState | null;
  isLoading: boolean;
  isReadConfirmed?: boolean;
  isUpdating: boolean;
  errorMessage?: string | null;
  onRefresh?: () => void;
  onCreate: (label: string, description: string) => Promise<boolean>;
  onArchive: (key: string) => void;
  onRestore: (key: string) => void;
  onToggleNavigation: (page: DiexPageCatalogItem) => void;
  onUpdate: (page: DiexPageUpdateInput) => Promise<boolean>;
};

export const DiexOnboardingPageCatalogStep = ({
  catalog,
  isLoading,
  isReadConfirmed = true,
  isUpdating,
  errorMessage,
  onRefresh,
  onCreate,
  onArchive,
  onRestore,
  onToggleNavigation,
  onUpdate,
}: DiexOnboardingPageCatalogStepProps) => {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [editDraft, setEditDraft] = useState<DiexPageUpdateInput | null>(null);
  const pages = catalog?.items ?? [];
  const isMutationBlocked = isUpdating || !isReadConfirmed;

  const startEditing = (page: DiexPageCatalogItem) => {
    setEditDraft({
      key: page.key,
      label: page.label,
      description: page.description,
      icon: page.icon,
      renderer: page.renderer,
      navigationGroup: page.navigationGroup,
      capabilities: page.capabilities,
      primaryAction: page.primaryAction,
      dataSources: page.dataSources,
      blocks: page.blocks,
    });
  };

  const updateDraftBlock = (index: number, update: Partial<DiexPageBlock>) => {
    setEditDraft((current) =>
      current
        ? {
            ...current,
            blocks: (current.blocks ?? []).map((block, blockIndex) =>
              blockIndex === index ? { ...block, ...update } : block,
            ),
          }
        : current,
    );
  };

  const addDraftBlock = () => {
    setEditDraft((current) => {
      if (!current) {
        return current;
      }

      const blockNumber = (current.blocks?.length ?? 0) + 1;
      const block: DiexPageBlock = {
        key: `${current.key}-manual-${blockNumber}`,
        label: `Bloco operacional ${blockNumber}`,
        type: 'LIST',
        title: `Bloco operacional ${blockNumber}`,
        description: 'Acompanha uma decisão da operação.',
        dataSources: current.dataSources ?? [],
        actionLabel: 'Abrir primeiros passos',
        actionRoute: '/diex/first-steps',
        sourceTemplateIds: [],
        configuration: { pageKey: current.key },
        position: blockNumber - 1,
      };

      return { ...current, blocks: [...(current.blocks ?? []), block] };
    });
  };

  const removeDraftBlock = (index: number) => {
    setEditDraft((current) =>
      current
        ? {
            ...current,
            blocks: (current.blocks ?? [])
              .filter((_, blockIndex) => blockIndex !== index)
              .map((block, position) => ({ ...block, position })),
          }
        : current,
    );
  };

  return (
    <DiexOnboardingStepCard
      index={8}
      isDone={pages.length > 0}
      title="Páginas e menu adaptados à operação"
    >
      <StyledText>
        O menu e as páginas seguem o perfil da empresa. O administrador pode
        renomear, reorganizar, ocultar, arquivar ou criar páginas sem apagar os
        dados. A configuração técnica fica disponível apenas quando necessária.
      </StyledText>
      {errorMessage ? (
        <>
          <StyledText role="alert">{errorMessage}</StyledText>
          {onRefresh ? (
            <StyledActions>
              <Button
                title="Tentar carregar novamente"
                variant="secondary"
                disabled={isLoading}
                onClick={onRefresh}
              />
            </StyledActions>
          ) : null}
        </>
      ) : null}
      {!isReadConfirmed ? (
        <StyledText role="alert">
          O catálogo exibido não foi confirmado nesta leitura. Alterações de
          páginas e menu estão bloqueadas até atualizar os dados.
        </StyledText>
      ) : null}
      {isLoading && pages.length === 0 ? (
        <StyledText>Preparando catálogo operacional...</StyledText>
      ) : pages.length === 0 ? (
        <StyledText>
          O catálogo ainda não possui páginas. Crie abaixo a primeira página
          orientada à decisão da operação.
        </StyledText>
      ) : (
        <StyledList>
          {pages.map((page) => (
            <StyledRow key={page.key}>
              <StyledRowText>
                <StyledLabel>{page.label}</StyledLabel>
                <StyledDescription>{page.description}</StyledDescription>
                <StyledDescription>
                  Ação principal: {page.primaryAction}
                </StyledDescription>
                <StyledStatus>
                  {page.lifecycle === 'CORE'
                    ? 'núcleo adaptável'
                    : page.status === 'HIDDEN'
                      ? 'aguardando publicação da arquitetura'
                      : page.status === 'ARCHIVED'
                        ? 'arquivada'
                        : page.lifecycle === 'CUSTOM'
                          ? 'personalizada'
                          : 'recomendada'}
                </StyledStatus>
              </StyledRowText>
              <StyledActions>
                {page.status === 'ARCHIVED' ? (
                  <Button
                    title="Restaurar"
                    variant="secondary"
                    disabled={isMutationBlocked}
                    onClick={() => onRestore(page.key)}
                  />
                ) : page.status === 'HIDDEN' ? null : page.editable ? (
                  <>
                    <Button
                      title="Mover para cima"
                      variant="secondary"
                      disabled={isMutationBlocked || page.position === 0}
                      onClick={() =>
                        void onUpdate({
                          key: page.key,
                          position: Math.max(0, page.position - 1),
                        })
                      }
                    />
                    <Button
                      title="Mover para baixo"
                      variant="secondary"
                      disabled={
                        isMutationBlocked || page.position >= pages.length - 1
                      }
                      onClick={() =>
                        void onUpdate({
                          key: page.key,
                          position: Math.min(
                            pages.length - 1,
                            page.position + 1,
                          ),
                        })
                      }
                    />
                    <Button
                      title={
                        page.showInNavigation ? 'Ocultar menu' : 'Mostrar menu'
                      }
                      variant="secondary"
                      disabled={isMutationBlocked}
                      onClick={() => onToggleNavigation(page)}
                    />
                    {page.key === 'first-steps' ? null : (
                      <Button
                        title="Arquivar"
                        variant="secondary"
                        disabled={isMutationBlocked}
                        onClick={() => onArchive(page.key)}
                      />
                    )}
                    <Button
                      title="Editar página"
                      variant="secondary"
                      disabled={isMutationBlocked}
                      onClick={() => startEditing(page)}
                    />
                  </>
                ) : null}
              </StyledActions>
              {editDraft?.key === page.key ? (
                <StyledEditor>
                  <StyledInput
                    aria-label={`Nome de ${page.label}`}
                    value={editDraft.label ?? ''}
                    onChange={(event) =>
                      setEditDraft((current) =>
                        current
                          ? { ...current, label: event.target.value }
                          : current,
                      )
                    }
                  />
                  <StyledTextarea
                    aria-label={`Objetivo de ${page.label}`}
                    value={editDraft.description ?? ''}
                    onChange={(event) =>
                      setEditDraft((current) =>
                        current
                          ? { ...current, description: event.target.value }
                          : current,
                      )
                    }
                  />
                  <StyledAdvanced>
                    <StyledAdvancedSummary>
                      Configuração avançada de menu, dados e blocos
                    </StyledAdvancedSummary>
                    <StyledForm>
                      <StyledSelect
                        aria-label="Renderer da página"
                        value={editDraft.renderer ?? 'OPERATIONS'}
                        onChange={(event) =>
                          setEditDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  renderer: event.target
                                    .value as DiexPageRenderer,
                                }
                              : current,
                          )
                        }
                      >
                        {PAGE_RENDERERS.map((renderer) => (
                          <option key={renderer} value={renderer}>
                            {renderer}
                          </option>
                        ))}
                      </StyledSelect>
                      <StyledInput
                        aria-label="Grupo do menu"
                        placeholder="Grupo do menu"
                        value={editDraft.navigationGroup ?? ''}
                        onChange={(event) =>
                          setEditDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  navigationGroup: event.target.value,
                                }
                              : current,
                          )
                        }
                      />
                      <StyledInput
                        aria-label="Ícone da página"
                        placeholder="Ícone: chart, inbox, calendar..."
                        value={editDraft.icon ?? ''}
                        onChange={(event) =>
                          setEditDraft((current) =>
                            current
                              ? { ...current, icon: event.target.value }
                              : current,
                          )
                        }
                      />
                      <StyledInput
                        aria-label="Capacidades da página"
                        placeholder="Capacidades separadas por vírgula"
                        value={editDraft.capabilities?.join(', ') ?? ''}
                        onChange={(event) =>
                          setEditDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  capabilities: event.target.value
                                    .split(',')
                                    .map((capability) => capability.trim())
                                    .filter(Boolean),
                                }
                              : current,
                          )
                        }
                      />
                      <StyledInput
                        aria-label="Ação principal"
                        placeholder="Ação principal"
                        value={editDraft.primaryAction ?? ''}
                        onChange={(event) =>
                          setEditDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  primaryAction: event.target.value,
                                }
                              : current,
                          )
                        }
                      />
                      <StyledInput
                        aria-label="Fontes de dados"
                        placeholder="Fontes de dados separadas por vírgula"
                        value={editDraft.dataSources?.join(', ') ?? ''}
                        onChange={(event) =>
                          setEditDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  dataSources: event.target.value
                                    .split(',')
                                    .map((source) => source.trim())
                                    .filter(Boolean),
                                }
                              : current,
                          )
                        }
                      />
                    </StyledForm>
                    <StyledBlockEditor>
                      <StyledDescription>
                        Blocos da página. A ordem e a fonte orientam a leitura
                        da operação sem alterar os dados nativos.
                      </StyledDescription>
                      {(editDraft.blocks ?? []).map((block, index) => (
                        <StyledBlockRow key={block.key}>
                          <StyledInput
                            aria-label={`Nome do bloco ${index + 1}`}
                            value={block.label}
                            onChange={(event) =>
                              updateDraftBlock(index, {
                                label: event.target.value,
                                title: event.target.value,
                              })
                            }
                          />
                          <StyledSelect
                            aria-label={`Tipo do bloco ${index + 1}`}
                            value={block.type}
                            onChange={(event) =>
                              updateDraftBlock(index, {
                                type: event.target
                                  .value as DiexPageBlock['type'],
                              })
                            }
                          >
                            {[
                              'KPI',
                              'LIST',
                              'PIPELINE',
                              'INBOX',
                              'CALENDAR',
                              'TIMELINE',
                              'CHECKLIST',
                              'AI_SUMMARY',
                            ].map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </StyledSelect>
                          <StyledInput
                            aria-label={`Fontes do bloco ${index + 1}`}
                            placeholder="Fontes separadas por vírgula"
                            value={block.dataSources.join(', ')}
                            onChange={(event) =>
                              updateDraftBlock(index, {
                                dataSources: event.target.value
                                  .split(',')
                                  .map((source) => source.trim())
                                  .filter(Boolean),
                              })
                            }
                          />
                          <Button
                            title="Remover bloco"
                            variant="secondary"
                            disabled={
                              isMutationBlocked ||
                              (editDraft.blocks?.length ?? 0) <= 1
                            }
                            onClick={() => removeDraftBlock(index)}
                          />
                        </StyledBlockRow>
                      ))}
                      <StyledActions>
                        <Button
                          title="Adicionar bloco"
                          variant="secondary"
                          disabled={
                            isMutationBlocked ||
                            (editDraft.blocks?.length ?? 0) >= 12
                          }
                          onClick={addDraftBlock}
                        />
                      </StyledActions>
                    </StyledBlockEditor>
                  </StyledAdvanced>
                  <StyledActions>
                    <Button
                      title="Salvar adaptação"
                      variant="primary"
                      disabled={
                        isMutationBlocked ||
                        (editDraft.label ?? '').trim().length < 2 ||
                        (editDraft.description ?? '').trim().length < 1
                      }
                      onClick={() =>
                        void onUpdate(editDraft).then((updated) => {
                          if (updated) {
                            setEditDraft(null);
                          }
                        })
                      }
                    />
                    <Button
                      title="Cancelar"
                      variant="secondary"
                      disabled={isMutationBlocked}
                      onClick={() => setEditDraft(null)}
                    />
                  </StyledActions>
                </StyledEditor>
              ) : null}
            </StyledRow>
          ))}
        </StyledList>
      )}
      <StyledForm>
        <StyledInput
          aria-label="Nome da nova página"
          placeholder="Nome da nova página"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        />
        <StyledTextarea
          aria-label="Objetivo da nova página"
          placeholder="Objetivo: que decisão ou ação da operação esta página deve apoiar?"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </StyledForm>
      <StyledActions>
        <Button
          title="Criar página personalizada"
          variant="primary"
          disabled={isMutationBlocked || label.trim().length < 2}
          onClick={() =>
            void onCreate(label, description).then((created) => {
              if (created) {
                setLabel('');
                setDescription('');
              }
            })
          }
        />
      </StyledActions>
    </DiexOnboardingStepCard>
  );
};
