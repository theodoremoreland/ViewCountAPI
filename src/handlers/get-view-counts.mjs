// Third party
import { Client } from "pg";

// Custom
import getDbCredentials from "../utils/getDBCredentials.mjs";
import buildResponse from "../utils/buildResponse.mjs";
import { DB_NAME, VIEW_COUNT_TABLE } from "../constants.mjs";

/**
 * Gets all entries for view count data.
 */
export const getViewCountsHandler = async (event) => {
  // All log statements are written to CloudWatch
  console.info("received:", event);

  let dbClient;

  if (event.httpMethod !== "GET") {
    const errorMessage = `getViewCountsHandler only accepts GET method, you tried: ${event.httpMethod}`;
    console.error(errorMessage);

    return buildResponse(405, { error: errorMessage });
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

    const result = await dbClient.query(
      `SELECT * FROM ${VIEW_COUNT_TABLE.name}`
    );
    const items = result.rows;
    const processedResults = {};

    for (const item of items) {
      processedResults[item.project_id] = {
        github_views: item.github_views,
        demo_views: item.demo_views,
        last_updated: new Date(item.last_updated).toISOString(),
      };
    }

    const response = buildResponse(200, processedResults);

    // All log statements are written to CloudWatch
    console.info(
      `response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`
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
