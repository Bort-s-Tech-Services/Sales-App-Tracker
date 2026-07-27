const { S3Client } = require('@aws-sdk/client-s3');
const { CloudWatchLogsClient } = require('@aws-sdk/client-cloudwatch-logs');
require('dotenv').config();

const region = process.env.AWS_REGION || 'us-east-1';

// AWS SDK v3 automatically relies on standard AWS credentials,
// IAM Role Instance Profiles on EC2, or explicit environment variables.
const awsConfig = {
  region
};

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  awsConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  };
}

const s3Client = new S3Client(awsConfig);
const cloudWatchClient = new CloudWatchLogsClient(awsConfig);

const bucketName = process.env.AWS_S3_BUCKET_NAME || 'csbc252-sales-tracker-assets';
const logGroup = process.env.CLOUDWATCH_LOG_GROUP || '/aws/ec2/sales-app-tracker';
const logStream = process.env.CLOUDWATCH_LOG_STREAM || 'backend-api-stream';

module.exports = {
  s3Client,
  cloudWatchClient,
  bucketName,
  logGroup,
  logStream,
  region
};
