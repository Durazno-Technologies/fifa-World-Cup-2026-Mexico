DROP INDEX IF EXISTS idx_sessions_user;
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
