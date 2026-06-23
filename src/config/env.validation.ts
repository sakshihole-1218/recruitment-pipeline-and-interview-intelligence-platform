import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  APP_NAME: Joi.string().required(),
  APP_PORT: Joi.number().default(3000),
  APP_ENV: Joi.string().valid('development', 'test', 'production').required(),
  APP_GLOBAL_PREFIX: Joi.string().default('api'),

  PG_HOST: Joi.string().required(),
  PG_PORT: Joi.number().required(),
  PG_USERNAME: Joi.string().required(),
  PG_PASSWORD: Joi.string().allow('').required(),
  PG_DATABASE: Joi.string().required(),
  PG_SCHEMA: Joi.string().default('public'),

  SWAGGER_TITLE: Joi.string().required(),
  SWAGGER_DESCRIPTION: Joi.string().required(),
  SWAGGER_VERSION: Joi.string().required(),
  SWAGGER_PATH: Joi.string().default('docs'),

  LOG_LEVEL: Joi.string().required(),
  LOG_AS_JSON: Joi.boolean().truthy('true').falsy('false').default(false),

  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().required(),

  AI_PROVIDER: Joi.string().valid('mock', 'gemini').default('mock'),
  GEMINI_API_KEY: Joi.when('AI_PROVIDER', {
    is: 'gemini',
    then: Joi.string().trim().required(),
    otherwise: Joi.string().trim().optional().allow(''),
  }),
  STT_PROVIDER: Joi.string().valid('mock', 'groq').default('mock'),
  GROQ_API_KEY: Joi.when('STT_PROVIDER', {
    is: 'groq',
    then: Joi.string().trim().required(),
    otherwise: Joi.string().trim().optional().allow(''),
  }),
  GROQ_STT_MODEL: Joi.string().trim().default('whisper-large-v3-turbo'),

  LIVEKIT_API_KEY: Joi.string().required(),
  LIVEKIT_API_SECRET: Joi.string().required(),
  LIVEKIT_URL: Joi.string().required(),
  LIVEKIT_WEBHOOK_SECRET: Joi.string().optional(),
});
