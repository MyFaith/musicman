import AI from "./utils/AI";
import Config from "./utils/Config";
import { FileWatcher } from "./utils/FileWatcher";

// 初始化配置实例，传入配置文件路径
const configInstance = new Config("config/config.yaml");

// 实例化 FileWatcher 并启动监听
const fileWatcher = new FileWatcher(configInstance.get("directory.source"));
fileWatcher.watch((filePath) => {});

// 初始化AI实例
// const ai = new AI(configInstance.get("AI.baseUrl"), configInstance.get("AI.apiKey"), configInstance.get("AI.modelName"));

(async () => {})();
