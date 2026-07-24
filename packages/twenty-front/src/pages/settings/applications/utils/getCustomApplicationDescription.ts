import { t } from '@lingui/core/macro';

export const getCustomApplicationDescription =
  (): string => t`Personalizações exclusivas deste workspace Diex CRM.

#### O que inclui
Toda extensão criada para este workspace é agrupada aqui, mantendo alterações de dados, interface e operação em uma única camada.

- Objetos e campos específicos da operação
- Visões, itens de navegação e layouts de registros
- Funções, componentes e agentes internos

#### Como usar
Use esta camada apenas para requisitos exclusivos do tenant. Capacidades comerciais reutilizáveis e atualizações oficiais permanecem no Diex CRM Core.

Extensões compartilhadas devem ser versionadas e distribuídas pela equipe técnica da Diex.`;
