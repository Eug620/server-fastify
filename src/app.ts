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
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

const isMain = process.argv[1]?.match(/app\.(js|ts)$/) ?? false

if (isMain) {
  start()
}

export { app }
export default app