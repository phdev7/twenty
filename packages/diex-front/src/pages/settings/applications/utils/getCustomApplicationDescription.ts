import { t } from '@lingui/core/macro';

export const getCustomApplicationDescription =
  (): string => t`Personalizações exclusivas deste workspace.

#### O que inclui
Toda extensão criada para este workspace é agrupada aqui, mantendo alterações de dados, interface e operação em uma única camada.

- Objetos e campos específicos da operação
- Visões, itens de navegação e layouts de registros
- Funções, componentes e agentes internos

#### Como usar
Use esta camada apenas para requisitos exclusivos do workspace. Capacidades reutilizáveis e atualizações oficiais permanecem no aplicativo padrão nativo.

Extensões compartilhadas devem ser versionadas e distribuídas pela equipe técnica da Diex.`;
