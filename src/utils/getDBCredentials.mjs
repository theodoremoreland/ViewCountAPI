import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const getDbCredentials = async () => {
  if (!process.env.AWS_REGION) {
    throw new Error("AWS_REGION environment variable is not defined");
  }

  if (!process.env.SECRET_NAME) {
    throw new Error("SECRET_NAME environment variable is not defined");
  }

  const client = new SecretsManagerClient({ region: process.env.AWS_REGION });
  const command = new GetSecretValueCommand({
    SecretId: process.env.SECRET_NAME,
  });

  try {
    const response = await client.send(command);
    const secret = response.SecretString;

    return JSON.parse(secret);
  } catch (err) {
    console.error("Error retrieving secret:", err);

    throw err;
  }
};

export default getDbCredentials;
