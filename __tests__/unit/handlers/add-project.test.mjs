// Third party
import { jest } from "@jest/globals";

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
jest.unstable_mockModule("../../../src/utils/getDBCredentials.mjs", () => ({
  default: jest.fn().mockResolvedValue({
    host: "localhost",
    username: "test_user",
    password: "test_pass",
    port: 5432,
  }),
}));

describe("addProjectHandler", () => {
  let handler;
  let client;

  beforeEach(async () => {
    await jest.isolateModulesAsync(async () => {
      const { Client } = await import("pg");
      client = new Client();

      const mod = await import("../../../src/handlers/add-project.mjs");
      handler = mod.addProjectHandler;
    });

    jest.clearAllMocks();
  });

  it("should create project entry", async () => {
    const mockRows = [{ id: "1" }, { id: "2" }];
    client.query.mockResolvedValueOnce({ rows: mockRows });

    const event = {
      httpMethod: "POST",
      path: "/",
    };

    const result = await handler(event);

    expect(client.connect).toHaveBeenCalled();
    expect(client.query).toHaveBeenCalledWith("SELECT * FROM view_count");
    expect(client.end).toHaveBeenCalled();

    expect(result).toEqual({
      statusCode: 201,
      body: JSON.stringify(mockRows),
    });
  });

  it("should return 500 on database error", async () => {
    client.query.mockRejectedValueOnce(new Error("DB failure"));

    const event = {
      httpMethod: "POST",
      path: "/",
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).error).toBe("Internal server error");
  });

  it("should throw error on non-POST method", async () => {
    const event = {
      httpMethod: "GET",
      path: "/",
    };

    await expect(handler(event)).rejects.toThrow(
      /addProjectHandler only accept POST method/
    );
  });
});
