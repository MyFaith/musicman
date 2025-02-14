import fs from "fs";
import YAML from "yaml";

export class Config {
  private config: any;

  constructor(configPath: string) {
    try {
      // 同步读取配置文件内容
      const fileContents = fs.readFileSync(configPath, "utf8");
      // 使用 yaml 库解析 YAML 内容
      this.config = YAML.parse(fileContents);
    } catch (error) {
      console.error(`读取配置文件失败：${configPath}`, error);
      this.config = {};
    }
  }

  // 返回整个配置对象
  public getAll(): any {
    return this.config;
  }

  // 根据点分割的 key 获取对应的配置值，例如 "database.host"
  public get(key: string): any {
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
    return result;
  }
}

// 导出默认实例，方便其他模块直接引用配置值
export default Config;
