// Third party
import { jest } from "@jest/globals";

// Mocks
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

jest.unstable_mockModule("../../../utils/getDBCredentials.mjs", () => ({
  default: jest.fn().mockResolvedValue({
    host: "localhost",
    username: "test_user",
    password: "test_pass",
    port: 5432,
  }),
}));

describe("incrementViewCountHandler", () => {
  let handler;
  let client;

  beforeEach(async () => {
    await jest.isolateModulesAsync(async () => {
      const { Client } = await import("pg");
      client = new Client();

      const mod = await import(
        "../../../handlers/increment-view-count.mjs"
      );
      handler = mod.incrementViewCountHandler;

      jest.clearAllMocks();
    });
  });

  it("should increment GitHub view count and return updated item", async () => {
    const mockRow = { projectId: "123", githubViews: 5 };

    client.query.mockResolvedValueOnce({ rowCount: 1, rows: [mockRow] });

    const event = {
      httpMethod: "PATCH",
      body: JSON.stringify({
        projectId: "123",
        isGitHubView: true,
      }),
      path: "/",
    };

    const result = await handler(event);

    expect(client.connect).toHaveBeenCalled();
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE"),
      ["123"]
    );
    expect(client.end).toHaveBeenCalled();
    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify(mockRow));
  });

  it("should return 400 if required fields are missing", async () => {
    const event = {
      httpMethod: "PATCH",
      body: JSON.stringify({
        projectId: "",
        isGitHubView: false,
        isDemoView: false,
      }),
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toMatch(/Missing required fields/);
  });

  it("should return 404 if no rows are updated", async () => {
    client.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const event = {
      httpMethod: "PATCH",
      body: JSON.stringify({
        projectId: 123,
        isDemoView: true,
      }),
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(404);
  });

  it("should return 500 on database error", async () => {
    client.query.mockRejectedValueOnce(new Error("DB failure"));

    const event = {
      httpMethod: "PATCH",
      body: JSON.stringify({
        projectId: 123,
        isGitHubView: true,
      }),
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).error).toBe("Internal server error");
  });
});
