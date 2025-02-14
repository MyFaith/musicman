export interface QQSong {
  mid: string;
  title: string;
  singers: Array<{
    mid: string;
    name: string;
  }>;
  album: {
    mid: string;
    name: string;
  };
  duration: number;
  file?: {
    url: string;
    format: 'flac' | 'mp3';
  };
}

export default class QQMusicData {
  static async search(keyword: string): Promise<QQSong[]> {
    // TODO: 实现QQ音乐搜索
    return [];
  }
} 