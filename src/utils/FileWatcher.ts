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
      // 支持的格式
      const extensions = [".mp3", ".m4a", ".flac", ".wav", ".aac"];
      // 判断类似是否为音乐格式
      const ext = path.extname(filePath);
      if (!extensions.includes(ext)) {
        return;
      }
      logger.info(`检测到新文件：${filePath}`);
      callback(filePath);
    });

    watcher.on("error", (error) => {
      logger.error(`chokidar 监听出现错误: ${error}`);
    });
  }
}
