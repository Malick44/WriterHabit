# 11 — Feature Module Template

Use this template for every feature.

```txt
features/example-feature/
  screens/
    ExampleMainScreen.tsx
  components/
    ExampleCard.tsx
  hooks/
    useExampleFeature.ts
  api/
    exampleApi.ts
  services/
    exampleService.ts
  stores/
    exampleStore.ts
  types.ts
  constants.ts
  index.ts
  __tests__/
    exampleFeature.unit.test.ts
    exampleFeature.integration.test.ts
```

## Screen File Pattern

```tsx
import { Screen } from "@/shared/components/layout/Screen";

export function ExampleMainScreen() {
  return (
    <Screen title="Example">
      {/* Feature UI */}
    </Screen>
  );
}
```

## API File Pattern

```ts
import { apiClient } from "@/core/api/apiClient";

export const exampleApi = {
  getExample: async (id: string) => {
    return apiClient.get(`/examples/${id}`);
  },
};
```

## Hook File Pattern

```ts
import { useQuery } from "@tanstack/react-query";
import { exampleApi } from "../api/exampleApi";

export function useExample(id: string) {
  return useQuery({
    queryKey: ["example", id],
    queryFn: () => exampleApi.getExample(id),
  });
}
```

## Index File Pattern

```ts
export * from "./screens/ExampleMainScreen";
export * from "./types";
```
