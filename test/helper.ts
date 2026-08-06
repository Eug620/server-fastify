import { join } from 'node:path'
import * as test from 'node:test'
import Fastify from 'fastify'
import AutoLoad from '@fastify/autoload'

export type TestContext = {
  after: typeof test.after
}

function config () {
  return {
    skipOverride: true
  }
}

async function build (t: TestContext) {
  const app = Fastify({
    logger: false,
  })

  app.register(AutoLoad, {
    dir: join(__dirname, '..', 'src', 'plugins'),
  })

  app.register(AutoLoad, {
    dir: join(__dirname, '..', 'src', 'routes'),
  })

  await app.ready()

  t.after(() => void app.close())

  return app
}

export {
  config,
  build
}