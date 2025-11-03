export interface DomainEvent {
  name: string;
  payload: unknown;
  meta?: {
    boardId?: string;
    workspaceId?: string;
    occurredAt: string;
  };
}

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(
    pattern: string,
    handler: (event: DomainEvent) => Promise<void> | void,
  ): Promise<void>;
}
