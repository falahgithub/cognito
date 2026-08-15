# Cognito Practice App

A minimal Next.js app to practice AWS Cognito flows.

## Local Development

```bash
cp .env.local.example .env.local
# fill in your Cognito values
npm install
npm run dev
```

## Docker Build

```bash
docker build   --build-arg NEXT_PUBLIC_COGNITO_USER_POOL_ID=xxx   --build-arg NEXT_PUBLIC_COGNITO_CLIENT_ID=xxx   --build-arg NEXT_PUBLIC_COGNITO_DOMAIN=xxx   --build-arg NEXT_PUBLIC_REDIRECT_SIGN_IN=http://localhost:3000/   --build-arg NEXT_PUBLIC_REDIRECT_SIGN_OUT=http://localhost:3000/   -t cognito-practice .
```

## CodeBuild

1. Create an ECR repository named `cognito-practice`.
2. Set the environment variable `AWS_ACCOUNT_ID` in your CodeBuild project.
3. Pass Cognito env vars as build environment variables or SSM parameters.
4. The `buildspec.yml` only handles Docker auth; all build work happens inside the Dockerfile.
