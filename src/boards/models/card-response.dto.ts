import { Expose, Type } from 'class-transformer';

export class CardResponseDto {
  @Expose()
  id: string;

  @Expose()
  boardId: string;

  @Expose()
  authorId: string;

  @Expose()
  content: string;

  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @Type(() => Date)
  updatedAt: Date;

  @Expose()
  laneId?: string;

  @Expose()
  priority?: string;

  @Expose()
  position?: string;

  @Expose()
  @Type(() => Date)
  archivedAt?: Date;
}
