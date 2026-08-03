import { BadRequestException, Injectable } from '@nestjs/common';

import { ILike } from 'typeorm';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { type CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';
import {
  MEETING_TRANSCRIPT_CANDIDATE_LIMIT,
  MEETING_TRANSCRIPT_MAX_LENGTH,
  MEETING_TRANSCRIPT_MIN_LENGTH,
} from 'src/modules/meetings/constants/meeting-transcript.constants';
import { NoteTargetWorkspaceEntity } from 'src/modules/note/standard-objects/note-target.workspace-entity';
import { NoteWorkspaceEntity } from 'src/modules/note/standard-objects/note.workspace-entity';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { type TaskWorkspaceEntity } from 'src/modules/task/standard-objects/task.workspace-entity';
import { DiexWorkspaceContextWorkspaceEntity } from 'src/modules/workspace-context/standard-objects/diex-workspace-context.workspace-entity';

type Candidate = { id: string; name: string | null };

const readMarkdown = (
  value: { markdown?: string | null } | null,
): string | null => value?.markdown?.trim() || null;

@Injectable()
export class MeetingTranscriptService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async register(input: {
    workspaceId: string;
    transcript?: string;
    title?: string;
    meetingAt?: string;
    companyId?: string;
    personId?: string;
    opportunityId?: string;
    companySearch?: string;
    participants?: string;
  }) {
    const transcript = input.transcript?.trim() ?? '';

    if (transcript.length < MEETING_TRANSCRIPT_MIN_LENGTH) {
      throw new BadRequestException(
        `A transcrição está curta demais (${transcript.length} caracteres). Envie o texto completo da reunião.`,
      );
    }
    if (transcript.length > MEETING_TRANSCRIPT_MAX_LENGTH) {
      throw new BadRequestException(
        `A transcrição excede ${MEETING_TRANSCRIPT_MAX_LENGTH} caracteres. Divida a reunião em partes.`,
      );
    }

    const authContext = buildSystemAuthContext(input.workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const companyRepository =
          await this.globalWorkspaceOrmManager.getRepository<CompanyWorkspaceEntity>(
            input.workspaceId,
            'company',
          );
        let companyId = input.companyId?.trim() || null;
        let candidates: Candidate[] = [];

        if (!companyId && input.companySearch?.trim()) {
          const companies = await companyRepository.find({
            where: { name: ILike(`%${input.companySearch.trim()}%`) },
            take: MEETING_TRANSCRIPT_CANDIDATE_LIMIT,
          });
          candidates = companies.map((company) => ({
            id: company.id,
            name: company.name,
          }));
          if (candidates.length === 1) {
            companyId = candidates[0].id;
          } else {
            return {
              stored: false,
              noteId: null,
              candidates,
              linkedTo: {
                companyId: null,
                companyName: null,
                personId: null,
                opportunityId: null,
              },
              openOpportunities: [],
              openTasks: [],
              commercialContext: await this.readCommercialContext(
                input.workspaceId,
              ),
              guidance:
                candidates.length === 0
                  ? 'Nenhuma empresa corresponde a essa busca. Confirme o nome ou crie a empresa antes de registrar a reunião.'
                  : 'Mais de uma empresa corresponde à busca. Chame de novo com companyId para não gravar a reunião no cliente errado.',
            };
          }
        }

        const meetingAt = input.meetingAt?.trim();
        const title =
          input.title?.trim() ||
          `Reunião${meetingAt ? ` — ${meetingAt.slice(0, 10)}` : ''}`;
        const header = [
          meetingAt ? `Data: ${meetingAt}` : null,
          input.participants?.trim()
            ? `Participantes: ${input.participants.trim()}`
            : null,
        ]
          .filter((line): line is string => line !== null)
          .join('\n');
        const noteRepository =
          await this.globalWorkspaceOrmManager.getRepository<NoteWorkspaceEntity>(
            input.workspaceId,
            NoteWorkspaceEntity,
          );
        const note = (await noteRepository.save(
          noteRepository.create({
            title,
            bodyV2: {
              markdown: header
                ? `${header}\n\n## Transcrição\n\n${transcript}`
                : `## Transcrição\n\n${transcript}`,
              blocknote: null,
            },
          } as never),
        )) as unknown as NoteWorkspaceEntity;
        const noteTargetRepository =
          await this.globalWorkspaceOrmManager.getRepository<NoteTargetWorkspaceEntity>(
            input.workspaceId,
            NoteTargetWorkspaceEntity,
          );
        const personId = input.personId?.trim() || null;
        const opportunityId = input.opportunityId?.trim() || null;
        for (const target of [
          companyId ? { targetCompanyId: companyId } : null,
          personId ? { targetPersonId: personId } : null,
          opportunityId ? { targetOpportunityId: opportunityId } : null,
        ]) {
          if (target) {
            await noteTargetRepository.save(
              noteTargetRepository.create({
                noteId: note.id,
                ...target,
              } as never),
            );
          }
        }

        const opportunityRepository =
          await this.globalWorkspaceOrmManager.getRepository<OpportunityWorkspaceEntity>(
            input.workspaceId,
            'opportunity',
          );
        const taskRepository =
          await this.globalWorkspaceOrmManager.getRepository<TaskWorkspaceEntity>(
            input.workspaceId,
            'task',
          );
        const [opportunities, tasks] = companyId
          ? await Promise.all([
              opportunityRepository.find({
                where: { companyId },
                take: 10,
                order: { closeDate: 'ASC' },
              }),
              taskRepository.find({ take: 20, order: { dueAt: 'ASC' } }),
            ])
          : [[], []];

        return {
          stored: true,
          noteId: note.id,
          candidates,
          linkedTo: {
            companyId,
            companyName: companyId
              ? ((await companyRepository.findOne({ where: { id: companyId } }))
                  ?.name ?? null)
              : null,
            personId,
            opportunityId,
          },
          openOpportunities: opportunities.map((opportunity) => ({
            id: opportunity.id,
            name: opportunity.name,
            stage: opportunity.stage,
            amount: opportunity.amount?.amountMicros ?? null,
            closeDate: opportunity.closeDate?.toISOString() ?? null,
            pointOfContact: null,
          })),
          openTasks: tasks
            .filter((task) => task.status !== 'DONE')
            .map((task) => ({
              id: task.id,
              title: task.title,
              status: task.status,
              dueAt: task.dueAt?.toISOString() ?? null,
            })),
          commercialContext: await this.readCommercialContext(
            input.workspaceId,
          ),
          guidance:
            'A transcrição está gravada como nota e ligada aos registros informados. Separe fatos de inferências, atualize registros existentes e não envie mensagem ao cliente sem ação explícita do operador.',
        };
      },
      authContext,
    );
  }

  private async readCommercialContext(workspaceId: string) {
    const repository =
      await this.globalWorkspaceOrmManager.getRepository<DiexWorkspaceContextWorkspaceEntity>(
        workspaceId,
        DiexWorkspaceContextWorkspaceEntity,
      );
    const context = await repository.findOne({
      where: { status: 'ACTIVE' },
      order: { updatedAt: 'DESC' },
    });

    return {
      business: readMarkdown(context?.businessDescription ?? null),
      idealCustomerProfile: readMarkdown(context?.idealCustomerProfile ?? null),
      toneOfVoice: readMarkdown(context?.toneOfVoice ?? null),
      commercialRules: readMarkdown(context?.commercialRules ?? null),
      forbiddenClaims: readMarkdown(context?.forbiddenClaims ?? null),
    };
  }
}
