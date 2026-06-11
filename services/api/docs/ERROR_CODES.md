# WriterHabit API Error Codes

Status: backend error catalog. The Fastify runtime in `services/api/` now emits
this standard envelope for health-adjacent errors, auth failures, validation
failures, missing routes, and disabled route shells.

All API errors use the standard response shape from
`services/api/docs/API_CONTRACT.md`.

```ts
interface ApiErrorResponse {
  error: {
    code: string;
    messageKey: string;
    fallbackMessage: string;
    details?: Record<string, unknown>;
    requestId: string;
    retryable: boolean;
  };
}
```

## HTTP Mapping

| HTTP status | Category | Meaning |
| --- | --- | --- |
| 400 | `validation.*` | Request shape or field values are invalid. |
| 401 | `auth.*` | The user is not authenticated or the token is invalid. |
| 403 | `authorization.*` | The user is authenticated but not allowed to access the resource. |
| 404 | `resource.*` | The requested resource is missing or hidden by authorization scope. |
| 409 | `conflict.*` | The request conflicts with current server state. |
| 410 | `resource.gone` | The resource is intentionally unavailable. |
| 422 | `ai_safety.*` or `validation.*` | The request is well formed but not acceptable. |
| 429 | `rate_limit.*` | The user or organization exceeded a limit. |
| 501 | `feature.disabled` | A route is registered but intentionally disabled until the workflow is production-ready. |
| 500 | `system.*` | Unexpected server failure. |
| 502 | `provider.*` | Upstream provider failed. |
| 503 | `system.unavailable` | Service is temporarily unavailable. |

## Authentication

| Code | HTTP | Retryable | User-facing fallback |
| --- | --- | --- | --- |
| `auth.missing_token` | 401 | false | Sign in to continue. |
| `auth.invalid_token` | 401 | false | Your session could not be verified. |
| `auth.expired_token` | 401 | true | Your session expired. Sign in again. |
| `auth.email_already_registered` | 409 | false | An account already exists for this email. |
| `auth.invalid_credentials` | 401 | false | Check your email and password. |
| `auth.session_revoked` | 401 | false | This session is no longer active. |

## Authorization

| Code | HTTP | Retryable | User-facing fallback |
| --- | --- | --- | --- |
| `authorization.role_denied` | 403 | false | Your account cannot perform this action. |
| `authorization.student_scope_denied` | 403 | false | You do not have access to this student profile. |
| `authorization.parent_link_required` | 403 | false | This student is not linked to your parent account. |
| `authorization.teacher_class_scope_denied` | 403 | false | This class or student is outside your teacher account. |
| `authorization.subscription_required` | 403 | false | This feature requires an active plan. |
| `authorization.admin_required` | 403 | false | Admin access is required. |

## Validation

| Code | HTTP | Retryable | User-facing fallback |
| --- | --- | --- | --- |
| `validation.invalid_json` | 400 | false | The request could not be read. |
| `validation.invalid_field` | 400 | false | Check the highlighted fields and try again. |
| `validation.missing_required_field` | 400 | false | Complete the required fields. |
| `validation.grade_level_out_of_range` | 400 | false | Choose a grade from 1 to 12. |
| `validation.too_many_items` | 400 | false | Remove a few items and try again. |
| `validation.text_too_long` | 400 | false | Shorten the text and try again. |
| `validation.empty_submission` | 422 | false | Add your own writing before submitting. |

## Resource State

| Code | HTTP | Retryable | User-facing fallback |
| --- | --- | --- | --- |
| `resource.not_found` | 404 | false | We could not find that item. |
| `resource.gone` | 410 | false | This item is no longer available. |
| `conflict.status_transition_invalid` | 409 | false | This assignment is not ready for that step. |
| `conflict.version_mismatch` | 409 | true | A newer version exists. Reload before saving. |
| `conflict.duplicate_idempotency_key` | 409 | false | This request was already processed differently. |

## AI Safety And AI Providers

| Code | HTTP | Retryable | User-facing fallback |
| --- | --- | --- | --- |
| `ai_safety.assignment_completion_request` | 422 | false | I can help you think through it, but I cannot do the assignment for you. |
| `ai_safety.full_rewrite_request` | 422 | false | I can suggest revisions, but your final draft needs to be yours. |
| `ai_safety.answer_request` | 422 | false | I can give a hint or ask a guiding question. |
| `ai_safety.age_inappropriate` | 422 | false | Try a school-appropriate request. |
| `ai.review_already_running` | 409 | true | Review is already in progress. |
| `ai.review_failed` | 500 | true | Review could not be completed right now. |
| `provider.ai_unavailable` | 503 | true | Coaching is temporarily unavailable. |

## Canvas And Storage

| Code | HTTP | Retryable | User-facing fallback |
| --- | --- | --- | --- |
| `storage.upload_url_failed` | 503 | true | Upload setup failed. Try again. |
| `storage.object_not_found` | 404 | false | The file could not be found. |
| `canvas.stroke_limit_exceeded` | 400 | false | This canvas has too much drawing data. |
| `canvas.recognition_failed` | 503 | true | Handwriting recognition could not finish right now. |
| `canvas.export_failed` | 503 | true | Export could not finish right now. |

## Subscriptions And Webhooks

| Code | HTTP | Retryable | User-facing fallback |
| --- | --- | --- | --- |
| `subscription.plan_not_found` | 404 | false | That plan is not available. |
| `subscription.checkout_failed` | 502 | true | Checkout could not start. Try again. |
| `subscription.restore_not_found` | 404 | false | We could not find an active purchase to restore. |
| `webhook.invalid_signature` | 401 | false | Webhook signature could not be verified. |
| `webhook.duplicate_event` | 200 | false | Event was already processed. |

## Rate Limits And Availability

| Code | HTTP | Retryable | User-facing fallback |
| --- | --- | --- | --- |
| `feature.disabled` | 501 | false | This feature is not available yet. |
| `rate_limit.ai_daily_limit` | 429 | false | You have reached today's coaching limit. |
| `rate_limit.too_many_requests` | 429 | true | Slow down and try again soon. |
| `system.unavailable` | 503 | true | WriterHabit is temporarily unavailable. |
| `system.unexpected` | 500 | true | Something went wrong. Try again. |

## Error Response Example

```json
{
  "error": {
    "code": "ai_safety.full_rewrite_request",
    "messageKey": "errors.aiSafety.fullRewriteRequest",
    "fallbackMessage": "I can suggest revisions, but your final draft needs to be yours.",
    "details": {
      "allowedActions": ["hint", "brainstorm", "revision_question"]
    },
    "requestId": "req_01HYWZ4G9M0W4J8V1QW9W2EJ6A",
    "retryable": false
  }
}
```
