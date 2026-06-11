import { useEffect } from "react";
import { useRouter, type Href } from "expo-router";
import * as Notifications from "expo-notifications";

function isWriterHabitRoute(value: unknown): value is Href {
  return typeof value === "string" && value.startsWith("/");
}

function getTargetRoute(response: Notifications.NotificationResponse | null): Href | null {
  const data = response?.notification.request.content.data;

  if (!data || data.source !== "WriterHabit" || !isWriterHabitRoute(data.targetRoute)) {
    return null;
  }

  return data.targetRoute;
}

export function NotificationResponseHandler() {
  const router = useRouter();

  useEffect(() => {
    let routeFromLastResponse: Href | null = null;

    try {
      routeFromLastResponse = getTargetRoute(Notifications.getLastNotificationResponse());
    } catch {
      routeFromLastResponse = null;
    }

    if (routeFromLastResponse) {
      router.push(routeFromLastResponse);
      try {
        Notifications.clearLastNotificationResponse();
      } catch {
        // Native notification response clearing can be unavailable in web/test runtimes.
      }
    }

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const route = getTargetRoute(response);

      if (route) {
        router.push(route);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  return null;
}
