# 09 — Testing Strategy

## Test Types

### Unit Tests

Use for:

- Rubric scoring utilities
- Progress calculations
- Grade-level logic
- AI safety policy helpers
- Canvas serialization
- Date/streak logic
- Daily assignment selection
- Notification preference parsing and provider-free payload preparation

### Component Tests

Use for:

- Assignment cards
- Rubric checklist
- Feedback cards
- Canvas toolbar
- Goal selection cards
- Progress cards

### Integration Tests

Use for:

- Onboarding flow
- Assignment submission flow
- Canvas attachment flow
- AI feedback flow
- Parent review flow

### E2E Tests

Use for:

- Student completes first assignment
- Student starts with canvas and submits
- Parent views report
- Teacher creates assignment
- Free user hits upgrade prompt

## Required E2E Scenarios

### Flow 1: Student First Assignment

```txt
Welcome
-> Role Selection
-> Grade Selection
-> Goals
-> Daily Goal
-> Plan Summary
-> Home
-> Assignment Detail
-> Writing Workspace
-> AI Review
-> Revision
-> Completion
-> Progress
```

### Flow 2: Canvas Assignment

```txt
Home
-> Assignment Detail
-> Start with Canvas
-> Canvas Template Picker
-> Handwriting Canvas
-> Attach to Assignment
-> Writing Workspace
-> Submit
-> Feedback
```

## Feature Test Rule

Every feature should include:

```txt
__tests__/
  featureName.unit.test.ts
  featureName.integration.test.ts
```

## Mocking Strategy

Mock:

- Auth session
- API client
- AI review responses
- Canvas file upload
- Subscription entitlement

Do not mock:

- Navigation route existence
- Critical form validation
- Progress calculation
- Academic integrity rule checks
