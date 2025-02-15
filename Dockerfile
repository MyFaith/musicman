# 使用官方Node.js Alpine镜像
FROM node:20-alpine

# 安装系统依赖（node-taglib-sharp需要）
RUN apk add --no-cache \
  python3 \
  make \
  g++ \
  libgcc \
  libstdc++

RUN npm -g install tsx

# 设置工作目录
WORKDIR /app
COPY . .

# 暴露目录与配置文件
VOLUME [ "/music/source", "/music/target", "/app/config" ]

# 设置非root用户
RUN chown -R node:node /app
USER node

# 启动应用
CMD ["npm", "start"] 