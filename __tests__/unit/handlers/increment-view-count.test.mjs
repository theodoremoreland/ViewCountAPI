// Third party
import { mockClient } from "aws-sdk-client-mock";

// Import incrementViewCountHandler function from increment-view-count.mjs
import { incrementViewCountHandler } from "../../../src/handlers/increment-view-count.mjs";

// This includes all tests for incrementViewCountHandler()
describe("Test incrementViewCountHandler", function () {
  const ddbMock = mockClient(DynamoDBDocumentClient);

  beforeEach(() => {
    ddbMock.reset();
  });

  // This test invokes incrementViewCountHandler() and compare the result
  it("should update id in the table", async () => {
    const returnedItem = { id: "id1", name: "name1" };

    // Return the specified value whenever the spied put function is called
    ddbMock.on(PutCommand).resolves({
      returnedItem,
    });

    const event = {
      httpMethod: "POST",
      body: '{"id": "id1","name": "name1"}',
    };

    // Invoke putItemHandler()
    const result = await putItemHandler(event);

    const expectedResult = {
      statusCode: 200,
      body: JSON.stringify(returnedItem),
    };

    // Compare the result with the expected result
    expect(result).toEqual(expectedResult);
  });
});
