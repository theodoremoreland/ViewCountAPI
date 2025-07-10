import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const getAccessToken = async () => {
  if (!process.env.AWS_REGION) {
    throw new Error("AWS_REGION environment variable is not defined");
  }

  if (!process.env.ACCESS_TOKEN_SECRET_NAME) {
    throw new Error("ACCESS_TOKEN_SECRET_NAME environment variable is not defined");
  }

  const client = new SecretsManagerClient({ region: process.env.AWS_REGION });
  const command = new GetSecretValueCommand({
    SecretId: process.env.ACCESS_TOKEN_SECRET_NAME,
  });
  const response = await client.send(command);

  return response.SecretString;
};

export default getAccessToken;
