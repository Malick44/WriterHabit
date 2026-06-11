#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROMPT_DIR="$ROOT_DIR/prompts/release_blocker_agents"
REVIEW_DIR="$ROOT_DIR/docs/reviews/release-blockers"
TASK="all"
FROM=""
TO=""
MODE="run"
COMMIT="1"
RUN_CHECKS="1"
MAX_REVIEW_ROUNDS="3"
CODEX_EXEC_ARGS=(
  --skip-git-repo-check
  --dangerously-bypass-approvals-and-sandbox
  -C "$ROOT_DIR"
)

show_usage() {
  cat <<'USAGE'
usage: ./script/release_blocker_agent_runner.sh [options]

Runs release-blocker implementation prompts with an implementation -> review loop.
Nested Codex runs use full filesystem access and bypass approval prompts.

Options:
  --task N|all           Run one release-blocker task, or all tasks. Default: all.
  --from N               First task number to run when running a range.
  --to N                 Last task number to run when running a range.
  --max-review-rounds N  Maximum implementation/review rounds per task. Default: 3.
  --dry-run              Print the planned task sequence without running Codex.
  --no-commit            Do not create per-task Git commits after review approval.
  --skip-checks          Skip standard mobile release checks between rounds.
  --help                 Show this help.

Examples:
  ./script/release_blocker_agent_runner.sh --dry-run
  ./script/release_blocker_agent_runner.sh --task 01
  ./script/release_blocker_agent_runner.sh --from 01 --to 04
  ./script/release_blocker_agent_runner.sh --task all --max-review-rounds 5
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --task)
      TASK="${2:-}"
      shift 2
      ;;
    --from)
      FROM="${2:-}"
      shift 2
      ;;
    --to)
      TO="${2:-}"
      shift 2
      ;;
    --max-review-rounds)
      MAX_REVIEW_ROUNDS="${2:-}"
      shift 2
      ;;
    --dry-run)
      MODE="dry-run"
      shift
      ;;
    --no-commit)
      COMMIT="0"
      shift
      ;;
    --skip-checks)
      RUN_CHECKS="0"
      shift
      ;;
    --help|-h|help)
      show_usage
      exit 0
      ;;
    *)
      show_usage >&2
      exit 2
      ;;
  esac
done

normalize_task_number() {
  local value="$1"

  if ! [[ "$value" =~ ^0*[0-9]+$ ]]; then
    echo "Task number must be numeric: ${value}" >&2
    exit 2
  fi

  printf "%02d" "$((10#$value))"
}

all_task_numbers() {
  find "$PROMPT_DIR" -maxdepth 1 -type f -name '[0-9][0-9]-*.md' -exec basename {} \; \
    | sort \
    | sed -E 's/^([0-9][0-9]).*/\1/'
}

task_path() {
  local number="$1"
  local path

  path="$(find "$PROMPT_DIR" -maxdepth 1 -type f -name "${number}-*.md" | sort | head -n 1)"
  if [[ -z "$path" ]]; then
    echo "No release-blocker prompt found for task ${number}." >&2
    exit 2
  fi

  echo "$path"
}

task_slug() {
  basename "$(task_path "$1")" .md
}

task_title() {
  local path="$1"
  awk '/^# Agent Prompt: / { sub(/^# Agent Prompt: /, ""); print; exit }' "$path"
}

review_focus() {
  case "$1" in
    01) echo "backend runtime, API contract, auth boundary, deployment readiness" ;;
    02) echo "auth, server-derived roles, authorization, escalation prevention" ;;
    03) echo "Supabase migrations, RLS, role tests, privilege escalation" ;;
    04) echo "workflow state machines, durable submission truth, RLS write boundaries" ;;
    05) echo "payments, entitlements, receipt/webhook validation, release impact" ;;
    06) echo "parent/teacher data, backend authorization, persistence" ;;
    07) echo "audit logging, retention, export/delete privacy operations" ;;
    08) echo "mobile E2E automation, release flows, CI reliability" ;;
    09) echo "AI provider integration, safety, moderation, usage limits, audit" ;;
    10) echo "canvas storage, export, signed URLs, memory and authorization" ;;
    11) echo "notifications, EAS project id, APNs/FCM, delivery status truth" ;;
    12) echo "profile/onboarding hydration, server-backed role records, offline sync" ;;
    13) echo "accessibility QA, screen-reader behavior, large text, grade bands" ;;
    14) echo "release operations, EAS, stores, observability, rollback" ;;
    15) echo "web release-surface decision, docs/scripts consistency" ;;
    16) echo "teacher content moderation, publication workflow, audit" ;;
    17) echo "catalog seed data, fixtures, idempotent migrations" ;;
    *) echo "production readiness and release blockers" ;;
  esac
}

