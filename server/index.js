import {reactRouterFastify} from '@mcansh/remix-fastify/react-router'
import {fastify} from 'fastify'
import {default as log} from 'fancy-log';

const {
  LOG_LEVEL: logLevel,
  HOST: host,
  PORT: port,
  NODE_ENV: nodeEnv,
} = process.env

const app = fastify({
  disableRequestLogging: nodeEnv === 'development',
})

app.register(reactRouterFastify)

const startServer = async () => {
  const desiredPort = Number(port)
  const portToUse = 3000

  try {
    const address = await app.listen({port: portToUse, host})
    log.info(`🚀 Server started in ${nodeEnv} mode at ${address}`)
    log.info(`🤖 Log level: "${logLevel}"`)

    if (portToUse !== desiredPort) {
      log.warn(
        `! Port ${desiredPort} is not available, using ${portToUse} instead.`,
      )
    }
  } catch (error) {
    if (error instanceof Error) {
      log.error(error.message)
    }
    process.exit(1)
  }
}

await startServer()