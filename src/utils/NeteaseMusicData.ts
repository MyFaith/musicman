import { MusicTagInfo } from "./MusicTag";

const API_BASE = "http://localhost:3000"; // 假设本地启动API服务

export default class MusicData {
  // 获取音乐标签
  static async getMusicTags(keyword: string): Promise<MusicTagInfo> {
    const songs = await this.search(keyword);
    const detail = await this.getDetail(songs);
    return detail;
  }

  // 搜索歌曲
  static async search(keyword: string): Promise<number[]> {
    try {
      const response = await fetch(`${API_BASE}/search?keywords=${encodeURIComponent(keyword)}&type=1`);
      const data = await response.json();
      // 返回前3条的id
      return data.result.songs.slice(0, 3).map((song: any) => song.id);
    } catch (error) {
      throw new Error(`[NeteaseMusicData] 搜索失败: ${(error as Error).message}`);
    }
  }

  // 获取歌曲详情（包含播放链接和歌词）
  static async getDetail(id: number[]): Promise<MusicTagInfo> {
    try {
      // 获取基础信息
      const detailRes = await fetch(`${API_BASE}/song/detail?ids=${id}`);
      const detailData = await detailRes.json();
      // 获取originCoverType不为2的，2=翻唱
      const song = detailData.songs.find((e: any) => e.originCoverType != 2);
      // 获取歌词
      const lyricRes = await fetch(`${API_BASE}/lyric?id=${song.id}`);
      const lyricData = await lyricRes.json();
      // 返回数据
      return {
        title: song.name,
        artists: song.ar.map((a: any) => a.name),
        albumArtists: song.ar.map((a: any) => a.name),
        album: song.al,
        year: new Date(song.publishTime).getFullYear(),
        diskNumber: Number(song.cd),
        trackNumber: Number(song.no),
        genres: [],
        comment: "",
        lyrics: lyricData.lrc?.lyric,
        cover: song.al.picUrl,
      };
    } catch (error) {
      throw new Error(`[NeteaseMusicData] 获取详情失败: ${(error as Error).message}`);
    }
  }
}
