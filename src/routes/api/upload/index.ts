import { createWriteStream } from 'node:fs'
import { mkdir, stat } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { randomUUID } from 'node:crypto'
import { FastifyPluginAsync } from 'fastify'

const upload: FastifyPluginAsync = async (fastify): Promise<void> => {
  // POST /api/upload - 文件上传
  fastify.post('/', async (request, reply) => {
    const file = await request.file()
    if (!file) {
      reply.code(400)
      return { code: 1, message: '未找到上传文件', data: null }
    }

    // 校验文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.mimetype)) {
      reply.code(400)
      return { code: 1, message: '仅支持 JPG/PNG/GIF/WebP 格式', data: null }
    }

    // 按日期分目录: public/YYYY-MM-DD
    const now = new Date()
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const uploadDir = join(__dirname, '..', '..', '..', '..', 'public', dateStr)

    await mkdir(uploadDir, { recursive: true })

    // 生成随机文件名
    const ext = extname(file.filename) || `.${file.mimetype.split('/')[1]}`
    const fileName = `${randomUUID()}${ext}`
    const filePath = join(uploadDir, fileName)

    // 写入文件
    const stream = file.file
    const writeStream = createWriteStream(filePath)
    await pipeline(stream, writeStream)

    // 验证文件写入成功
    const stats = await stat(filePath)
    if (stats.size === 0) {
      reply.code(500)
      return { code: 1, message: '文件写入失败', data: null }
    }

    // 返回可访问的 URL 路径
    const url = `/${dateStr}/${fileName}`
    reply.code(201)
    return { code: 0, message: '上传成功', data: { url } }
  })
}

export default upload
