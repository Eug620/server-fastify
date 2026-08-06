import fp from 'fastify-plugin'
import multipart from '@fastify/multipart'

/**
 * 文件上传插件
 * 限制单文件 10MB，仅允许图片类型
 */
export default fp(async (fastify) => {
  fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024,  // 10MB
      files: 1,                     // 单次上传 1 个文件
    }
  })
})
