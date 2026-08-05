import { join } from 'node:path'
import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload'
import { FastifyPluginAsync, FastifyServerOptions } from 'fastify'
import { config } from './config'

export interface AppOptions extends FastifyServerOptions, Partial<AutoloadPluginOptions> {
  port?: number | string
  host?: string
}

const options: AppOptions = {
  port: config.port,
  host: config.host,
  logger: config.logger,
  bodyLimit: config.bodyLimit,
  trustProxy: config.trustProxy,
  requestTimeout: config.requestTimeout,
}

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts
): Promise<void> => {
  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    options: opts
  })

  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
    options: opts
  })
}

export default app
export { app, options }
