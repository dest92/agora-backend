// Socket.IO event names and helpers
export const SOCKET_EVENTS = {
  CARD_CREATED: 'card:created',
  CARD_UPDATED: 'card:updated',
  CARD_MOVED: 'card:moved',
  CARD_ARCHIVED: 'card:archived',
  CARD_UNARCHIVED: 'card:unarchived',
  COMMENT_ADDED: 'comment:added',
  VOTE_CAST: 'vote:cast',
  VOTE_REMOVED: 'vote:removed',
  TAG_CREATED: 'tag:created',
  TAG_ASSIGNED: 'tag:assigned',
  TAG_UNASSIGNED: 'tag:unassigned',
  ASSIGNEE_ADDED: 'assignee:added',
  ASSIGNEE_REMOVED: 'assignee:removed',
} as const;
