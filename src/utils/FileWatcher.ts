import fs from "fs";
import chokidar from "chokidar";
import Logger from "./Logger";
import path from "path";

const logger = new Logger("FileWatcher");

export default class FileWatcher {
  private source: string;

  constructor(source: string) {
    this.source = source;
    logger.info("初始化完成");
  }

  public watch(callback: (filePath: string) => void): void {
    // 检查目录是否存在
    if (!fs.existsSync(this.source)) {
      logger.error(`目录不存在：${this.source}`);
      return;
    }

    logger.info(`开始监听目录: ${this.source}`);

    // 使用 chokidar 初始化监听器，ignoreInitial: true 表示不会触发已有文件的事件
    const watcher = chokidar.watch(this.source, {
      ignoreInitial: true,
      persistent: true
    });

    watcher.on("add", (filePath) => {
      const extensions = [".mp3", ".m4a", ".flac", ".wav", ".aac"];
      const ext = path.extname(filePath);
      if (!extensions.includes(ext)) return;

      // 创建稳定性检测器
      const stabilityChecker = new StabilityChecker(filePath);
      stabilityChecker.check()
        .then(() => {
          logger.debug(`文件已就绪: ${filePath}`);
          callback(filePath);
        })
        .catch((err) => {
          logger.error(`文件检测失败: ${err.message}`);
        });
    });

    watcher.on("error", (error) => {
      logger.error(`chokidar 监听出现错误: ${error}`);
    });
  }
}

// 新增稳定性检测类
class StabilityChecker {
  private readonly filePath: string;
  private readonly checkInterval = 1000; // 1秒检测一次
  private readonly maxChecks = 5;       // 最多检测5次
  private checkCount = 0;
  private lastSize = 0;
  private lastMtime = 0;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async check(): Promise<void> {
    return new Promise((resolve, reject) => {
      const check = async () => {
        try {
          const stats = await fs.promises.stat(this.filePath);
          
          // 文件被删除
          if (!stats.isFile()) {
            reject(new Error("文件已被删除"));
            return;
          }

          // 首次检测
          if (this.checkCount === 0) {
            this.lastSize = stats.size;
            this.lastMtime = stats.mtimeMs;
            this.checkCount++;
            setTimeout(check, this.checkInterval);
            return;
          }

          // 检测到变化
          if (stats.size !== this.lastSize || stats.mtimeMs !== this.lastMtime) {
            this.lastSize = stats.size;
            this.lastMtime = stats.mtimeMs;
            this.checkCount = 1; // 重置计数器
            setTimeout(check, this.checkInterval);
            return;
          }

          // 连续稳定
          if (++this.checkCount >= this.maxChecks) {
            resolve();
            return;
          }

          setTimeout(check, this.checkInterval);
        } catch (error) {
          reject(error);
        }
      };

      check();
    });
  }
}
