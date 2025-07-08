const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
  "Content-Type": "application/json",
};

const buildResponse = (statusCode, body) => {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: HEADERS,
  };
};

export default buildResponse;
