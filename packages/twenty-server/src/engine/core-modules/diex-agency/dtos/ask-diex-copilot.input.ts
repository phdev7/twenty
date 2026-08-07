import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType('AskDiexCopilotInput')
export class AskDiexCopilotInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  prompt: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  currentWorkspaceId?: string;
}
