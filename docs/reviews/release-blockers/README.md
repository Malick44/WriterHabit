# Release Blocker Review Reports

`script/release_blocker_agent_runner.sh` writes implementation review reports here.

Each report must end with one machine-readable status line:

```txt
REVIEW_STATUS: approved
REVIEW_STATUS: changes_requested
REVIEW_STATUS: blocked
```

The runner uses that line to decide whether to commit the task, send the task back to implementation, or stop as blocked.
