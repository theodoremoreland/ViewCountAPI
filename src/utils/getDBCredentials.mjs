import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const getDbCredentials = async () => {
  const client = new SecretsManagerClient({ region: process.env.AWS_REGION });
  const command = new GetSecretValueCommand({ SecretId: process.env.SECRET_ARN });

  try {
    const response = await client.send(command);
    const secret = response.SecretString;
    return JSON.parse(secret); // Assumes your secret is a JSON string
  } catch (err) {
    console.error('Error retrieving secret:', err);
    throw err;
  }
};

export default getDbCredentials;