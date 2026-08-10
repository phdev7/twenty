import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('DiexCopilotResponse')
export class DiexCopilotResponseDTO {
  @Field()
  reply: string;

  @Field()
  scopeLevel: string;

  @Field(() => [String])
  workspacesAnalyzed: string[];

  @Field({ nullable: true })
  actionSuggested?: string;
}
