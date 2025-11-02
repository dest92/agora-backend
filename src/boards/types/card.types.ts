export type CardPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Card {
  id: string;
  boardId: string;
  authorId: string;
  content: string;
  laneId: string | null;
  priority: CardPriority;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
}

export interface CardRow {
  id: string;
  board_id: string;
  author_id: string;
  content: string;
  lane_id: string | null;
  priority: CardPriority;
  position: number;
  created_at: Date;
  updated_at: Date;
  archived_at: Date | null;
}
