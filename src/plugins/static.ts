import { join } from 'node:path'
import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import fastifyStatic from '@fastify/static'

/**
 * 静态文件服务插件
 * 将项目根目录下的 public 目录作为静态资源根目录
 * 编译后位于 dist/plugins/static.js，向上两级即为项目根目录
 */
const staticPlugin: FastifyPluginAsync = async (fastify) => {
  // 静态文件根目录：<项目根目录>/public
  const rootDir = join(__dirname, '..', '..', 'public')

  await fastify.register(fastifyStatic, {
    root: rootDir,
    prefix: '/',
    index: ['index.html'],      // 默认访问 index.html
    decorateReply: true,         // 添加 reply.sendFile 方法
  })

  // 处理所有未匹配的路由
  fastify.setNotFoundHandler((request, reply) => {
    // API 请求返回标准 JSON 错误格式
    if (request.url.startsWith('/api')) {
      reply.code(404)
      return { code: 1, message: 'Not Found', data: null }
    }
    // 其他请求返回 index.html（支持前端路由）
    return reply.sendFile('index.html')
  })
}

// 使用 fp 包装确保在其他插件之前加载
export default fp(staticPlugin, {
  name: 'static'
})
