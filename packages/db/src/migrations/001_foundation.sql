CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE users (
 id uuid PRIMARY KEY, email text NOT NULL UNIQUE CHECK (email = lower(email)),
 display_name text NOT NULL CHECK (length(display_name) BETWEEN 1 AND 120),
 password_hash text, preferred_timezone text NOT NULL DEFAULT 'UTC',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sessions (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id),
 token_hash text NOT NULL UNIQUE CHECK (length(token_hash) = 64),
 csrf_hash text NOT NULL CHECK (length(csrf_hash) = 64),
 expires_at timestamptz NOT NULL, revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), CHECK (expires_at > created_at)
);
CREATE TABLE workspaces (
 id uuid PRIMARY KEY, slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 name text NOT NULL CHECK (length(name) BETWEEN 1 AND 120), timezone text NOT NULL,
 advance_days integer NOT NULL DEFAULT 90 CHECK (advance_days BETWEEN 1 AND 90),
 lead_minutes integer NOT NULL DEFAULT 5 CHECK (lead_minutes >= 0),
 min_duration_minutes integer NOT NULL DEFAULT 15 CHECK (min_duration_minutes > 0),
 max_duration_minutes integer NOT NULL DEFAULT 480,
 duration_increment_minutes integer NOT NULL DEFAULT 15 CHECK (duration_increment_minutes > 0),
 cancellation_cutoff_minutes integer NOT NULL DEFAULT 60 CHECK (cancellation_cutoff_minutes >= 0),
 check_in_opening_minutes integer NOT NULL DEFAULT 15 CHECK (check_in_opening_minutes >= 0),
 no_show_grace_minutes integer NOT NULL DEFAULT 15 CHECK (no_show_grace_minutes >= 0),
 version integer NOT NULL DEFAULT 1 CHECK (version > 0),
 CHECK (max_duration_minutes >= min_duration_minutes)
);
CREATE TABLE memberships (
 workspace_id uuid NOT NULL REFERENCES workspaces(id), user_id uuid NOT NULL REFERENCES users(id),
 role text NOT NULL CHECK (role IN ('member','admin')), active boolean NOT NULL DEFAULT true,
 version integer NOT NULL DEFAULT 1 CHECK (version > 0), PRIMARY KEY (workspace_id, user_id)
);
CREATE TABLE resources (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES workspaces(id),
 kind text NOT NULL CHECK (kind IN ('room','desk')), name text NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
 capacity integer NOT NULL CHECK (capacity > 0 AND (kind <> 'desk' OR capacity = 1)),
 amenities text[] NOT NULL DEFAULT '{}', archived_at timestamptz,
 version integer NOT NULL DEFAULT 1 CHECK (version > 0), UNIQUE (workspace_id, id)
);
CREATE TABLE opening_hours (
 workspace_id uuid NOT NULL REFERENCES workspaces(id), weekday integer NOT NULL CHECK (weekday BETWEEN 1 AND 7),
 opens_at_minute integer NOT NULL CHECK (opens_at_minute >= 0),
 closes_at_minute integer NOT NULL CHECK (closes_at_minute <= 1440),
 PRIMARY KEY (workspace_id, weekday), CHECK (opens_at_minute < closes_at_minute)
);
CREATE INDEX membership_user ON memberships(user_id, workspace_id) WHERE active;
CREATE INDEX resource_catalog ON resources(workspace_id, name, id) WHERE archived_at IS NULL;
