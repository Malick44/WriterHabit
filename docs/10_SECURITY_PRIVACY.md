# 10 — Security, Privacy, and Compliance

## Product Risk

This app serves children and students. Privacy and safety must be treated as core product requirements.

## Data Minimization

Collect only what is required:

- Name or display name
- Grade level
- Writing goals
- Writing submissions
- Progress data
- Parent/teacher links

Avoid collecting:

- Precise location
- Sensitive personal attributes
- Unnecessary school records
- Public social profiles

## Role-Based Access

Roles:

```ts
type UserRole = "student" | "parent" | "teacher" | "admin";
```

Access rules:

- Student can access their own work.
- Parent can access linked student reports.
- Teacher can access students in their classes.
- Admin can manage platform operations.

## AI Safety

- Do not train on student data unless explicit consent exists.
- Do not expose student writing publicly.
- Moderate AI input and output.
- Log only safe metadata.
- Redact sensitive content where possible.

## Academic Integrity

The AI coach must not produce complete final assignments for direct submission.

The system should block or redirect requests like:

- “Write my essay for me.”
- “Give me the answer.”
- “Finish this assignment.”

## Parent Controls

Parents should be able to:

- View linked student progress
- Adjust practice goal
- Control AI coach access
- Manage notifications
- Request data deletion

## Data Retention

Recommended:

- Keep active student work while account is active.
- Allow export and deletion.
- Delete inactive drafts after a defined retention period.
- Keep audit logs without storing full student text where possible.

## Security Requirements

- Use encrypted transport.
- Hash passwords or rely on managed auth.
- Use server-side authorization checks.
- Validate every request.
- Rate-limit AI endpoints.
- Store files securely with signed URLs.
- Keep audit logs for parent/teacher access.
