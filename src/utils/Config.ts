import fs from "fs";
import YAML from "yaml";
import Logger from './Logger';

const logger = new Logger('Config');

export class Config {
  private config: any;

  constructor(configPath: string) {
    logger.info(`加载配置文件: ${configPath}`);
    if (!fs.existsSync(configPath)) {
      logger.error(`配置文件不存在: ${configPath}`);
      throw new Error(`Config file not found: ${configPath}`);
    }
    try {
      // 同步读取配置文件内容
      const fileContents = fs.readFileSync(configPath, "utf8");
      // 使用 yaml 库解析 YAML 内容
      this.config = YAML.parse(fileContents);
      logger.debug(`配置文件内容: ${JSON.stringify(this.config)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`读取配置文件失败: ${message}`);
      throw error;
    }
  }

  // 返回整个配置对象
  public getAll(): any {
    return this.config;
  }

  // 根据点分割的 key 获取对应的配置值，例如 "database.host"
  public get<T>(key: string): T | undefined {
    if (!this.config) {
      logger.error('配置未初始化');
      throw new Error('Config not initialized');
    }
    logger.debug(`获取配置项: ${key}`);
    if (!key) {
      return this.config;
    }
    const keys = key.split(".");
    let result = this.config;
    for (const k of keys) {
      if (result && Object.prototype.hasOwnProperty.call(result, k)) {
        result = result[k];
      } else {
        return undefined;
      }
    }
    return result as T | undefined;
  }
}

// 导出默认实例，方便其他模块直接引用配置值
export default Config;
