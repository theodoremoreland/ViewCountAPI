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
jest.unstable_mockModule("../../../utils/getDBCredentials.mjs", () => ({
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

      const mod = await import("../../../handlers/add-project.mjs");
      handler = mod.addProjectHandler;
    });

    jest.clearAllMocks();
  });

  it('returns 400 if projectId or projectName is missing', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({ projectId: 'abc' }), // missing projectName
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toMatch(/Missing required fields/);
  });

  it('successfully inserts and returns the new row', async () => {
    const mockRow = {
      project_id: 'abc123',
      project_name: 'Test Project',
    };

    client.query.mockResolvedValueOnce({ rows: [mockRow] });

    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({ projectId: 'abc123', projectName: 'Test Project' }),
      path: '/add-project',
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body)).toEqual(mockRow);
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO'),
      ['abc123', 'Test Project']
    );
  });

  it("should return 500 on database error", async () => {
    client.query.mockRejectedValueOnce(new Error("DB failure"));

    const event = {
      httpMethod: "POST",
      body: JSON.stringify({ projectId: 'abc123', projectName: 'Test Project' }),
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
      /addProjectHandler only accepts POST method/
    );
  });
});
