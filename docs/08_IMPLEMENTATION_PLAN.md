# 08 — Implementation Plan

## Phase 1 — Foundation

Goal: Build the app shell and project foundation.

Deliverables:

- Expo project setup
- TypeScript config
- Path aliases
- Feature folder structure
- Theme system
- Shared UI components
- Auth shell
- Role-based routing
- Mock data layer

Feature folders:

- auth
- onboarding
- shared
- core

Definition of done:

- App launches
- User can navigate through welcome and onboarding screens using mock state
- Theme and shared components are in place

## Phase 2 — Student Onboarding

Deliverables:

- Role selection
- Grade selection
- Writing goals
- Confidence screen
- Daily goal screen
- Personalized plan summary
- Onboarding persistence

Definition of done:

- Student profile is created
- Grade and goals are stored
- Student is routed to dashboard

## Phase 3 — Student Dashboard and Assignment Flow

Deliverables:

- Student home dashboard
- Daily assignment card
- Assignment detail screen
- Assignment history
- Start assignment action

Definition of done:

- Student can see today’s assignment
- Student can open assignment detail
- Student can start writing

## Phase 4 — Writing Workspace

Deliverables:

- Typed writing editor implemented
- Local draft autosave and recovery states
- Word count
- Rubric checklist
- Attached canvas preview
- AI coach entry panel with approved CTAs only
- Submit route to review loading

Definition of done:

- Student can write and save draft
- Empty drafts cannot be submitted
- Student can submit for review loading
- Backend submission persistence remains future work

## Phase 5 — Canvas

Deliverables:

- Canvas template picker implemented
- Handwriting canvas adapter implemented
- Toolbar implemented
- Bounded undo/redo implemented
- Local canvas autosave implemented
- Attach canvas to assignment implemented
- Typed writing workspace preview integration implemented

Definition of done:

- Student can create a canvas
- Student can attach canvas to assignment
- Student can continue writing after attachment
- Backend file export/sync remains future work

## Phase 6 — AI Coach and Feedback

Deliverables:

- AI coach drawer implemented
- AI coach safety guardrails implemented
- AI coach context and prompt builders implemented
- Deterministic AI coach mock API implemented
- AI review loading screen implemented
- Feedback summary implemented
- Rubric score implemented
- Revision task implemented
- Grammar suggestions implemented
- Completion celebration implemented

Definition of done:

- Coach actions provide hints, questions, explanations, word-choice coaching, and revision guidance without replacing student thinking
- Submitted writing receives structured AI feedback
- Student receives one clear revision task
- Student sees placeholder progress after completion; persisted progress updates remain Phase 7 work

## Phase 7 — Progress Tracking

Deliverables:

- Progress dashboard
- Skill detail
- Badges
- Weekly review
- Streak logic

Definition of done:

- Completed assignments update skill progress
- Student can view growth over time

## Phase 8 — Parent Experience

Deliverables:

- Parent dashboard
- Student report
- Assignment review
- Parent settings

Definition of done:

- Parent can view child progress
- Parent can review assignments and feedback

## Phase 9 — Teacher Experience

Deliverables:

- Teacher dashboard
- Class progress
- Create assignment
- Review submission

Definition of done:

- Teacher can create assignments
- Teacher can review student submissions
- Teacher can view class-level progress

## Phase 10 — Monetization and Polish

Deliverables:

- Paywall
- Upgrade prompt
- Entitlement checks
- Notifications
- Accessibility settings
- Error states
- Empty states

Definition of done:

- Free and premium feature gates work
- App is ready for beta testing
