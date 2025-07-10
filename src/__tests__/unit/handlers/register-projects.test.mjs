// Third party
import { beforeAll, jest } from "@jest/globals";

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

const OLD_ENV = process.env;

describe("registerProjectsHandler", () => {
  let handler;
  let client;

  beforeAll(() => {
    process.env = { ...OLD_ENV };
    process.env.ENVIRONMENT = "local";
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  beforeEach(async () => {
    await jest.isolateModulesAsync(async () => {
      const { Client } = await import("pg");
      client = new Client();

      const mod = await import("../../../handlers/register-projects.mjs");
      handler = mod.registerProjectsHandler;
    });

    jest.clearAllMocks();
  });

  it("returns 400 if id or name is missing", async () => {
    const event = {
      httpMethod: "POST",
      body: JSON.stringify([{ name: "Test Project" }]),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toMatch(/Missing required fields/);
  });

  it("successfully inserts and returns the new row", async () => {
    const mockRow = {
      project_id: "abc123",
      project_name: "Test Project",
    };

    client.query.mockResolvedValueOnce({ rows: [mockRow] });

    const event = {
      httpMethod: "POST",
      body: JSON.stringify([{ id: "abc123", name: "Test Project" }]),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body)).toEqual(mockRow);
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO"),
      ["abc123", "Test Project"]
    );
  });

  it("should return 500 on database error", async () => {
    client.query.mockRejectedValueOnce(new Error("DB failure"));

    const event = {
      httpMethod: "POST",
      body: JSON.stringify([{ id: "abc123", name: "Test Project" }]),
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).error).toBe("Internal server error");
  });

  it("should return 405 on non-POST method", async () => {
    const event = {
      httpMethod: "GET",
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(405);
    expect(JSON.parse(result.body).error).toBe(
      "registerProjectsHandler only accepts POST method, you tried: GET method."
    );
  });

  it("should return 409 on conflict", async () => {
    client.query.mockResolvedValueOnce({ rows: [] }); // Simulate no new rows inserted

    const event = {
      httpMethod: "POST",
      body: JSON.stringify([{ id: "abc123", name: "Test Project" }]),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(409);
    expect(JSON.parse(response.body).error).toBe(
      "No new entries were added, possibly due to conflict."
    );
  });
});
