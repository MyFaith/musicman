import { File, IPicture, PictureType, ByteVector, Tag } from "node-taglib-sharp";
import Logger from "./Logger";

const logger = new Logger("MusicTag");

export interface MusicTagInfo {
  title?: string;
  artists?: string[];
  albumArtists?: string[];
  album?: string;
  year?: number;
  diskNumber?: number;
  trackNumber?: number;
  genres?: string[];
  comment?: string;
  lyrics?: string;
  cover?: string;
}

export default class MusicTag {
  // 统一读取方法
  static async read(filePath: string): Promise<MusicTagInfo> {
    try {
      logger.debug(`开始读取元数据: ${filePath}`);
      const file = await File.createFromPath(filePath);
      const tag = file.tag;

      return {
        title: tag.title || undefined,
        artists: tag.performers,
        albumArtists: tag.albumArtists,
        album: tag.album || undefined,
        year: tag.year || undefined,
        diskNumber: tag.disc,
        trackNumber: tag.track,
        genres: tag.genres,
        comment: tag.comment || undefined,
        lyrics: tag.lyrics || undefined,
        cover: this.getCoverImage(file)
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`读取元数据失败: ${message}`);
      throw error;
    }
  }

  // 统一写入方法
  static async format(filePath: string, newTag: MusicTagInfo): Promise<Tag> {
    try {
      const file = await File.createFromPath(filePath);
      const tag: Tag = file.tag;

      if (!tag.title) {
        tag.title = newTag.title || "";
      }
      if (tag.performers.length === 0) {
        tag.performers = newTag.artists || [];
      }
      if (tag.albumArtists.length === 0) {
        tag.albumArtists = tag.performers;
      }
      if (!tag.album) {
        tag.album = newTag.album || "";
      }
      if (tag.year === 0) {
        tag.year = newTag.year || 0;
      }
      if (tag.disc === 0) {
        tag.disc = newTag.diskNumber || 0;
      }
      if (tag.track === 0) {
        tag.track = newTag.trackNumber || 0;
      }
      if (tag.genres.length === 0) {
        tag.genres = newTag.genres || [];
      }
      if (!tag.comment) {
        tag.comment = newTag.comment || "";
      }
      if (!tag.lyrics) {
        tag.lyrics = newTag.lyrics || "";
      }

      // 处理封面图片
      if (newTag.cover) {
        const picture = await this.createPicture(newTag.cover);
        tag.pictures = [picture];
      }

      // 保存修改
      await file.save();
      logger.debug(`标签更新成功: ${filePath}`);
      // 返回tag
      return tag;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`文件标签更新失败: ${message}`);
      throw error;
    }
  }

  // 获取封面图片
  private static getCoverImage(file: File): string | undefined {
    const picture = file.tag.pictures?.[0];
    if (picture) {
      return `data:${picture.mimeType};base64,${picture.data}`;
    }
  }

  // 创建图片对象
  private static async createPicture(cover: string): Promise<IPicture> {
    let buffer: Buffer;

    if (cover.startsWith("http")) {
      const response = await fetch(cover);
      buffer = Buffer.from(await response.arrayBuffer());
    } else if (cover.startsWith("data:")) {
      const base64Data = cover.split(",")[1];
      buffer = Buffer.from(base64Data, "base64");
    } else {
      buffer = Buffer.from(cover, "base64");
    }

    return {
      data: ByteVector.fromByteArray(buffer),
      type: PictureType.FrontCover,
      mimeType: this.getMimeType(buffer),
      description: "Cover",
      filename: "cover" + this.getFileExtension(buffer)
    };
  }

  // 获取MIME类型
  private static getMimeType(buffer: Buffer): string {
    const signature = buffer.toString("hex", 0, 4);
    switch (signature) {
      case "ffd8ffe0":
      case "ffd8ffdb":
      case "ffd8ffee":
        return "image/jpeg";
      case "89504e47":
        return "image/png";
      case "47494638":
        return "image/gif";
      default:
        return "application/octet-stream";
    }
  }

  // 获取文件扩展名
  private static getFileExtension(buffer: Buffer): string {
    const mime = this.getMimeType(buffer);
    return mime === "image/jpeg" ? ".jpg" : mime === "image/png" ? ".png" : mime === "image/gif" ? ".gif" : "";
  }
}
