// Third party
import { Client } from "pg";

// Custom
import getDbCredentials from "../utils/getDBCredentials.mjs";
import {
  DB_NAME,
  PROJECT_TABLE
} from "../constants.mjs";

/**
 * Add entry to project table.
 */
export const addProjectHandler = async (event) => {
  if (event.httpMethod !== "POST") {
    throw new Error(
      `addProjectHandler only accepts POST method, you tried: ${event.httpMethod} method.`
    );
  }

  // All log statements are written to CloudWatch
  console.info("received:", event);

  const body = JSON.parse(event.body);
  const { projectId, projectName } = body;
  let dbClient;

  if (!projectId || !projectName) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Missing required fields: projectId and projectName",
      }),
    };
  }

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
      INSERT INTO ${PROJECT_TABLE.name} (${PROJECT_TABLE.columns.id}, ${PROJECT_TABLE.columns.name})
      VALUES ($1, $2)
      RETURNING *;
    `;

    const values = [projectId, projectName];

    const result = await dbClient.query(query, values);
    const newEntry = result.rows[0];

    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: 201`);

    return {
      statusCode: 201,
      body: JSON.stringify(newEntry),
    };
  } catch (err) {
    console.error("Database error:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  } finally {
    if (dbClient) await dbClient.end();
  }
};
