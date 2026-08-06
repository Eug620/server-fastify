import { join } from 'node:path'
import AutoLoad from '@fastify/autoload'
import Fastify from 'fastify'
import { config } from './config'

const app = Fastify({
  logger: config.logger,
  bodyLimit: config.bodyLimit,
  trustProxy: config.trustProxy,
  requestTimeout: config.requestTimeout,
})

app.register(AutoLoad, {
  dir: join(__dirname, 'plugins'),
})

app.register(AutoLoad, {
  dir: join(__dirname, 'routes'),
})

const start = async () => {
  try {
    await app.listen({ port: config.port, host: config.host })
    if (process.send) {
      process.send('ready')
    }
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

const shutdown = async (signal: string) => {
  app.log.info(`Received ${signal}, closing...`)
  try {
    await app.close()
    process.exit(0)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

start()

export { app }
export default app