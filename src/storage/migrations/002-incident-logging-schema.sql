CREATE TABLE IF NOT EXISTS security_incidents (
	id INTEGER PRIMARY KEY,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	category TEXT NOT NULL,
	severity TEXT NOT NULL CHECK (
		severity IN ('info', 'warning', 'critical')
	),
	guild_id TEXT,
	description TEXT NOT NULL,
	incident_status TEXT NOT NULL DEFAULT 'open' CHECK (
		incident_status IN ('open', 'resolved', 'failed')
	),
	details TEXT,
	notification_status TEXT NOT NULL DEFAULT 'pending' CHECK (
		notification_status IN ('pending', 'sent', 'failed')
	)
);

CREATE INDEX IF NOT EXISTS idx_security_incidents_status_created
ON security_incidents (incident_status, created_at);

PRAGMA user_version = 2;
