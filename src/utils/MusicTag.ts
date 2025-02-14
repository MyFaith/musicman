import { parseFile, type IAudioMetadata } from "music-metadata";
import NodeID3 from "node-id3";
import { readFlacTags, writeFlacTags, FlacTagMap, PictureType } from "flac-tagger";
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
  // 读取音乐标签
  static async read(filePath: string): Promise<MusicTagInfo> {
    try {
      logger.debug(`开始读取元数据: ${filePath}`);
      const metadata = await parseFile(filePath);
      return {
        title: metadata.common.title,
        artists: metadata.common.artists,
        albumArtists: metadata.common.albumartist?.split(","),
        album: metadata.common.album,
        year: metadata.common.year,
        diskNumber: metadata.common.disk?.no ?? undefined,
        trackNumber: metadata.common.track?.no ?? undefined,
        genres: metadata.common.genre,
        comment: metadata.common.comment?.join("\n"),
        lyrics: metadata.common.lyrics?.join("\n"),
        cover: metadata.common.picture?.[0]?.data.toString()
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`读取元数据失败: ${message}`);
      throw error;
    }
  }

  // 整理音乐标签
  static async format(filePath: string, newTag: MusicTagInfo) {
    logger.info(`开始格式化文件: ${filePath}`);
    const fileType = filePath.split(".").pop()?.toLowerCase();

    try {
      if (fileType === "mp3") {
        await this.writeMP3(filePath, newTag);
      } else if (fileType === "flac") {
        await this.writeFLAC(filePath, newTag);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`文件标签更新失败: ${message}`);
      throw error;
    }
    logger.debug(`格式化完成: ${filePath}`);
  }

  // 新增独立MP3写入方法
  static async writeMP3(filePath: string, tagInfo: MusicTagInfo): Promise<void> {
    try {
      // 新增：处理图片URL
      let imageBuffer: Buffer | undefined;
      if (tagInfo.cover) {
        // 判断是否是URL
        if (tagInfo.cover.startsWith("http")) {
          const response = await fetch(tagInfo.cover);
          const arrayBuffer = await response.arrayBuffer();
          imageBuffer = Buffer.from(arrayBuffer);
        } else {
          // 假设是base64字符串
          imageBuffer = Buffer.from(tagInfo.cover, "base64");
        }
      }

      const tags: NodeID3.Tags = {
        title: tagInfo.title,
        artist: tagInfo.artists?.join("; "),
        performerInfo: tagInfo.albumArtists?.join("; "),
        album: tagInfo.album,
        year: tagInfo.year?.toString(),
        trackNumber: tagInfo.trackNumber?.toString(),
        partOfSet: tagInfo.diskNumber?.toString(),
        genre: tagInfo.genres?.join("; "),
        comment: {
          language: "eng",
          text: tagInfo.comment || ""
        },
        unsynchronisedLyrics: {
          language: "eng",
          text: tagInfo.lyrics?.toString() || ""
        },
        generalObject: [],
        image: imageBuffer
          ? {
              mime: this.getMimeType(imageBuffer),
              type: { id: 3, name: "Cover" },
              description: "Cover",
              imageBuffer
            }
          : undefined
      };

      const success = NodeID3.write(tags, filePath);
      if (success) {
        logger.info(`MP3标签写入成功 ${filePath}`);
      } else {
        logger.error(`MP3标签写入失败 ${filePath}`);
      }
    } catch (error) {
      throw new Error(`图片处理失败: ${(error as Error).message}`);
    }
  }

  // 修改FLAC写入方法
  static async writeFLAC(filePath: string, tagInfo: MusicTagInfo): Promise<void> {
    try {
      const tagMap: FlacTagMap = {
        TITLE: tagInfo.title ? [tagInfo.title] : [],
        ARTIST: tagInfo.artists?.join("; ") || [],
        ALBUMARTIST: tagInfo.albumArtists?.join("; ") || [],
        ALBUM: tagInfo.album ? [tagInfo.album] : [],
        DATE: tagInfo.year ? [tagInfo.year.toString()] : [],
        DISCNUMBER: tagInfo.diskNumber ? [tagInfo.diskNumber.toString()] : [],
        TRACKNUMBER: tagInfo.trackNumber ? [tagInfo.trackNumber.toString()] : [],
        GENRE: tagInfo.genres?.join("; ") || [],
        COMMENT: tagInfo.comment ? [tagInfo.comment] : [],
        LYRICS: tagInfo.lyrics ? [tagInfo.lyrics] : []
      };

      let coverBuffer: Buffer | undefined;
      if (tagInfo.cover) {
        if (tagInfo.cover.startsWith("http")) {
          const response = await fetch(tagInfo.cover);
          coverBuffer = Buffer.from(await response.arrayBuffer());
        } else {
          coverBuffer = Buffer.from(tagInfo.cover, "base64");
        }
      }

      await writeFlacTags(
        {
          tagMap,
          picture: coverBuffer
            ? {
                buffer: coverBuffer,
                pictureType: PictureType.FrontCover,
                mime: this.getMimeType(coverBuffer),
                description: "Cover"
              }
            : undefined
        },
        filePath
      );

      logger.info(`FLAC标签写入成功: ${filePath}`);
    } catch (error) {
      throw new Error(`FLAC标签写入失败: ${(error as Error).message}`);
    }
  }

  // 新增MIME类型检测方法
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
}
