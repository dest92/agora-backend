# ÁGORA / DB-CONTEXT (Supabase-only, DEV)

meta:
  project: "Agora TP"
  platform: "Supabase (Postgres + Auth + Realtime Channels)"
  style: "schemas by domain (microservices logical)"
  security: "RLS=ON with DEV-open policies"
  notes: "No DB changes; use Realtime Channels for broadcast/presence"

schemas:
  - users
  - boards
  - sessions
  - notifications
  - events
  - projections

entities:

  users.profiles:
    pk: (user_id uuid)
    refs:
      - auth.users(id) on delete cascade
    cols:
      - display_name text
      - avatar_url text?
      - created_at timestamptz=now()
      - updated_at timestamptz?
    rls:
      - dev_select_all(authenticated)
      - dev_upsert_self: insert/update when auth.uid()=user_id

  users.team_memberships:
    pk: (team_id uuid, user_id uuid)
    refs:
      - boards.teams(id)
      - users.profiles(user_id)
    cols:
      - role enum('owner','admin','member')
      - created_at timestamptz=now()
    idx:
      - user_id
      - team_id
    rls:
      - dev_all(authenticated)

  boards.teams:
    pk: (id uuid=gen_random_uuid())
    refs:
      - created_by -> users.profiles(user_id)
    cols:
      - name text
      - created_at timestamptz=now()
      - updated_at timestamptz?
    rls:
      - dev_all(authenticated)

  boards.workspaces:
    pk: (id uuid=gen_random_uuid())
    refs:
      - created_by -> users.profiles(user_id)
    cols:
      - name text
      - created_at timestamptz=now()
    idx:
      - name
    rls:
      - dev_all(authenticated)

  boards.workspace_memberships:
    pk: (workspace_id uuid, user_id uuid)
    refs:
      - boards.workspaces(id) cascade
      - users.profiles(user_id) cascade
    cols:
      - role enum('owner','admin','member')=member
      - joined_at timestamptz=now()
    idx:
      - user_id
    rls:
      - dev_all(authenticated)

  boards.boards:
    pk: (id uuid=gen_random_uuid())
    refs:
      - team_id -> boards.teams(id)
      - workspace_id? -> boards.workspaces(id)
      - created_by -> users.profiles(user_id)
    cols:
      - title text
      - created_at timestamptz=now()
      - updated_at timestamptz?
    idx:
      - team_id
      - workspace_id
    rls:
      - dev_all(authenticated)

  boards.lanes:
    pk: (id uuid=gen_random_uuid())
    refs:
      - board_id -> boards.boards(id) cascade
    cols:
      - name text
      - color text?
      - position numeric(10,3)=1000
      - created_at timestamptz=now()
    uniq:
      - (board_id, name)
    idx:
      - (board_id, position)
    rls:
      - dev_all(authenticated)

  boards.cards:
    pk: (id uuid=gen_random_uuid())
    refs:
      - board_id -> boards.boards(id) cascade
      - lane_id? -> boards.lanes(id)
      - author_id -> users.profiles(user_id)
    cols:
      - content text
      - status text='active'
      - priority enum('low','normal','high','urgent')='normal'
      - position numeric(10,3)=1000
      - archived_at timestamptz?
      - created_at timestamptz=now()
      - updated_at timestamptz?
    idx:
      - (board_id, lane_id)
    triggers:
      - set_updated_at() before update
      - notify_card_insert() after insert
    rls:
      - dev_all(authenticated)

  boards.comments:
    pk: (id uuid=gen_random_uuid())
    refs:
      - card_id -> boards.cards(id) cascade
      - author_id -> users.profiles(user_id)
    cols:
      - content text
      - created_at timestamptz=now()
    idx:
      - card_id
    rls:
      - dev_all(authenticated)

  boards.votes:
    pk: (id uuid=gen_random_uuid())
    refs:
      - card_id -> boards.cards(id) cascade
      - voter_id -> users.profiles(user_id)
    cols:
      - kind enum('up','down')='up'
      - weight int=1
      - created_at timestamptz=now()
    uniq:
      - (card_id, voter_id)
    idx:
      - card_id
    rls:
      - dev_all(authenticated)

  boards.tags:
    pk: (id uuid=gen_random_uuid())
    refs:
      - board_id -> boards.boards(id) cascade
    cols:
      - label text
      - color text?
    uniq:
      - (board_id, label)
    idx:
      - board_id
    rls:
      - dev_all(authenticated)

  boards.card_tags:
    pk: (card_id uuid, tag_id uuid)
    refs:
      - card_id -> boards.cards(id) cascade
      - tag_id  -> boards.tags(id) cascade
    idx:
      - tag_id
    rls:
      - dev_all(authenticated)

  boards.card_assignees:
    pk: (card_id uuid, user_id uuid)
    refs:
      - card_id -> boards.cards(id) cascade
      - user_id -> users.profiles(user_id) cascade
    cols:
      - assigned_at timestamptz=now()
    idx:
      - user_id
    rls:
      - dev_all(authenticated)

  sessions.sessions:
    pk: (id uuid=gen_random_uuid())
    refs:
      - board_id -> boards.boards(id) cascade
      - created_by -> users.profiles(user_id)
    cols:
      - started_at timestamptz=now()
      - ended_at timestamptz?
    idx:
      - board_id
    rls:
      - dev_all(authenticated)

  sessions.session_participants:
    pk: (session_id uuid, user_id uuid)
    refs:
      - session_id -> sessions.sessions(id) cascade
      - user_id -> users.profiles(user_id)
    cols:
      - joined_at timestamptz=now()
      - left_at timestamptz?
    idx:
      - user_id
    rls:
      - dev_all(authenticated)

  notifications.notifications:
    pk: (id uuid=gen_random_uuid())
    refs:
      - user_id -> users.profiles(user_id) cascade
    cols:
      - type text
      - title text
      - body text
      - read_at timestamptz?
      - created_at timestamptz=now()
    idx:
      - user_id
      - created_at
    rls:
      - dev_self_only(authenticated via auth.uid()=user_id)

  events.domain_events:
    pk: (event_id uuid=gen_random_uuid())
    cols:
      - event_type text
      - version int
      - aggregate_type text
      - aggregate_id uuid
      - occurred_at timestamptz=now()
      - payload jsonb
    idx:
      - (aggregate_type, aggregate_id)
    rls:
      - dev_all(authenticated)

  projections.mv_board_lane_counts (MATERIALIZED VIEW):
    cols:
      - board_id uuid
      - ideas_count int
      - discuss_count int
      - decided_count int
    keys:
      - unique(board_id)
    refresh: projections.refresh_mv_board_lane_counts()

  projections.mv_card_counters (MATERIALIZED VIEW):
    cols:
      - card_id uuid
      - comments_count int
      - likes_count int
      - dislikes_count int
    keys:
      - unique(card_id)
    refresh: projections.refresh_mv_card_counters()

