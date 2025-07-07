// Third party
import { mockClient } from "aws-sdk-client-mock";

// Import getViewCountsHandler function from get-view-counts.mjs
import { getViewCountsHandler } from "../../../src/handlers/get-view-counts.mjs";

// This includes all tests for getViewCountsHandler()
describe("Test getViewCountsHandler", () => {
  const ddbMock = mockClient(DynamoDBDocumentClient);

  beforeEach(() => {
    ddbMock.reset();
  });

  it("should return ids", async () => {
    const items = [{ id: "id1" }, { id: "id2" }];

    // Return the specified value whenever the spied scan function is called
    ddbMock.on(ScanCommand).resolves({
      Items: items,
    });

    const event = {
      httpMethod: "GET",
    };

    // Invoke helloFromLambdaHandler()
    const result = await getViewCountsHandler(event);

    const expectedResult = {
      statusCode: 200,
      body: JSON.stringify(items),
    };

    // Compare the result with the expected result
    expect(result).toEqual(expectedResult);
  });
});
