import fp from 'fastify-plugin'
import cors from '@fastify/cors'
import { config } from '../config'

/**
 * CORS 跨域插件
 */
export default fp(async (fastify) => {
  fastify.register(cors, config.cors)
})
