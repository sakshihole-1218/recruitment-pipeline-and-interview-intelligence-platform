import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

export const createWinstonLogger = () => {
  const isProduction = process.env.APP_ENV === 'production';

  return winston.createLogger({
    level: isProduction ? 'info' : 'debug',
    levels: winston.config.npm.levels,
    format: isProduction
      ? winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json(),
        )
      : winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          nestWinstonModuleUtilities.format.nestLike('RecruitmentPlatform', {
            prettyPrint: true,
            colors: true,
          }),
        ),
    transports: [new winston.transports.Console()],
  });
};