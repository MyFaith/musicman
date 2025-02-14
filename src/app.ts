import AI from "./utils/AI";
import Config from "./utils/Config";

// 初始化配置文件实例
const config = new Config("./config/config.yaml");

// 获取配置
const AI_BASE_URL = config.get("AI.baseUrl");
const AI_API_KEY = config.get("AI.apiKey");
const AI_MODEL_NAME = config.get("AI.modelName");

// 初始化AI实例
const ai = new AI(AI_BASE_URL, AI_API_KEY, AI_MODEL_NAME);

(async () => {})();
