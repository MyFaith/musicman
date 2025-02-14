import AI from "./utils/AI";
import Config from "./utils/Config";
import FileWatcher from "./utils/FileWatcher";
import MusicTag, { MusicTagInfo } from "./utils/MusicTag";
import NeteaseMusicData from "./utils/NeteaseMusicData";
import Logger from "./utils/Logger";

// 初始化配置实例，传入配置文件路径
const configInstance = new Config("config/config.yaml");

// 初始化AI实例
const ai = new AI(
  configInstance.get<string>("AI.baseUrl") ?? "",
  configInstance.get<string>("AI.apiKey") ?? "",
  configInstance.get<string>("AI.modelName") ?? ""
);

// 实例化 FileWatcher 并启动监听
const fileWatcher = new FileWatcher(configInstance.get<string>("directory.source") ?? "");
fileWatcher.watch(async (filePath) => {
  try {
    const musicTag = await MusicTag.read(filePath);
    const keyword = await getSearchKeywords(musicTag, filePath);
    if (!keyword) {
      logger.error(`未获取到搜索关键词: ${filePath}`);
      return;
    }
    const neteaseMusicTagInfo = await NeteaseMusicData.getMusicTags(keyword);
    await MusicTag.format(filePath, neteaseMusicTagInfo);
    logger.info(`文件处理完成: ${filePath}`);
  } catch (error) {
    logger.error(`文件处理流程异常: ${filePath}`);
  }
});

// 获取搜索关键词
async function getSearchKeywords(musicTag: MusicTagInfo, filePath?: string): Promise<string> {
  const keyword = [];

  // 先通过音乐标签获取关键词
  if (musicTag.title) keyword.push(musicTag.title);
  if (musicTag.artists) keyword.push(musicTag.artists?.[0]);

  // 如果音乐标签没获取到，则通过文件路径获取关键词
  if (keyword.length < 2) {
    const result = await ai.chat(`请根据我提供给你的音乐文件路径，尽可能的识别出音乐名称、艺术家、专辑名称等信息。
我将要用你返回给我的字符串当做搜索关键词，提高搜索成功率，不要带后缀名。
应按照音乐名称、艺术家、专辑名称的顺序返回，避免搜索到专辑同名歌曲。
请直接返回我要求的格式，不要附带任何多余的信息。
文件路径：${filePath}`);
    return result ?? "";
  }

  return keyword.join(",");
}

const logger = new Logger("Main");

// 替换启动日志：
logger.info(`Application started - version: ${process.env.npm_package_version}`);
