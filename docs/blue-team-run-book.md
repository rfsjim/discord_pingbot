# Blue Team Playbooks

|                Playbook               |                         Trigger                         |                            Immediate response                            |
|:-------------------------------------:|:-------------------------------------------------------:|:------------------------------------------------------------------------:|
| IR-01: Token compromise               | Exposed token, unauthorised bot actions                 | Revoke token, contain, investigate, redeploy                             |
| IR-02: Unauthorised guild activity    | Unknown guild membership or unexpected commands         | Preserve evidence, inspect OAuth2 settings, review permissions           |
| IR-03: Hosting compromise             | Suspicious processes, files, logins or outbound traffic | Isolate service, preserve evidence, rotate credentials                   |
| IR-04: Supply-chain compromise        | Malicious npm dependency or compromised deployment      | Stop deployment, identify affected versions, rebuild from trusted source |
| IR-05: Data integrity or availability | SQLite corruption, missing records, unexpected downtime | Preserve database, restore verified backup, validate recovery            |


## IR-01 — Discord bot token compromise
$\textcolor{red}{High severity}$
1. Detect and Triage
Identify unexpected bot activity, guild membership changes, credential exposure or suspicious host access. Record timestamps in UTC and the initial indicators.
2. Contain
Reset the token through the Discord Developer Portal immediately if exposure is credible. Stop the compromised deployment if the host itself is suspect. Restrict the bot's permissions in affected guilds where necessary.
3. Preserve evidence
Export relevant application logs, hosting access logs, Discord audit logs and deployment history. Record hashes for collected evidence where appropriate. Don't delay urgent containment just to collect logs.
4. Investigate and eradicate
Determine whether the token escaped through Git, logs, environment files, an npm dependency, an account compromise or another route. Remove the exposure before issuing replacement credentials.
5. Recover
Redeploy from trusted source code with a new token. Verify guild membership, permissions, SQLite integrity and expected command behaviour.
6. Review
Document the incident timeline, root cause, impact, response effectiveness and any required control improvements.

## IR-02: Unauthorised guild activity

## IR-03: Hosting compromise

## IR-04: Supply-chain compromise

## IR-05: Data integrity or availability
