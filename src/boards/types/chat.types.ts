export interface ChatMessage {
  id: string;
  boardId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessageRow {
  id: string;
  board_id: string;
  user_id: string;
  content: string;
  created_at: Date;
  updated_at: Date;
}
