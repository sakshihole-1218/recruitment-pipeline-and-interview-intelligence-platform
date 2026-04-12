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
});