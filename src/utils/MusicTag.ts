import { parseFile, type IAudioMetadata } from "music-metadata";

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

export class MusicTag {
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
      cover: metadata.common.picture?.[0]?.data.toString("base64")
    };
  }
}
