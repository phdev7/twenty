import { IsString, Length } from 'class-validator';

export class CompleteDiexOnboardingInput {
  @IsString()
  @Length(20, 6000)
  operationDescription: string;
}
