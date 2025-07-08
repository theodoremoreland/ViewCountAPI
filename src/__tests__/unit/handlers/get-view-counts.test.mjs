// Third party
import { expect, jest } from "@jest/globals";

// Mock pg Client
jest.unstable_mockModule("pg", () => {
  const mClient = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  };
  return {
    Client: jest.fn(() => mClient),
  };
});

// Mock getDbCredentials
jest.unstable_mockModule("../../../utils/getDBCredentials.mjs", () => ({
  default: jest.fn().mockResolvedValue({
    host: "localhost",
    username: "test_user",
    password: "test_pass",
    port: 5432,
  }),
}));

describe("getViewCountsHandler", () => {
  let handler;
  let client;

  beforeEach(async () => {
    await jest.isolateModulesAsync(async () => {
      const { Client } = await import("pg");
      client = new Client();

      const mod = await import("../../../handlers/get-view-counts.mjs");
      handler = mod.getViewCountsHandler;
    });

    jest.clearAllMocks();
  });

  it("should return all view count entries", async () => {
    const last_updated = new Date();
    const mockRows = [
      {
        project_id: "0",
        github_views: 10,
        demo_views: 5,
        last_updated: last_updated,
      },
      {
        project_id: "1",
        github_views: 20,
        demo_views: 10,
        last_updated: last_updated,
      },
    ];
    const processedResults = {
      0: {
        github_views: 10,
        demo_views: 5,
        last_updated: last_updated.toISOString(),
      },
      1: {
        github_views: 20,
        demo_views: 10,
        last_updated: last_updated.toISOString(),
      },
    };
    client.query.mockResolvedValueOnce({ rows: mockRows });

    const event = {
      httpMethod: "GET",
      path: "/",
    };

    const result = await handler(event);

    expect(client.connect).toHaveBeenCalled();
    expect(client.query).toHaveBeenCalledWith("SELECT * FROM view_count");
    expect(client.end).toHaveBeenCalled();

    expect(result.body).toEqual(JSON.stringify(processedResults));
    expect(result.statusCode).toBe(200);
  });

  it("should return 500 on database error", async () => {
    client.query.mockRejectedValueOnce(new Error("DB failure"));

    const event = {
      httpMethod: "GET",
      path: "/",
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).error).toBe("Internal server error");
  });

  it("should receive 400 status code on non-GET method", async () => {
    const event = {
      httpMethod: "POST",
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
  });
});
