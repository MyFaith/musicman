import fs from "fs";
import Logger from "./Logger";
import Config from "./Config";
import path from "path";
import { Tag } from "node-taglib-sharp";
const logger = new Logger("Mover");

export default class Mover {
  private config: Config;
  private musicTag: Tag;

  constructor(config: Config, musicTag: Tag) {
    this.config = config;
    this.musicTag = musicTag;
  }

  // 主操作方法
  async handleFile(filePath: string): Promise<string> {
    if (!this.config.get("mover.enabled")) {
      logger.debug("文件移动功能未启用");
      return filePath;
    }
    const targetPath = this.generateTargetPath(filePath);
    fs.renameSync(filePath, targetPath);
    logger.debug(`文件整理完成: ${filePath} -> ${targetPath}`);
    return targetPath;
  }

  // 生成目标路径
  private generateTargetPath(filePath: string) {
    const fileName = filePath.split("/").pop() || "";
    const targetDir = this.config.get<string>("directory.target") || "";

    // 获取配置参数
    const shouldRename = this.config.get<boolean>("mover.rename") || false;
    const template = this.config.get<string>("mover.namingTemplate") || "{performers}/{album}/{track}.{title}{extension}";

    if (!shouldRename) {
      return path.join(targetDir, fileName);
    }

    // 替换模板变量（保留路径分隔符）
    let relativePath = template.replace(/\{(\w+)\}/g, (_, key) => {
      const value = this.musicTag[key as keyof Tag];
      // 处理数组类型值时用逗号连接（保留原路径分隔符）
      return Array.isArray(value) ? value[0].toString() : value?.toString() || "";
    });

    // 添加文件扩展名
    const ext = path.extname(filePath);
    relativePath = relativePath.replace(/\{extension\}/g, ext) + ext;

    // 生成完整路径并标准化
    let fullPath = path.join(targetDir, relativePath);

    // 创建目录结构（关键修改）
    const dirPath = path.dirname(fullPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // 处理非法字符（仅处理文件名部分）
    const fileNamePart = path.basename(fullPath);
    const safeFileName = fileNamePart.replace(/[\\/:*?"<>|]/g, "_");
    fullPath = path.join(path.dirname(fullPath), safeFileName);

    // 处理重复文件（在正确目录下添加序号）
    let finalPath = fullPath;
    let counter = 1;
    while (fs.existsSync(finalPath)) {
      const baseName = path.basename(fullPath, ext);
      finalPath = path.join(path.dirname(fullPath), `${baseName}_${counter}${ext}`);
      counter++;
    }

    return finalPath;
  }
}
