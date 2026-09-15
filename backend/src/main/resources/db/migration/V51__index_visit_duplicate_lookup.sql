CREATE INDEX idx_family_visits_duplicate_lookup
    ON family_visits(elderly_id, member_id, visited_at);
