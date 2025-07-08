// Third party
import { Client } from "pg";

// Custom
import getDbCredentials from "../utils/getDBCredentials.mjs";
import { DB_NAME, VIEW_COUNT_TABLE } from "../constants.mjs";

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
  const { projectId, isGitHubView, isDemoView } = body;
  const hasView = isGitHubView || isDemoView;
  let dbClient;
  let query;

  if (!projectId || !hasView) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error:
          "Missing required fields: projectId and isGitHubView or isDemoView",
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

    if (isGitHubView) {
      query = `
      UPDATE ${VIEW_COUNT_TABLE.name}
      SET ${VIEW_COUNT_TABLE.columns.githubViews} = ${VIEW_COUNT_TABLE.columns.githubViews} + 1
      WHERE ${VIEW_COUNT_TABLE.columns.projectId} = $1
      RETURNING *;
    `;
    } else {
      query = `
      UPDATE ${VIEW_COUNT_TABLE.name}
      SET ${VIEW_COUNT_TABLE.columns.demoViews} = ${VIEW_COUNT_TABLE.columns.demoViews} + 1
      WHERE ${VIEW_COUNT_TABLE.columns.projectId} = $1
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
