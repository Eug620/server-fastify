import { FastifyPluginAsync } from 'fastify'
import { recordStore } from '../data/recordStore'

const records: FastifyPluginAsync = async (fastify): Promise<void> => {
  // GET /api/records?date=MM/DD - 查询记录列表
  fastify.get('/api/records', async (request, reply) => {
    const { date } = request.query as { date?: string }
    const records = await recordStore.list(date)
    return records
  })

  // POST /api/records - 创建新记录
  fastify.post('/api/records', async (request, reply) => {
    const body = request.body as {
      type: 'wn' | 'hs' | 'db' | 'xb' | 'sj'
      ml?: string
      img?: string
      h?: string
      timestamp?: number
    }

    const record = await recordStore.create({
      type: body.type,
      ml: body.ml || '',
      img: body.img || '',
      h: body.h || '',
      timestamp: body.timestamp || Date.now(),
    })

    reply.code(201)
    return record
  })

  // DELETE /api/records/:id - 删除记录
  fastify.delete('/api/records/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const deleted = await recordStore.delete(id)
    if (!deleted) {
      reply.code(404)
      return { error: '记录不存在' }
    }
    reply.code(204)
  })

  // DELETE /api/records - 清空所有记录
  fastify.delete('/api/records', async (request, reply) => {
    await recordStore.clear()
    reply.code(204)
  })
}

export default records
