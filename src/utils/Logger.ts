import winston from 'winston';
import chalk from 'chalk';

class Logger {
  private logger: winston.Logger;
  private moduleName: string;

  constructor(moduleName: string) {
    this.moduleName = moduleName;

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          const coloredLevel = this.getColoredLevel(level);
          return `${chalk.gray(timestamp)} ${coloredLevel} ${chalk.cyan(this.moduleName)}: ${message}`;
        })
      ),
      transports: [new winston.transports.Console()],
    });
  }

  private getColoredLevel(level: string) {
    switch(level.toUpperCase()) {
      case 'ERROR': return chalk.redBright(level);
      case 'WARN': return chalk.yellowBright(level);
      case 'INFO': return chalk.greenBright(level);
      case 'DEBUG': return chalk.blueBright(level);
      default: return chalk.white(level);
    }
  }

  public info(message: string) {
    this.logger.info(message);
  }

  public error(message: string) {
    this.logger.error(message);
  }

  public warn(message: string) {
    this.logger.warn(message);
  }

  public debug(message: string) {
    this.logger.debug(message);
  }
}

export default Logger;
