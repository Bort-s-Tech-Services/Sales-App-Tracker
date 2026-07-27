const { PutLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');
const { cloudWatchClient, logGroup, logStream } = require('../config/aws');

const cloudwatchLogger = async (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', async () => {
    const durationMs = Date.now() - startTime;
    const logPayload = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: `${durationMs}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    };

    console.log(`[CloudWatch Metric Log] ${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs}ms`);

    // If CloudWatch logging is enabled and not in testing mode
    if (process.env.ENABLE_CLOUDWATCH === 'true' && process.env.NODE_ENV === 'production') {
      try {
        const command = new PutLogEventsCommand({
          logGroupName: logGroup,
          logStreamName: logStream,
          logEvents: [
            {
              timestamp: Date.now(),
              message: JSON.stringify(logPayload)
            }
          ]
        });
        await cloudWatchClient.send(command);
      } catch (err) {
        console.error('[CloudWatch Error] Failed to put log event:', err.message);
      }
    }
  });

  next();
};

module.exports = cloudwatchLogger;
