// Create clients and set shared const values outside of the handler.
import getDbCredentials from "../utils/getDBCredentials.mjs";

// Get the DynamoDB table name from environment variables
const tableName = process.env.SAMPLE_TABLE;

/**
 * Increments view count for a specific entry in PostgreSQL table.
 */
export const incrementViewCountHandler = async (event) => {
    if (event.httpMethod !== 'PATCH') {
        throw new Error(`patchMethod only accepts PATCH method, you tried: ${event.httpMethod} method.`);
    }
    // All log statements are written to CloudWatch
    console.info('received:', event);

    // Get id and name from the body of the request
    const body = JSON.parse(event.body);
    const id = body.id;
    const name = body.name;

    try {
        const data = await ddbDocClient.send(new PutCommand(params));
        console.log("Success - item added or updated", data);
      } catch (err) {
        console.log("Error", err.stack);
      }

    const response = {
        statusCode: 200,
        body: JSON.stringify(body)
    };

    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
};
