# View Count API

A serverless Rest API for reporting and getting view counts for [Project List](https://github.com/theodoremoreland/ProjectList) app.

<img src="/presentation/thumbnail.webp" width="650">

## Table of contents

- [Technologies used](#technologies-used)
- [Overview](#overview)
  - [Files and folders](#files-and-folders)
- [How the application is deployed](#how-the-application-is-deployed)
- [How the AWS SAM CLI is used to build and test locally](#how-the-aws-sam-cli-is-used-to-build-and-test-locally)
- [Unit tests](#unit-tests)
- [Cleanup](#unit-tests)
- [Resources](#resources)

## Technologies used

- JavaScript
- Node
- Jest
- AWS SAM
- AWS Lambda
- AWS API Gateway
- AWS Secrets Manager
- AWS RDS (PostgreSQL)

## Overview

This repository contains all the source code for generating a REST based API Gateway and its corresponding Lambda event handlers for the purposes of managing view counts for my [Project List](https://github.com/theodoremoreland/ProjectList) app. The API supports three HTTP Methods: `GET`, `POST`, and `PATCH` - all of which are handled at the root level of the API (i.e. @ `/`). Each file in the `src/handlers` directory corresponds to one of the method handlers.

The API is technically public as to be available for the Project List app, however two security measures were implemented to discourage public abuse. Firstly, each route requires a public API key that the Project List app uses in which its usage is rate limited and throttled. Secondly, the PATCH route responsible for registering new projects for view count tracking requires an access token, the method is not used by the Project List app and is therefore private. You can review the `template.yaml` file, the `env.json.example` file, and the `src/handlers/register-projects.mjs` file to see how the API and access token were implemented.

The API also depends on an already available RDS PostgreSQL database. So while all the other resources (API Gateway, Lambda, and Secrets Manager) were defined in the `template.yaml`, the database itself is not, only its credentials are referenced via Secrets Manager. The `pg` npm library is used as the database driver.

### Files and folders

This project contains source code and supporting files for a serverless application that you can deploy with the AWS Serverless Application Model (AWS SAM) command line interface (CLI). It includes the following files and folders:

- `src` - Code for the application's Lambda functions.
  - `__tests__` - Unit tests for the application code.
  - `handlers` - Folder for all of the Lambda event handlers.
- `events` - Invocation events that you can use to invoke the function. Only used to test lambdas locally.
- `env.json.example` - A template for an env.json file that stores variable overrides for the lambdas. Custom variables must be declared in the Globals section of the template.yaml file.
- `template.yaml` - A template that defines the application's AWS resources.
- `seed` - Files for creating tables and rows in PostgreSQL database.

The application uses several AWS resources, including Lambda functions, an API Gateway API, AWS Secrets Manager, and AWS RDS. Only the latter of which is not defined in the `template.yaml` file in this project. You can update the template to add/configure AWS resources through the same deployment process that updates the application code.

## How the application is deployed

The AWS SAM CLI is an extension of the AWS CLI that adds functionality for building and testing Lambda applications. It uses Docker to run your functions in an Amazon Linux environment that matches Lambda. It can also emulate your application's build environment and API.

To use the AWS SAM CLI, you need the following tools:

- AWS SAM CLI - [Install the AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html).
- Node.js - [Install Node.js 22](https://nodejs.org/en/), including the npm package management tool.
- Docker - [Install Docker community edition](https://hub.docker.com/search/?type=edition&offering=community).

To build and deploy application for the first time, run the following in your shell:

```bash
sam build
sam deploy --guided
```

Deploy with parameter overrides:

```bash
sam deploy \
  --parameter-overrides \
  DbSecretName=your-secret-name \
  AccessToken=your-access-token
```

The API Gateway endpoint API will be displayed in the outputs when the deployment is complete assuming the API resource is referenced in the Outputs of the `template.yaml`.

## How the AWS SAM CLI is used to build and test locally

Validate template.yaml.

```bash
sam validate --template-file template.yaml
```

Build your application by using the `sam build` command.

```bash
sam build
```

The AWS SAM CLI installs dependencies that are defined in `package.json`, creates a deployment package, and saves it in the `.aws-sam/build` folder.

Test a single function by invoking it directly with a test event. An event is a JSON document that represents the input that the function receives from the event source. Test events are included in the `events` folder in this project.

Run functions locally and invoke them with the `sam local invoke` command.

```bash
sam local invoke {function name} --event events/event-{event name}.json
```

The AWS SAM CLI can also emulate your application's API. Use the `sam local start-api` command to run the API locally on port 3000.

```bash
sam local start-api
curl http://localhost:3000/
```

Start API with environment variable and parameter overrides:

```bash
sam local start-api \
  --env-vars env.json \
  --parameter-overrides \
  DbSecretName=your-secret-name \
  AccessToken=your-access-token
```

The AWS SAM CLI reads the application template to determine the API's routes and the functions that they invoke. The `Events` property on each function's definition includes the route and method for each path.

```yaml
      Events:
        Api:
          Type: Api
          Properties:
            Path: /
            Method: GET
```

## Unit tests

Tests are defined in the `src/__tests__` folder in this project. Use `npm` to install the [Jest test framework](https://jestjs.io/) and run unit tests.

```bash
cd src/
npm install
npm run test
```

## Cleanup

To delete the sample application that you created, use the AWS CLI. Assuming you used your project name for the stack name, you can run the following:

```bash
sam delete --stack-name view-count-api
```

## Resources

For an introduction to the AWS SAM specification, the AWS SAM CLI, and serverless application concepts, see the [AWS SAM Developer Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html).
