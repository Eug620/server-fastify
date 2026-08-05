import { FastifyPluginAsync } from 'fastify'

/**
 * 根路由
 * 注：静态文件（包括 index.html）由 plugins/static.ts 处理
 */
const api: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  // 可以在这里添加 API 路由
  fastify.get('/api', async (request) => {
    return { message: 'Hello, World!' }
  })
}

export default api
