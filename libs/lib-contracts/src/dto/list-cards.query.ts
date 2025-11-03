import { IsOptional, IsUUID } from 'class-validator';

export class ListCardsQuery {
  @IsOptional()
  @IsUUID()
  laneId?: string;
}
