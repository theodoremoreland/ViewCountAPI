// Third party
import { Client } from "pg";

// Custom
import getDbCredentials from "../utils/getDBCredentials.mjs";
import { DB_NAME, DB_TABLE_NAME } from "../constants.mjs";

/**
 * Gets all entries for view count data.
 */
export const getViewCountsHandler = async (event) => {
  if (event.httpMethod !== "GET") {
    throw new Error(
      `getViewCountsHandler only accept GET method, you tried: ${event.httpMethod}`
    );
  }

  // All log statements are written to CloudWatch
  console.info("received:", event);

  let dbClient;

  try {
    const creds = await getDbCredentials();

    dbClient = new Client({
      host: creds.host,
      user: creds.username,
      password: creds.password,
      database: DB_NAME,
      port: creds.port,
    });

    await dbClient.connect();

    const result = await dbClient.query(`SELECT * FROM ${DB_TABLE_NAME}`);
    const items = result.rows;

    const response = {
      statusCode: 200,
      body: JSON.stringify(items),
    };

    // All log statements are written to CloudWatch
    console.info(
      `response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`
    );

    return response;
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
