#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FROM="auto"
TO="27"
MODE="run"
COMMIT="1"
RUN_CHECKS="1"
CODEX_EXEC_ARGS=(
  --skip-git-repo-check
  --dangerously-bypass-approvals-and-sandbox
  -C "$ROOT_DIR"
)

show_usage() {
  cat <<'USAGE'
usage: ./script/autonomous_prompt_runner.sh [options]

Runs implementation prompts in canonical order with codex exec.
Nested Codex runs use full filesystem access and bypass approval prompts.

Options:
  --from N|auto     First prompt number to run. Default: auto.
  --to N            Last prompt number to run. Default: 27.
  --dry-run         Print the planned prompt sequence without running Codex.
  --no-commit       Do not create per-prompt Git commits.
  --skip-checks     Skip typecheck/test/doctor after each prompt.
  --help            Show this help.

Examples:
  ./script/autonomous_prompt_runner.sh --dry-run
  ./script/autonomous_prompt_runner.sh --from 14 --to 16
  ./script/autonomous_prompt_runner.sh --from auto --to 27
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --from)
      FROM="${2:-}"
      shift 2
      ;;
    --to)
      TO="${2:-}"
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

prompt_path() {
  case "$1" in
    1) echo "prompts/01_master_agent_rules.md" ;;
    2) echo "prompts/02_repo_audit_and_implementation_plan.md" ;;
    3) echo "prompts/03_project_scaffold_expo_router.md" ;;
    4) echo "prompts/04_design_system_and_shared_ui.md" ;;
    5) echo "prompts/05_navigation_and_role_routing.md" ;;
    6) echo "prompts/06_localization_accessibility_foundation.md" ;;
    7) echo "prompts/07_auth_and_session_flow.md" ;;
    8) echo "prompts/08_student_onboarding_flow.md" ;;
    9) echo "prompts/09_student_home_dashboard.md" ;;
    10) echo "prompts/10_assignment_feature.md" ;;
    11) echo "prompts/11_typed_writing_workspace.md" ;;
    12) echo "prompts/12_canvas_feature.md" ;;
    13) echo "prompts/13_ai_coach_feature.md" ;;
    14) echo "prompts/14_ai_review_feedback_revision.md" ;;
    15) echo "prompts/15_progress_tracking_and_badges.md" ;;
    16) echo "prompts/16_notifications_and_daily_assignment_logic.md" ;;
    17) echo "prompts/17_parent_experience.md" ;;
    18) echo "prompts/18_teacher_experience.md" ;;
    19) echo "prompts/19_subscription_and_paywall.md" ;;
    20) echo "prompts/20_backend_api_contract.md" ;;
    21) echo "prompts/21_database_schema_and_migrations.md" ;;
    22) echo "prompts/22_ai_backend_services.md" ;;
    23) echo "prompts/23_canvas_storage_and_sync.md" ;;
    24) echo "prompts/24_testing_strategy_implementation.md" ;;
    25) echo "prompts/25_security_privacy_academic_integrity.md" ;;
    26) echo "prompts/26_performance_offline_and_error_states.md" ;;
    27) echo "prompts/27_final_qa_release_checklist.md" ;;
    *) return 1 ;;
  esac
}

prompt_title() {
  local path
  path="$(prompt_path "$1")"
  basename "$path" .md | sed -E 's/^[0-9]+_//; s/_/ /g'
}

latest_completed_prompt() {
  local latest
  latest="$(
    grep -Eo 'Prompt [0-9]{2}' "$ROOT_DIR/.codex/EXECUTION_STATE.md" 2>/dev/null \
      | awk '{ print $2 + 0 }' \
      | sort -n \
      | tail -1
  )"
  echo "${latest:-0}"
}

resolve_from() {
  if [[ "$FROM" == "auto" ]]; then
    local latest
    latest="$(latest_completed_prompt)"
    echo $((latest + 1))
  else
    echo "$FROM"
  fi
}

validate_range() {
  local from="$1"
  local to="$2"

  if ! [[ "$from" =~ ^[0-9]+$ && "$to" =~ ^[0-9]+$ ]]; then
    echo "Prompt range must be numeric or --from auto." >&2
    exit 2
  fi

  if (( from < 1 || to > 27 || from > to )); then
    echo "Invalid prompt range: ${from}-${to}. Valid range is 1-27." >&2
    exit 2
  fi
}

assert_clean_worktree() {
  if [[ -n "$(git -C "$ROOT_DIR" status --porcelain)" ]]; then
    echo "Working tree is not clean. Commit or stash changes before autonomous runs." >&2
    git -C "$ROOT_DIR" status --short >&2
    exit 1
  fi
}

build_prompt() {
  local number="$1"
  local path="$2"
  cat <<PROMPT
Run WriterHabit implementation Prompt ${number}.

Working directory:
${ROOT_DIR}

Read these required startup files first:
1. AGENTS.md
2. docs/00_CONTEXT_BRIEF.md
3. prompts/01_master_agent_rules.md
4. .codex/EXECUTION_STATE.md

Then implement:
${path}

Preserve the existing Expo Router and feature-based architecture. Keep route files thin. Keep docs aligned with real code paths. Do not introduce secrets or service-role Supabase keys into app code, docs, .codex files, screenshots, logs, or commits.

Run relevant local checks before finishing. Do not create a Git commit yourself; the autonomous runner will validate and commit after this prompt completes.
PROMPT
}

run_checks() {
  if [[ "$RUN_CHECKS" == "0" ]]; then
    return
  fi

  "$ROOT_DIR/script/build_and_run.sh" --typecheck
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
    *node_modules*|*.expo*|apps/mobile/ios*|apps/mobile/android*)
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
    echo "Refusing to commit blocked local/generated paths." >&2
    exit 1
  fi

  if git -C "$ROOT_DIR" diff --cached --quiet; then
    echo "No changes to commit for Prompt ${number}."
    return
  fi

  git -C "$ROOT_DIR" commit -m "feat: implement prompt ${number} ${title}"
}

main() {
  cd "$ROOT_DIR"

  if ! git -C "$ROOT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "Git repository is required for autonomous prompt runs." >&2
    exit 1
  fi

  local from
  from="$(resolve_from)"

  if ! [[ "$from" =~ ^[0-9]+$ && "$TO" =~ ^[0-9]+$ ]]; then
    echo "Prompt range must be numeric or --from auto." >&2
    exit 2
  fi

  if (( TO < 1 || TO > 27 )); then
    echo "Invalid prompt range: ${from}-${TO}. Valid range is 1-27." >&2
    exit 2
  fi

  if [[ "$FROM" == "auto" ]] && (( from > TO )); then
    echo "No autonomous prompts remain. Latest completed prompt is Prompt $((from - 1)); requested --to ${TO}."
    exit 0
  fi

  validate_range "$from" "$TO"

  echo "Planned autonomous prompt range: ${from}-${TO}"
  for number in $(seq "$from" "$TO"); do
    local path
    path="$(prompt_path "$number")"
    echo "- Prompt ${number}: ${path}"
  done

  if [[ "$MODE" == "dry-run" ]]; then
    exit 0
  fi

  assert_clean_worktree

  for number in $(seq "$from" "$TO"); do
    local path title
    path="$(prompt_path "$number")"
    title="$(prompt_title "$number")"

    echo "Running Prompt ${number}: ${path}"
    build_prompt "$number" "$path" | codex exec "${CODEX_EXEC_ARGS[@]}" -

    run_checks
    commit_changes "$number" "$title"
  done
}

main
