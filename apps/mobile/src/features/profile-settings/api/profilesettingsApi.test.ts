const mockApiPost = jest.fn();
const mockGetApiAccessToken = jest.fn<Promise<string | null>, []>();

jest.mock("@/core/api/apiClient", () => ({
  apiClient: {
    post: (...args: unknown[]) => mockApiPost(...args),
  },
}));

jest.mock("@/core/api/apiTokenProvider", () => ({
  getApiAccessToken: () => mockGetApiAccessToken(),
}));

import {
  profilesettingsApi,
  registerNotificationDeviceResultSchema,
  unregisterNotificationDeviceResultSchema,
} from "./profilesettingsApi";

describe("profilesettingsApi", () => {
  beforeEach(() => {
    mockApiPost.mockReset();
    mockGetApiAccessToken.mockReset();
  });

  it("registers notification devices through a schema-backed API call", async () => {
    mockGetApiAccessToken.mockResolvedValue("access-token");
    mockApiPost.mockResolvedValue({ deviceId: "device-1", status: "registered" });

    await expect(
      profilesettingsApi.registerNotificationDevice({
        expoPushToken: "ExpoPushToken[test]",
        idempotencyKey: "register-1",
        platform: "ios",
        studentId: "student-1",
      }),
    ).resolves.toEqual({ deviceId: "device-1", status: "registered" });

    expect(mockApiPost).toHaveBeenCalledWith(
      "/students/student-1/notifications/register-device",
      {
        expoPushToken: "ExpoPushToken[test]",
        idempotencyKey: "register-1",
        platform: "ios",
      },
      { schema: registerNotificationDeviceResultSchema },
    );
  });

  it("unregisters notification devices through a schema-backed API call", async () => {
    mockGetApiAccessToken.mockResolvedValue("access-token");
    mockApiPost.mockResolvedValue({ status: "unregistered" });

    await expect(
      profilesettingsApi.unregisterNotificationDevice({
        expoPushToken: "ExpoPushToken[test]",
        studentId: "student-1",
      }),
    ).resolves.toEqual({ status: "unregistered" });

    expect(mockApiPost).toHaveBeenCalledWith(
      "/students/student-1/notifications/unregister-device",
      {
        expoPushToken: "ExpoPushToken[test]",
      },
      { schema: unregisterNotificationDeviceResultSchema },
    );
  });

  it("skips remote notification registration when no Supabase session exists", async () => {
    mockGetApiAccessToken.mockResolvedValue(null);

    await expect(
      profilesettingsApi.registerNotificationDevice({
        expoPushToken: "ExpoPushToken[test]",
        studentId: "student-1",
      }),
    ).resolves.toEqual({ status: "skipped" });
    expect(mockApiPost).not.toHaveBeenCalled();
  });
});
