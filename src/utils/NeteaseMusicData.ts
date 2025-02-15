import { MusicTagInfo } from "./MusicTag";
import Logger from "./Logger";
const logger = new Logger("NeteaseAPI");

const API_BASE = "http://localhost:3000"; // 假设本地启动API服务

export default class NeteaseMusicData {
  // 获取音乐标签
  static async getMusicTags(keyword: string): Promise<MusicTagInfo> {
    logger.debug(`开始搜索网易云数据: ${keyword}`);
    // 搜索歌曲
    const songs = await this.search(keyword);
    // 取第一条
    const song = songs[0] as any;
    // 获取歌词
    const lyrics = await this.getLyric(song.id);
    logger.debug(`获取到歌曲数据: ${song.name}`);
    return {
      title: song.name,
      artists: song.ar.map((a: any) => a.name),
      albumArtists: song.ar.map((a: any) => a.name),
      album: song.al.name,
      year: new Date(song.publishTime).getFullYear(),
      diskNumber: Number(song.cd),
      trackNumber: Number(song.no),
      genres: [],
      comment: "",
      lyrics,
      cover: song.al.picUrl
    };
  }

  // 搜索歌曲
  static async search(keyword: string): Promise<object[]> {
    try {
      const response = await fetch(`${API_BASE}/cloudsearch?keywords=${encodeURIComponent(keyword)}&type=1`);
      const data = await response.json();
      return data.result.songs.filter((song: any) => [0, 1].includes(song.originCoverType));
    } catch (error) {
      logger.error(`搜索失败: ${(error as Error).message}`);
      throw new Error(`搜索失败: ${(error as Error).message}`);
    }
  }

  // 获取歌词
  static async getLyric(id: number): Promise<string> {
    const response = await fetch(`${API_BASE}/lyric?id=${id}`);
    const data = await response.json();
    return data.lrc?.lyric;
  }
}
