// Third party
import { Client } from "pg";

// Custom
import { DB_NAME, PROJECT_TABLE } from "../constants.mjs";
import getDbCredentials from "../utils/getDBCredentials.mjs";
import buildResponse from "../utils/buildResponse.mjs";

const ENVIRONMENT = process.env.ENVIRONMENT;
const PRIVATE_API_KEY = process.env.PRIVATE_API_KEY;

/**
 * Add one or more entries to project table.
 */
export const registerProjectsHandler = async (event) => {
  // All log statements are written to CloudWatch
  console.info("received:", event);

  if (event.httpMethod !== "POST") {
    const errorMessage = `registerProjectsHandler only accepts POST method, you tried: ${event.httpMethod} method.`;
    console.error(errorMessage);

    return buildResponse(405, { error: errorMessage });
  }

  if (ENVIRONMENT !== "local") {
    const apiKey = event.headers?.["x-api-key"];

    if (!apiKey || apiKey !== PRIVATE_API_KEY) {
      const errorMessage = "Unauthorized request: Invalid or missing API key";
      console.error(errorMessage);

      return buildResponse(401, { error: errorMessage });
    }
  }

  if (!event.body) {
    const errorMessage = "Request body is missing";
    console.error(errorMessage);

    return buildResponse(400, { error: errorMessage });
  }

  const body = JSON.parse(event.body);
  const valuesToInsert = [];
  const valuePlaceholders = [];

  for (const [index, element] of body.entries()) {
    const { id, name } = element;

    if (!id || !name) {
      const errorMessage = "Missing required fields: id and name";
      console.error(errorMessage);

      return buildResponse(400, { error: errorMessage });
    }

    // Collect values
    valuesToInsert.push(id, name);

    // Create placeholder string like ($1, $2), ($3, $4)...
    const offset = index * 2;
    valuePlaceholders.push(`($${offset + 1}, $${offset + 2})`);
  }

  let dbClient;

  try {
    const creds = await getDbCredentials();

    dbClient = new Client({
      host: creds.host,
      user: creds.username,
      password: creds.password,
      database: DB_NAME,
      port: creds.port,
      ssl: {
        rejectUnauthorized: false, // This is necessary for connecting to RDS instances with SSL
      },
    });

    await dbClient.connect();

    const query = `
      INSERT INTO ${PROJECT_TABLE.name} (${PROJECT_TABLE.columns.id}, ${
      PROJECT_TABLE.columns.name
    })
      VALUES ${valuePlaceholders.join(", ")}
      ON CONFLICT (${PROJECT_TABLE.columns.id}) DO NOTHING
      RETURNING *;
    `;

    const result = await dbClient.query(query, valuesToInsert);
    const newEntry = result.rows[0];

    if (!newEntry) {
      const errorMessage = "No new entries were added, possibly due to conflict.";
      console.warn(errorMessage);

      return buildResponse(409, { error: errorMessage });
    }

    const response = buildResponse(201, newEntry);

    // All log statements are written to CloudWatch
    console.info(
      `response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`
    );

    return response;
  } catch (err) {
    console.error(err);

    return buildResponse(500, {
      error: "Internal server error",
    });
  } finally {
    if (dbClient) await dbClient.end();
  }
};
