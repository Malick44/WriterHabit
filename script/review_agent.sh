#!/usr/bin/env bash
set -euo pipefail

AGENT="${1:-}"
MODE="${2:-exec}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CODEX_EXEC_ARGS=(
  --skip-git-repo-check
  --dangerously-bypass-approvals-and-sandbox
  -C "$ROOT_DIR"
)

show_usage() {
  cat <<'USAGE'
usage: ./script/review_agent.sh <agent> [mode]

Agents:
  ai-safety         Run the AI safety and academic-integrity review agent
  assets            Run the asset generation agent
  backend           Run the backend architecture review agent
  design            Run the product design review agent
  frontend-polish   Run the React Native frontend polish review agent
  product           Run the product readiness review agent
  testing           Run the test automation review agent

Modes:
  exec              Run the selected agent with codex exec
  print             Print the prompt that would be sent to codex exec
USAGE
}

case "$AGENT" in
  ai-safety)
    REVIEW_NAME="AI Safety Review Agent"
    PROMPT_PATH="prompts/specialists/ai_safety_review_agent.md"
    OUTPUT_PATH="docs/reviews/AI_SAFETY_REVIEW.md"
    ;;
  assets)
    REVIEW_NAME="Asset Generation Agent"
    PROMPT_PATH="prompts/specialists/asset_generation_agent.md"
    OUTPUT_PATH="docs/assets/ASSET_GENERATION_PLAN.md and apps/mobile/assets/generated/"
    ;;
  backend)
    REVIEW_NAME="Backend Review Agent"
    PROMPT_PATH="prompts/specialists/backend_review_agent.md"
    OUTPUT_PATH="docs/reviews/BACKEND_REVIEW.md"
    ;;
  design)
    REVIEW_NAME="Design Review Agent"
    PROMPT_PATH="prompts/specialists/design_review_agent.md"
    OUTPUT_PATH="docs/reviews/DESIGN_REVIEW.md"
    ;;
  frontend-polish)
    REVIEW_NAME="Frontend Polish Agent"
    PROMPT_PATH="prompts/specialists/frontend_polish_agent.md"
    OUTPUT_PATH="docs/reviews/FRONTEND_POLISH_REVIEW.md"
    ;;
  product)
    REVIEW_NAME="Product Manager Review Agent"
    PROMPT_PATH="prompts/specialists/product_manager_review_agent.md"
    OUTPUT_PATH="docs/reviews/PRODUCT_REVIEW.md"
    ;;
  testing)
    REVIEW_NAME="Testing Agent"
    PROMPT_PATH="prompts/specialists/testing_agent.md"
    OUTPUT_PATH="docs/reviews/TESTING_REVIEW.md"
    ;;
  ""|--help|help|-h)
    show_usage
    exit 0
    ;;
  *)
    show_usage >&2
    exit 2
    ;;
esac

if [[ "$MODE" != "exec" && "$MODE" != "print" ]]; then
  show_usage >&2
  exit 2
fi

build_prompt() {
  cat <<PROMPT
You are running the WriteWise ${REVIEW_NAME}.

Working directory:
${ROOT_DIR}

Before doing any specialist work, read these required startup files in order:
1. AGENTS.md
2. docs/00_CONTEXT_BRIEF.md
3. prompts/01_master_agent_rules.md
4. .codex/EXECUTION_STATE.md

Then read and follow this specialist prompt:
${PROMPT_PATH}

Run the selected specialist workflow against the current repository state and create or update:
${OUTPUT_PATH}

Requirements:
- Preserve feature-based architecture.
- Do not print or copy secrets from .env files.
- Keep documentation aligned with real code paths.
- For review agents, prioritize findings by severity with concrete file-level recommendations.
- For asset generation, plan assets before creating image files and update the asset manifest.
- If you change files, run the relevant validation checks before finishing.
PROMPT
}

case "$MODE" in
  print)
    build_prompt
    ;;
  exec)
    build_prompt | codex exec "${CODEX_EXEC_ARGS[@]}" -
    ;;
esac
