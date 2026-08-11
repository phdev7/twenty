import { WorkspaceArchitectureArtifactType } from 'src/modules/workspace-architecture/standard-objects/workspace-architecture-artifact.standard-object-definition';
import { WorkspaceFineTuningService } from 'src/modules/workspace-architecture/services/workspace-fine-tuning.service';

// O serviço é instanciado à mão porque só o `getHistory` é usado nestes
// caminhos, e o módulo de teste completo está quebrado por dependências que
// entraram no construtor do WorkspaceArchitectureService sem atualizar o spec.
const buildService = (history: unknown[]) =>
  new WorkspaceFineTuningService(
    { getHistory: jest.fn().mockResolvedValue(history) } as never,
    { getModel: jest.fn() } as never,
  );

const buildArtifact = (sourceDescriptionMarkdown: string) => ({
  artifactType: WorkspaceArchitectureArtifactType.OPERATION_PROFILE,
  payload: { segment: 'Clínica' },
  sourceDescription: { markdown: sourceDescriptionMarkdown },
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
});

describe('WorkspaceFineTuningService', () => {
  describe('collectAndSanitizeDataset', () => {
    it('should redact identifiers coming from the user description, not only from the payload', async () => {
      const service = buildService([
        buildArtifact(
          'Falar com ana@clinica.com.br pelo telefone 11987654321 sobre a agenda.',
        ),
      ]);

      const dataset = await service.collectAndSanitizeDataset('workspace-1');

      const userMessage = dataset.examples
        .flatMap((example) => example.messages)
        .find((message) => message.role === 'user');

      expect(userMessage?.content).toContain('[EMAIL_REDACTED]');
      expect(userMessage?.content).toContain('[PHONE_REDACTED]');
      expect(userMessage?.content).not.toContain('ana@clinica.com.br');
      expect(userMessage?.content).not.toContain('11987654321');
    });

    it('should keep collecting only from the requested workspace', async () => {
      const getHistory = jest.fn().mockResolvedValue([]);
      const service = new WorkspaceFineTuningService(
        { getHistory } as never,
        { getModel: jest.fn() } as never,
      );

      await service.collectAndSanitizeDataset('workspace-42');

      expect(getHistory).toHaveBeenCalledWith('workspace-42', 100);
    });
  });
});