functions:
  public.set_updated_at(): "before update set NEW.updated_at=now()"
  events.notify_card_insert(): "pg_notify('cards_inserted', json(new.*))"
  projections.refresh_mv_board_lane_counts(): "refresh mv concurrently"
  projections.refresh_mv_card_counters(): "refresh mv concurrently"

realtime:
  rooms:
    - "room:workspace:{workspaceId}"
    - "room:board:{boardId}"
  presence:
    - "channel.track({ userId, boardId }) in board room"
  events:
    - "lane:created|updated|deleted"
    - "card:created|moved|updated|archived"
    - "comment:added"
    - "vote:cast"
    - "workspace:joined|left"
  pattern: "write DB -> broadcast channel -> clients update UI"

queries-ui:
  lanes.byBoard: "select id,name,color,position from boards.lanes where board_id=:B order by position,created_at"
  cards.byLane: "select * from boards.cards where board_id=:B and lane_id=:L and archived_at is null order by position,created_at"
  board.counters: "select * from projections.mv_board_lane_counts where board_id=:B"
  card.counters: "select * from projections.mv_card_counters where card_id in (:IDS)"
  card.tags: "select t.* from boards.card_tags ct join boards.tags t on t.id=ct.tag_id where ct.card_id=:C"
  card.assignees: "select a.user_id,p.display_name from boards.card_assignees a join users.profiles p on p.user_id=a.user_id where a.card_id=:C"
  workspaces.byUser: "select w.* from boards.workspace_memberships m join boards.workspaces w on w.id=m.workspace_id where m.user_id=:U order by w.created_at desc"
  boards.byWorkspace: "select * from boards.boards where workspace_id=:W order by created_at desc"

notes:
  - "IDs uuid via gen_random_uuid()"
  - "ordering via position numeric(10,3)"
  - "DEV policies are open; fine-grained perms not required for TP"
  - "Use Supabase REST (PostgREST) or JS client; JWKS Auth in backend if needed"
