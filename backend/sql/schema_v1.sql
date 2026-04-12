create table if not exists accounts (
  id bigserial primary key,
  email varchar(255) not null unique,
  username varchar(40) not null unique,
  password_hash text not null,
  status varchar(20) not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists players (
  id bigserial primary key,
  account_id bigint not null unique references accounts(id) on delete cascade,
  display_name varchar(40) not null,
  avatar_url text,
  rank varchar(60) not null default 'Mlody wilk',
  level integer not null default 1,
  respect integer not null default 0,
  heat integer not null default 0,
  hp integer not null default 100,
  energy integer not null default 10,
  cash_wallet bigint not null default 0,
  cash_bank bigint not null default 0,
  attack integer not null default 5,
  defense integer not null default 5,
  charisma integer not null default 5,
  stamina integer not null default 5,
  created_at timestamptz not null default now()
);

create table if not exists gangs (
  id bigserial primary key,
  name varchar(60) not null unique,
  tag varchar(8) not null unique,
  owner_player_id bigint references players(id) on delete set null,
  level integer not null default 1,
  vault_balance bigint not null default 0,
  territory_score integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists gang_members (
  id bigserial primary key,
  gang_id bigint not null references gangs(id) on delete cascade,
  player_id bigint not null references players(id) on delete cascade,
  role varchar(20) not null default 'member',
  joined_at timestamptz not null default now(),
  unique (gang_id, player_id)
);

create table if not exists heist_definitions (
  id bigserial primary key,
  slug varchar(60) not null unique,
  name varchar(120) not null,
  unlock_respect integer not null,
  energy_cost integer not null,
  min_reward integer not null,
  max_reward integer not null,
  base_success numeric(5, 2) not null,
  heat_gain integer not null default 1
);

create table if not exists heist_runs (
  id bigserial primary key,
  player_id bigint not null references players(id) on delete cascade,
  heist_id bigint not null references heist_definitions(id) on delete cascade,
  result varchar(20) not null,
  reward integer not null default 0,
  damage integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists businesses (
  id bigserial primary key,
  slug varchar(60) not null unique,
  name varchar(120) not null,
  unlock_respect integer not null,
  buy_price bigint not null,
  base_income bigint not null,
  upkeep_cost bigint not null default 0
);

create table if not exists player_businesses (
  id bigserial primary key,
  player_id bigint not null references players(id) on delete cascade,
  business_id bigint not null references businesses(id) on delete cascade,
  level integer not null default 1,
  security_level integer not null default 1,
  last_collected_at timestamptz,
  unique (player_id, business_id)
);
