-- V29: persist scheduler last-run timestamps so missed runs (e.g. server
-- downtime) correctly catch up on their next execution instead of a fixed
-- lookback window silently skipping anything older.

CREATE TABLE scheduler_state (
    job_name     VARCHAR(100) PRIMARY KEY,
    last_run_at  TIMESTAMPTZ NOT NULL
);
