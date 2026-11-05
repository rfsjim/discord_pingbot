# Blue Team Playbooks

|                Playbook               |                         Trigger                         |                            Immediate response                            |
|:-------------------------------------:|:-------------------------------------------------------:|:------------------------------------------------------------------------:|
| IR-01: [Token compromise](#ir-01--discord-bot-token-compromise)               | Exposed token, unauthorised bot actions                 | Revoke token, contain, investigate, redeploy                             |
| IR-02: [Unauthorised guild activity](#ir-02-unauthorised-guild-activity)    | Unknown guild membership or unexpected commands         | Preserve evidence, inspect OAuth2 settings, review permissions           |
| IR-03: [Hosting compromise](#ir-03-hosting-compromise)             | Suspicious processes, files, logins or outbound traffic | Isolate service, preserve evidence, rotate credentials                   |
| IR-04: [Supply-chain compromise](#ir-04-supply-chain-compromise)        | Malicious npm dependency or compromised deployment      | Stop deployment, identify affected versions, rebuild from trusted source |
| IR-05: [Data integrity or availability](#ir-05-data-integrity-or-availability) | SQLite corruption, missing records, unexpected downtime | Preserve database, restore verified backup, validate recovery            |

*Escalate any incident to high severity when it creates credible bot-token exposure, compromises the hosting trust boundary, affects multiple guilds, or makes the deployed code or stored preferences untrustworthy.*

## IR-01 — Discord bot token compromise

$\textcolor{red}{\text{High severity}}$

1. Detect and Triage
   - Identify unexpected bot activity, guild membership changes, credential exposure or suspicious host access.
   - Record timestamps in UTC and the initial indicators.
2. Contain
   - Reset the token through the Discord Developer Portal immediately if exposure is credible.
   - Stop the compromised deployment if the host itself is suspect.
   - Restrict the bot's permissions in affected guilds where necessary.
3. Preserve evidence
   - Export relevant application logs, hosting access logs, Discord audit logs and deployment history.
   - Record hashes for collected evidence where appropriate.
   - Don't delay urgent containment just to collect logs.
4. Investigate and eradicate
   - Determine whether the token escaped through Git, logs, environment files, an npm dependency, an account compromise or another route.
   - Remove the exposure before issuing replacement credentials.
5. Recover
   - Redeploy from trusted source code with a new token.
   - Verify guild membership, permissions, SQLite integrity and expected command behaviour.
6. Review
   - Document the incident timeline, root cause, impact, response effectiveness and any required control improvements.

## IR-02: Unauthorised guild activity

$\textcolor{orange}{\text{Medium severity}}$

1. Detect and triage
   - Identify unexpected guild joins, operation in a non-allowlisted guild, unusual command use, or reports of unsolicited messages.
   - Record the guild ID, bot user ID, timestamps in UTC, triggering event, affected channels, and observed actions.
   - Escalate to high severity if the activity suggests token, developer account, or hosting compromise.
2. Contain
   - Confirm the guild allowlist is correct and make the bot leave the unauthorised guild.
   - Stop the deployment if it does not enforce the allowlist or continues operating after removal.
   - Restrict bot channel permissions in affected authorised guilds if misuse is ongoing.
3. Preserve evidence
   - Export application and incident-reporting logs, Discord audit logs, guild metadata, command activity, and relevant configuration.
   - Preserve the deployed version and allowlist as they existed when the incident occurred.
   - Do not retain unnecessary message content or personal data.
4. Investigate and eradicate
   - Determine whether the join resulted from a public invite URL, configuration error, disabled enforcement, malicious deployment change, or compromised credential.
   - Correct the allowlist or enforcement defect and review application installation settings.
   - Rotate the token only if there is evidence that it or an authorised account was compromised.
5. Recover
   - Redeploy the corrected version and verify that unauthorised guilds are rejected or exited.
   - Confirm expected guild membership, permissions, slash-command availability, and monitoring behaviour.
   - Monitor guild joins and allowlist violations closely after restoration.
6. Review
   - Document how the installation occurred, what the bot did, affected guilds, and whether any data was stored.
   - Improve guild-join alerting, allowlist tests, invite controls, and ownership of allowlist changes.

## IR-03: Hosting compromise

$\textcolor{red}{\text{High severity}}$

1. Detect and triage
   - Identify suspicious logins, processes, deployments, file changes, outbound connections, database access, or unexplained bot behaviour.
   - Record timestamps in UTC, affected hosts and accounts, active indicators, and the last known-good deployment.
   - Assume credentials present on the host, including the Discord token, may be exposed.
2. Contain
   - Isolate or stop the affected deployment and revoke suspicious hosting sessions and access keys.
   - Reset the Discord token from a trusted device.
   - Do not place replacement credentials into the compromised environment.
3. Preserve evidence
   - Capture hosting audit logs, process and network information, deployment history, filesystem metadata, application logs, and relevant disk or platform snapshots.
   - Preserve the deployed source, environment configuration, dependency tree, and SQLite files.
   - Record hashes where appropriate without delaying urgent isolation.
4. Investigate and eradicate
   - Determine the initial access route, persistence mechanism, attacker actions, accessed secrets, modified files, and possible lateral movement.
   - Remove compromised accounts, keys, services, startup tasks, packages, and deployment hooks.
   - Prefer rebuilding from a trusted image over attempting to clean an untrusted host in place.
5. Recover
   - Deploy trusted source and verified dependencies into a clean environment with newly issued credentials.
   - Restore verified SQLite data, apply least-privilege access, and validate guild membership, permissions, commands, and reminders.
   - Increase monitoring for repeated access or bot misuse.
6. Review
- Document the attack path, dwell time, affected assets, credential exposure, and response effectiveness.
- Improve access controls, MFA, secret storage, patching, host monitoring, deployment separation, and recovery procedures.

## IR-04: Supply-chain compromise

$\textcolor{red}{\text{High severity}}$

1. Detect and triage
   - Identify dependency alerts, unexpected lockfile changes, malicious package reports, altered build artifacts, or unexplained install-time or runtime behaviour.
   - Record affected package names, versions, hashes, deployment versions, installation times, and observed indicators.
   - Determine whether the suspect dependency executed in development, CI, or production.
2. Contain
   - Stop affected builds and deployments and prevent installation of the suspect package or version.
   - Isolate affected runners or hosts if malicious code may have executed.
   - Revoke the bot token and other accessible credentials if the package could read the environment or filesystem.
3. Preserve evidence
   - Preserve the manifest, lockfile, package-manager logs, dependency tree, cached package, build artifacts, CI logs, and deployed image.
   - Record registry metadata and cryptographic hashes where available.
   - Avoid reinstalling dependencies on evidence-bearing systems before collection.
4. Investigate and eradicate
   - Determine when the dependency entered the project, which scripts or code executed, and what files, secrets, or networks it could access.
   - Remove or pin the affected dependency and review transitive dependencies and maintainer changes.
   - Rebuild from trusted source using a verified lockfile and clean package cache or build environment.
5. Recover
   - Deploy a clean, reproducible build with replacement credentials where exposure was possible.
   - Verify application files, dependency versions, SQLite integrity, guild membership, permissions, and command behaviour.
   - Monitor for known indicators and unexpected outbound traffic.
6. Review
   - Document affected versions, exposure window, package provenance, impact, and notification requirements.
   - Improve dependency review, lockfile controls, automated scanning, update policy, build isolation, and artifact verification.

## IR-05: Data integrity or availability

$\textcolor{orange}{\text{Medium severity}}$

*Escalate to high severity for widespread loss, deliberate manipulation, prolonged outage, or evidence of broader compromise.*

1. Detect and triage
   - Identify missing or incorrect preferences, SQLite errors, failed writes, unavailable commands, repeated crashes, or unexpected reminder behaviour.
   - Record timestamps in UTC, affected guilds and users, error messages, recent deployments, and the last known-good state.
   - Determine whether the cause appears accidental, operational, or malicious.
2. Contain
   - Stop writes or take the bot offline if continued operation could worsen corruption or send incorrect reminders.
   - Preserve the affected database and prevent automated jobs or deployments from overwriting backups.
   - Disable monitoring responses temporarily if preference accuracy cannot be trusted.
3. Preserve evidence
   - Copy the SQLite database and associated journal or WAL files before repair attempts.
   - Export application, hosting, storage, and deployment logs and record hashes of preserved files.
   - Retain recent backups, schema versions, and the deployed application version.
4. Investigate and eradicate
   - Check SQLite integrity and determine whether the cause was corruption, disk exhaustion, concurrent access, faulty migration, software defect, unauthorised modification, or infrastructure failure.
   - Correct the underlying defect before restoring service.
   - Treat unexplained malicious changes as a possible hosting or credential compromise.
5. Recover
   - Restore from a verified backup or repair a working copy, then validate schema and preference records.
   - Redeploy the corrected application and test commands, opt-in state, visibility settings, cooldowns, and reminder creation and deletion.
   - Reconcile changes made after the selected recovery point where reliable records exist.
6. Review
   - Document lost or altered data, downtime, affected users, recovery point, and recovery time.
   - Improve backups, restore testing, integrity checks, disk monitoring, migration controls, failure handling, and user communication.
