import fs from "fs";
import chokidar from "chokidar";

export class FileWatcher {
  private source: string;

  constructor(source: string) {
    this.source = source;
    console.log("[FileWatcher] 初始化完成");
  }

  public watch(callback: (filePath: string) => void): void {
    // 检查目录是否存在
    if (!fs.existsSync(this.source)) {
      console.error(`[FileWatcher] 目录不存在：${this.source}`);
      return;
    }

    console.log("[FileWatcher] 开始监听目录:", this.source);

    // 使用 chokidar 初始化监听器，ignoreInitial: true 表示不会触发已有文件的事件
    const watcher = chokidar.watch(this.source, {
      ignoreInitial: true,
      persistent: true,
    });

    watcher.on("add", (filePath) => {
      console.log(`[FileWatcher] 检测到新文件：${filePath}`);
      callback(filePath);
    });

    watcher.on("error", (error) => {
      console.error(`[FileWatcher] chokidar 监听出现错误: ${error}`);
    });
  }
}
