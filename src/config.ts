/**
 * 应用配置 - 常规 Fastify 项目写法
 * 直接在此处配置，无环境变量依赖
 */
export const config = {
  // 服务端口
  port: 3030,

  // 监听地址
  host: '0.0.0.0',

  // 日志配置
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: { colorize: true }
    }
  },

  // CORS
  cors: {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  },

  // Fastify 服务器选项
  bodyLimit: 1048576,
  trustProxy: true,
  requestTimeout: 0,
}

export type AppConfig = typeof config
