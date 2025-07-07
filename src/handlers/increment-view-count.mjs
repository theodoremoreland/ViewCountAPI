// Third party
import { Client } from "pg";

// Custom
import getDbCredentials from "../utils/getDBCredentials.mjs";
import { DB_TABLE_NAME, GITHUB_VIEWS_COLUMN, DEMO_VIEWS_COLUMN } from "../constants.js";

/**
 * Increments view count for a specific entry in PostgreSQL table.
 */
export const incrementViewCountHandler = async (event) => {
  if (event.httpMethod !== "PATCH") {
    throw new Error(
      `patchMethod only accepts PATCH method, you tried: ${event.httpMethod} method.`
    );
  }

  // All log statements are written to CloudWatch
  console.info("received:", event);

  const body = JSON.parse(event.body);
  const { projectId, hasViewedGitHub, hasViewedDemo } = body;

  if ((!projectId && !hasViewedGitHub) || !hasViewedDemo) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error:
          "Missing required fields: projectId and hasViewedGitHub or hasViewedDemo",
      }),
    };
  }

  let dbClient;
  let query;

  try {
    const creds = await getDbCredentials();

    dbClient = new Client({
      host: creds.host,
      user: creds.username,
      password: creds.password,
      database: creds.dbname,
      port: creds.port,
    });

    await dbClient.connect();

    if (hasViewedGitHub) {
      query = `
      UPDATE ${DB_TABLE_NAME}
      SET ${GITHUB_VIEWS_COLUMN} = ${GITHUB_VIEWS_COLUMN} + 1
      WHERE project_id = $1
      RETURNING *;
    `;
    } else {
      query = `
      UPDATE ${DB_TABLE_NAME}
      SET ${DEMO_VIEWS_COLUMN} = ${DEMO_VIEWS_COLUMN} + 1
      WHERE project_id = $1
      RETURNING *;
    `;
    }

    const values = [projectId];

    const result = await dbClient.query(query, values);

    if (result.rowCount === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Item not found" }),
      };
    }

    const updatedItem = result.rows[0];

    // All log statements are written to CloudWatch
    console.info(
      `response from: ${event.path} statusCode: 200 body: ${JSON.stringify(
        updatedItem
      )}`
    );

    return {
      statusCode: 200,
      body: JSON.stringify(updatedItem),
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
