// Third party
import { Client } from "pg";

// Custom
import getDbCredentials from "../utils/getDBCredentials.mjs";
import buildResponse from "../utils/buildResponse.mjs";
import { DB_NAME, VIEW_COUNT_TABLE } from "../constants.mjs";

/**
 * Increments view count for a specific entry in PostgreSQL table.
 */
export const incrementViewCountHandler = async (event) => {
  // All log statements are written to CloudWatch
  console.info("received:", event);

  const body = JSON.parse(event.body);
  const { projectId, isGitHubView, isDemoView } = body;
  const hasView = isGitHubView || isDemoView;
  let dbClient;
  let query;

  if (event.httpMethod !== "PATCH") {
    const errorMessage = `incrementViewCountHandler only accepts PATCH method, you tried: ${event.httpMethod} method.`;
    console.error(errorMessage);

    return buildResponse(405, { error: errorMessage });
  }

  if (!projectId || !hasView) {
    const errorMessage = "Missing required fields: projectId and isGitHubView or isDemoView";
    console.error(errorMessage);

    return buildResponse(400, {
      error: errorMessage,
    });
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
      const response = buildResponse(404, {
        error: "Item not found",
      });

      return response;
    }

    const updatedItem = result.rows[0];
    const response = buildResponse(200, updatedItem);

    // All log statements are written to CloudWatch
    console.info(
      `response from: ${event.path} statusCode: 200 body: ${JSON.stringify(
        updatedItem
      )}`
    );

    return response;
  } catch (err) {
    console.error(err);

    const errorResponse = buildResponse(500, {
      error: "Internal server error",
    });

    return errorResponse;
  } finally {
    if (dbClient) await dbClient.end();
  }
};
