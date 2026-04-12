export default () => ({
  app: {
    name: process.env.APP_NAME,
    port: Number(process.env.APP_PORT ?? 3000),
    env: process.env.APP_ENV,
    globalPrefix: process.env.APP_GLOBAL_PREFIX ?? 'api',
  },
  database: {
    host: process.env.PG_HOST,
    port: Number(process.env.PG_PORT ?? 5432),
    username: process.env.PG_USERNAME,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    schema: process.env.PG_SCHEMA ?? 'public',
  },
  swagger: {
    title: process.env.SWAGGER_TITLE,
    description: process.env.SWAGGER_DESCRIPTION,
    version: process.env.SWAGGER_VERSION,
    path: process.env.SWAGGER_PATH ?? 'docs',
  },
  logger: {
    level: process.env.LOG_LEVEL?.split(',') ?? ['log', 'error', 'warn'],
    json: String(process.env.LOG_AS_JSON).toLowerCase() === 'true',
  },
});