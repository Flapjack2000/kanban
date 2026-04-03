-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Profiles (extends auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_url text,
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Boards
create table boards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  slug text unique not null,
  visibility text not null default 'private' check (visibility in ('private', 'team', 'public')),
  created_at timestamptz default now()
);

-- Board members
create table board_members (
  board_id uuid references boards(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'editor', 'viewer')),
  primary key (board_id, user_id)
);

-- Columns
create table columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references boards(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  wip_limit integer,
  created_at timestamptz default now()
);

-- Cards
create table cards (
  id uuid primary key default gen_random_uuid(),
  column_id uuid not null references columns(id) on delete cascade,
  creator_id uuid not null references profiles(id),
  title text not null,
  description text,
  position integer not null default 0,
  due_date date,
  priority text check (priority in ('low', 'medium', 'high', 'urgent')),
  created_at timestamptz default now()
);

-- Labels
create table labels (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references boards(id) on delete cascade,
  name text not null,
  color text not null default '#6366f1'
);

-- Card labels (join)
create table card_labels (
  card_id uuid references cards(id) on delete cascade,
  label_id uuid references labels(id) on delete cascade,
  primary key (card_id, label_id)
);

-- Card assignees (join)
create table card_assignees (
  card_id uuid references cards(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (card_id, user_id)
);

-- Comments
create table comments (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references cards(id) on delete cascade,
  author_id uuid not null references profiles(id),
  body text not null,
  created_at timestamptz default now()
);

-- ==================
-- Row Level Security
-- ==================

alter table profiles enable row level security;
alter table boards enable row level security;
alter table board_members enable row level security;
alter table columns enable row level security;
alter table cards enable row level security;
alter table labels enable row level security;
alter table card_labels enable row level security;
alter table card_assignees enable row level security;
alter table comments enable row level security;

-- Profiles: visible to all authenticated users, editable only by owner
create policy "profiles_select" on profiles for select to authenticated using (true);
create policy "profiles_update" on profiles for update to authenticated using (auth.uid() = id);

-- Boards: visible to members only
create policy "boards_select" on boards for select to authenticated
  using (
    visibility = 'public'
    or owner_id = auth.uid()
    or exists (select 1 from board_members where board_id = id and user_id = auth.uid())
  );
create policy "boards_insert" on boards for insert to authenticated
  with check (owner_id = auth.uid());
create policy "boards_update" on boards for update to authenticated
  using (owner_id = auth.uid());
create policy "boards_delete" on boards for delete to authenticated
  using (owner_id = auth.uid());

-- Helper function: is user a member of a board?
create or replace function is_board_member(bid uuid)
returns boolean as $$
  select exists (
    select 1 from board_members
    where board_id = bid and user_id = auth.uid()
  ) or exists (
    select 1 from boards
    where id = bid and owner_id = auth.uid()
  );
$$ language sql security definer;

-- Columns, cards, labels, comments: accessible to board members
create policy "columns_all" on columns for all to authenticated
  using (is_board_member(board_id)) with check (is_board_member(board_id));

create policy "cards_all" on cards for all to authenticated
  using (is_board_member((select board_id from columns where id = column_id)))
  with check (is_board_member((select board_id from columns where id = column_id)));

create policy "labels_all" on labels for all to authenticated
  using (is_board_member(board_id)) with check (is_board_member(board_id));

create policy "card_labels_all" on card_labels for all to authenticated
  using (is_board_member((select c.board_id from columns c join cards k on k.column_id = c.id where k.id = card_id)));

create policy "card_assignees_all" on card_assignees for all to authenticated
  using (is_board_member((select c.board_id from columns c join cards k on k.column_id = c.id where k.id = card_id)));

create policy "comments_all" on comments for all to authenticated
  using (is_board_member((select c.board_id from columns c join cards k on k.column_id = c.id where k.id = card_id)));

create policy "board_members_all" on board_members for all to authenticated
  using (is_board_member(board_id)) with check (is_board_member(board_id));