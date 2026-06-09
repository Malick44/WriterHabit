# 09 — Testing Strategy

The canonical testing strategy now lives in `docs/TESTING_STRATEGY.md`.

Current automated tests run through:

```bash
./script/build_and_run.sh --test
```

That command executes the Expo/Jest suite for feature-owned tests under `apps/mobile/src/`, root unit acceptance tests under `tests/unit/`, and root integration scaffolds under `tests/integration/`.
