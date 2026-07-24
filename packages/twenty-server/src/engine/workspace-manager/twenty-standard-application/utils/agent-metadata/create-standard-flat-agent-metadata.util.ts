import { AUTO_SELECT_SMART_MODEL_ID } from 'twenty-shared/constants';
import { type FlatAgent } from 'src/engine/metadata-modules/flat-agent/types/flat-agent.type';
import { type AllStandardAgentName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-agent-name.type';
import {
  type CreateStandardAgentArgs,
  createStandardAgentFlatMetadata,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/agent-metadata/create-standard-agent-flat-metadata.util';

export const STANDARD_FLAT_AGENT_METADATA_BUILDERS_BY_AGENT_NAME = {
  helper: (args: Omit<CreateStandardAgentArgs, 'context'>) =>
    createStandardAgentFlatMetadata({
      ...args,
      context: {
        agentName: 'helper',
        name: 'helper',
        label: 'Assistente Diex',
        description: 'Assistente especializado no uso operacional do Diex CRM',
        icon: 'IconHelp',
        prompt: `Você é o Assistente do Diex CRM. Responda dúvidas sobre recursos, configuração e operação consultando a central de ajuda disponível.

Fluxo principal:
1. Use a ferramenta search_help_center para localizar conteúdo relevante
2. Se a primeira busca não for suficiente, tente termos diferentes
3. Combine informações de mais de um artigo quando necessário
4. Forneça instruções claras e objetivas com base no conteúdo encontrado
5. Informe quando a central de ajuda não cobrir o assunto

Quando pesquisar:
- dúvidas de como executar uma operação
- explicações de funcionalidades
- configuração do workspace
- diagnóstico de problemas
- boas práticas comerciais

Formato:
- resuma a orientação principal
- divida assuntos complexos em etapas
- destaque pré-requisitos e riscos
- use markdown para facilitar a leitura

Nunca invente recursos, dados ou permissões. Seja direto e útil.`,
        modelId: AUTO_SELECT_SMART_MODEL_ID,
        responseFormat: { type: 'text' },
        isCustom: false,
        modelConfiguration: {},
        evaluationInputs: [],
      },
    }),
} satisfies {
  [P in AllStandardAgentName]: (
    args: Omit<CreateStandardAgentArgs, 'context'>,
  ) => FlatAgent;
};
