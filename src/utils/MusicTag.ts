import { parseFile, type IAudioMetadata } from "music-metadata";
import NodeID3 from "node-id3";

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
  }

  // 整理音乐标签
  static async format(filePath: string, newTag: MusicTagInfo) {
    const fileType = filePath.split(".").pop();
    if (fileType === "mp3") {
      // 写入MP3文件标签
      await this.writeMP3(filePath, newTag);
    } else if (fileType === "flac") {
      // 写入FLAC文件标签
    }
  }

  // 新增独立MP3写入方法
  static async writeMP3(filePath: string, tagInfo: MusicTagInfo): Promise<void> {
    try {
      // 新增：处理图片URL
      let imageBuffer: Buffer | undefined;
      if (tagInfo.cover) {
        // 判断是否是URL
        if (tagInfo.cover.startsWith('http')) {
          const response = await fetch(tagInfo.cover);
          const arrayBuffer = await response.arrayBuffer();
          imageBuffer = Buffer.from(arrayBuffer);
        } else {
          // 假设是base64字符串
          imageBuffer = Buffer.from(tagInfo.cover, 'base64');
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
        image: imageBuffer ? {
          mime: this.getMimeType(imageBuffer),
          type: { id: 3, name: "Cover" },
          description: "Cover",
          imageBuffer
        } : undefined
      };

      const success = NodeID3.write(tags, filePath);
      if (success) {
        console.log(`[MusicTag] ${tagInfo.title} MP3标签写入成功`);
      } else {
        throw new Error(`[MusicTag] ${tagInfo.title} MP3标签写入失败`);
      }
    } catch (error) {
      throw new Error(`[MusicTag] 图片处理失败: ${(error as Error).message}`);
    }
  }

  // 新增MIME类型检测方法
  private static getMimeType(buffer: Buffer): string {
    const signature = buffer.toString('hex', 0, 4);
    switch (signature) {
      case 'ffd8ffe0':
      case 'ffd8ffdb':
      case 'ffd8ffee':
        return 'image/jpeg';
      case '89504e47':
        return 'image/png';
      case '47494638':
        return 'image/gif';
      default:
        return 'application/octet-stream';
    }
  }
}