selected_tasks() {
  if [[ -n "$FROM" || -n "$TO" ]]; then
    local from to
    from="$(normalize_task_number "${FROM:-1}")"
    to="$(normalize_task_number "${TO:-17}")"

    if (( 10#$from > 10#$to )); then
      echo "Invalid task range: ${from}-${to}." >&2
      exit 2
    fi

    for number in $(seq -f "%02g" "$((10#$from))" "$((10#$to))"); do
      task_path "$number" >/dev/null
      echo "$number"
    done
    return
  fi

  if [[ "$TASK" == "all" ]]; then
    all_task_numbers
    return
  fi

  normalize_task_number "$TASK"
}

assert_clean_worktree() {
  if [[ -n "$(git -C "$ROOT_DIR" status --porcelain)" ]]; then
    echo "Working tree is not clean. Commit or stash changes before automated release-blocker runs." >&2
    git -C "$ROOT_DIR" status --short >&2
    exit 1
  fi
}

run_checks() {
  if [[ "$RUN_CHECKS" == "0" ]]; then
    return
  fi

  "$ROOT_DIR/script/build_and_run.sh" --typecheck
  (cd "$ROOT_DIR/apps/mobile" && npm run lint -- --max-warnings=0)
  "$ROOT_DIR/script/build_and_run.sh" --test
  "$ROOT_DIR/script/build_and_run.sh" --doctor
}

blocked_staged_path() {
  local file="$1"

  case "$file" in
    .env|.env.*|*/.env|*/.env.*)
      case "$file" in
        *.example) return 1 ;;
        *) return 0 ;;
      esac
      ;;
    node_modules/*|*/node_modules/*|apps/mobile/.expo|apps/mobile/.expo/*)
      return 0
      ;;
    apps/mobile/ios|apps/mobile/ios/*|apps/mobile/android|apps/mobile/android/*)
      return 0
      ;;
    *.keystore|*.jks|*.p8|*.mobileprovision|*google-service-account*.json)
      return 0
      ;;
  esac

  return 1
}

commit_changes() {
  local number="$1"
  local title="$2"

  if [[ "$COMMIT" == "0" ]]; then
    return
  fi

  git -C "$ROOT_DIR" add -A

  local blocked="0"
  while IFS= read -r file; do
    if blocked_staged_path "$file"; then
      echo "Blocked staged path: $file" >&2
      blocked="1"
    fi
  done < <(git -C "$ROOT_DIR" diff --cached --name-only)

  if [[ "$blocked" == "1" ]]; then
    echo "Refusing to commit blocked local/generated/secret paths." >&2
    exit 1
  fi

  if git -C "$ROOT_DIR" diff --cached --quiet; then
    echo "No changes to commit for release-blocker task ${number}."
    return
  fi

  git -C "$ROOT_DIR" commit -m "feat: close release blocker ${number} ${title}"
}

build_implementation_prompt() {
  local number="$1"
  local prompt_path="$2"
  local title="$3"
  local round="$4"
  local previous_report="$5"

  cat <<PROMPT
You are the implementation agent for WriterHabit release-blocker task ${number}: ${title}.

Working directory:
${ROOT_DIR}

This is implementation/review round ${round} of ${MAX_REVIEW_ROUNDS}.

Required startup:
1. Read AGENTS.md.
2. Read docs/00_CONTEXT_BRIEF.md.
3. Read prompts/01_master_agent_rules.md.
4. Read .codex/EXECUTION_STATE.md.
5. Read the task prompt: ${prompt_path#"$ROOT_DIR"/}

If this is not the first round, also read the review report and address every actionable finding before finishing:
${previous_report:-none}

Implementation rules:
- Do not stop at planning; implement the task as far as the repository and available credentials allow.
- Preserve feature-based architecture and thin Expo Router route files.
- Keep docs aligned with the real code state.
- Do not commit, push, or create PRs. The runner handles commits only after review approval.
- Do not introduce secrets, service-role keys, native generated folders, .expo output, or local env files.
- If an external owner action blocks full completion, fail closed in code and document the exact owner action.
- Run the task prompt's validation commands where feasible.

Final response requirements:
- Summary of changes.
- Files modified.
- Tests/checks run.
- Known limitations or blocked owner actions.
- Explicitly say whether this task is ready for review.
PROMPT
}

build_review_prompt() {
  local number="$1"
  local prompt_path="$2"
  local title="$3"
  local round="$4"
  local report_path="$5"

  cat <<PROMPT
You are the review agent for WriterHabit release-blocker task ${number}: ${title}.

Working directory:
${ROOT_DIR}

Review focus:
$(review_focus "$number")

Required startup:
1. Read AGENTS.md.
2. Read docs/00_CONTEXT_BRIEF.md.
3. Read prompts/01_master_agent_rules.md.
4. Read .codex/EXECUTION_STATE.md.
5. Read the task prompt: ${prompt_path#"$ROOT_DIR"/}

Review rules:
- Take a code-review stance: findings first, ordered by severity, with concrete file/line references when possible.
- Inspect the current diff from HEAD and any source/docs/tests touched by this task.
- Run focused validation commands if needed to verify claims.
- Do not edit implementation files. You may create or update only this review report:
  ${report_path#"$ROOT_DIR"/}
- Do not print or copy secrets from local env files.

Approval criteria:
- Use REVIEW_STATUS: approved only when there are no unresolved P0/P1 issues in this task's scope, validation is adequate, docs are honest, and any remaining external blockers are explicitly documented and cannot be solved in code.
- Use REVIEW_STATUS: changes_requested when the implementation can continue locally and specific fixes are needed.
- Use REVIEW_STATUS: blocked when progress requires user/owner credentials, product decisions, or external infrastructure before more code work is meaningful.

Report format:
1. Executive summary
2. Findings by severity
3. Validation reviewed or run
4. Documentation/release-checklist accuracy
5. Required implementation follow-up, if any
6. Final decision

The final line of the report must be exactly one of:
REVIEW_STATUS: approved
REVIEW_STATUS: changes_requested
REVIEW_STATUS: blocked
PROMPT
}

parse_review_status() {
  local report_path="$1"
  local status

  if [[ ! -f "$report_path" ]]; then
    echo "Review report was not created: ${report_path#"$ROOT_DIR"/}" >&2
    exit 1
  fi

  status="$(awk '/^REVIEW_STATUS: / { value=$2 } END { print value }' "$report_path")"
  case "$status" in
    approved|changes_requested|blocked)
      echo "$status"
      ;;
    *)
      echo "Review report missing valid REVIEW_STATUS: ${report_path#"$ROOT_DIR"/}" >&2
      exit 1
      ;;
  esac
}

run_task() {
  local number="$1"
  local path title slug previous_report

  path="$(task_path "$number")"
  title="$(task_title "$path")"
  slug="$(task_slug "$number")"
  previous_report=""

  for round in $(seq 1 "$MAX_REVIEW_ROUNDS"); do
    echo "Running release-blocker task ${number} (${title}), round ${round}/${MAX_REVIEW_ROUNDS}."
    build_implementation_prompt "$number" "$path" "$title" "$round" "$previous_report" \
      | codex exec "${CODEX_EXEC_ARGS[@]}" -

    run_checks

    mkdir -p "$REVIEW_DIR"
    local report_path
    report_path="$REVIEW_DIR/${slug}-round-${round}.md"

    echo "Running review agent for task ${number}, round ${round}."
    build_review_prompt "$number" "$path" "$title" "$round" "$report_path" \
      | codex exec "${CODEX_EXEC_ARGS[@]}" -

    local status
    status="$(parse_review_status "$report_path")"
    echo "Review status for task ${number}, round ${round}: ${status}"

    case "$status" in
      approved)
        run_checks
        commit_changes "$number" "$title"
        return
        ;;
      blocked)
        echo "Task ${number} is blocked. See ${report_path#"$ROOT_DIR"/}." >&2
        exit 1
        ;;
      changes_requested)
        previous_report="$report_path"
        ;;
    esac
  done

  echo "Task ${number} did not reach review approval after ${MAX_REVIEW_ROUNDS} rounds." >&2
  exit 1
}

main() {
  cd "$ROOT_DIR"

  if ! [[ "$MAX_REVIEW_ROUNDS" =~ ^[0-9]+$ ]] || (( MAX_REVIEW_ROUNDS < 1 )); then
    echo "--max-review-rounds must be a positive integer." >&2
    exit 2
  fi

  if ! git -C "$ROOT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "Git repository is required for release-blocker automation." >&2
    exit 1
  fi

  local tasks
  tasks="$(selected_tasks)"

  echo "Planned release-blocker tasks:"
  while IFS= read -r number; do
    [[ -n "$number" ]] || continue
    local path
    path="$(task_path "$number")"
    echo "- ${number}: ${path#"$ROOT_DIR"/}"
  done <<< "$tasks"

  if [[ "$MODE" == "dry-run" ]]; then
    exit 0
  fi

  assert_clean_worktree

  while IFS= read -r number; do
    [[ -n "$number" ]] || continue
    run_task "$number"
  done <<< "$tasks"
}

main
