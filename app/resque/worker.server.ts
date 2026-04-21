import Redis from 'ioredis'
import { Worker } from 'node-resque'
import { jobs } from '~/resque/jobs.server'
import { logger } from '~/lib/logger.server'
import { connectionDetails } from '~/resque/main.server'

export type InitWorkerProps = {
    schedule: boolean
}

export const queueTitles = {
    schedule: {
        queue: `${process.env.REDIS_QUEUE}-schedule`,
    },
    template: {
        queue: `${process.env.REDIS_QUEUE}-template`,
    },
}

const globalWorkerRegistry: Record<string, Worker> = {}
const WORKER_TIMEOUT = 300000 // 300 seconds
const fileName = 'resque/worker.server'

async function cleanupStaleWorkers(queueName: string) {
    try {
        const redis = new Redis(connectionDetails.host)

        // Only clean up workers that have been inactive for more than WORKER_TIMEOUT
        const cutoffTime = Date.now() - WORKER_TIMEOUT

        // Get all workers and check their last activity
        const workers = await redis.smembers('resque:workers')
        const staleWorkers = []

        for (const workerName of workers) {
            if (workerName.includes(`:${queueName}`)) {
                const workerKey = `resque:worker:${workerName}`
                const lastSeen = await redis.get(`${workerKey}:started`)

                if (!lastSeen || parseInt(lastSeen) < cutoffTime) {
                    staleWorkers.push(workerName)
                    await redis.del(workerKey)
                    await redis.del(`${workerKey}:started`)
                }
            }
        }

        if (staleWorkers.length > 0) {
            await redis.srem('resque:workers', ...staleWorkers)
            logger.info(
                fileName,
                `cleaned stale workers queue:${queueName} count:${staleWorkers.length}`
            )
        }

        await redis.quit()
    } catch (error) {
        logger.error(
            fileName,
            `cleanupStaleWorkers failed queue:${queueName} error:${error}`
        )
    }
}

export const initWorker = async ({ schedule }: InitWorkerProps) => {
    const activeWorkers: Worker[] = []

    const queues: InitWorkerProps = { schedule }

    for (const [jobType, isEnabled] of Object.entries(queues)) {
        if (isEnabled) {
            const queueTitle =
                queueTitles[jobType as keyof typeof queueTitles]?.queue

            if (!queueTitle) {
                logger.warn(fileName, `invalid jobType:${jobType}`)
                continue
            }

            // Check if worker already exists
            if (globalWorkerRegistry[queueTitle]) {
                logger.info(
                    fileName,
                    `worker already exists queue:${queueTitle}`
                )
                activeWorkers.push(globalWorkerRegistry[queueTitle])
                continue
            }

            // Clean up stale workers before starting new one
            await cleanupStaleWorkers(queueTitle)

            const worker = new Worker(
                {
                    connection: connectionDetails,
                    queues: [queueTitle],
                    timeout: WORKER_TIMEOUT,
                    looping: true,
                    name: `${process.env.NODE_ENV}-${jobType}-${
                        process.pid
                    }-${Date.now()}`,
                },
                jobs
            )

            worker.on('start', () => {
                logger.info(fileName, `worker started queue:${queueTitle}`)
            })

            worker.on('end', async () => {
                logger.info(fileName, `worker ended queue:${queueTitle}`)

                // Clean up registry
                if (globalWorkerRegistry[queueTitle] === worker) {
                    delete globalWorkerRegistry[queueTitle]
                }

                const index = activeWorkers.indexOf(worker)
                if (index !== -1) {
                    activeWorkers.splice(index, 1)
                }
            })

            worker.on('success', (queue, job, result, duration) => {
                logger.info(
                    fileName,
                    `job success queue:${queue} class:${job.class} ms:${duration}`
                )
            })

            worker.on('failure', (queue, job, failure, duration) => {
                logger.error(
                    fileName,
                    `job failure queue:${queue} class:${job.class} ms:${duration} error:${failure}`
                )
            })

            worker.on('error', (error, queue, job) => {
                logger.error(
                    fileName,
                    `worker error queue:${queue} class:${
                        job?.class || 'unknown'
                    } error:${error}`
                )
            })

            worker.on('poll', (queue) => {
                logger.debug(fileName, `worker polling queue:${queue}`)
            })

            try {
                await worker.connect()
                await worker.start()

                const isConnected = worker.connection.connected
                logger.info(
                    fileName,
                    `worker initialized queue:${queueTitle} connected:${isConnected}`
                )

                activeWorkers.push(worker)
                globalWorkerRegistry[queueTitle] = worker

                // Verify queue depth after startup
                setTimeout(async () => {
                    try {
                        const redis = new Redis(connectionDetails.host)
                        const queueLength = await redis.llen(
                            `resque:queue:${queueTitle}`
                        )
                        logger.info(
                            fileName,
                            `queue depth queue:${queueTitle} pending:${queueLength}`
                        )
                        await redis.quit()
                    } catch (error) {
                        logger.error(
                            fileName,
                            `queue depth check failed queue:${queueTitle} error:${error}`
                        )
                    }
                }, 1000)
            } catch (error) {
                logger.error(
                    fileName,
                    `worker start failed queue:${queueTitle} error:${error}`
                )
            }
        }
    }

    // Set up graceful shutdown
    if (!process.listenerCount('SIGTERM')) {
        process.on('SIGTERM', shutdown)
    }
    if (!process.listenerCount('SIGINT')) {
        process.on('SIGINT', shutdown)
    }

    return activeWorkers
}

async function shutdown() {
    logger.info(
        fileName,
        `shutdown START workers:${Object.keys(globalWorkerRegistry).length}`
    )

    try {
        // Give workers time to finish current jobs
        await Promise.all(
            Object.values(globalWorkerRegistry).map(async (worker) => {
                try {
                    await worker.end()
                } catch (error) {
                    logger.error(
                        fileName,
                        `shutdown worker end failed error:${error}`
                    )
                }
            })
        )

        // Clear registry
        Object.keys(globalWorkerRegistry).forEach(
            (key) => delete globalWorkerRegistry[key]
        )

        logger.info(fileName, 'shutdown END success')
        process.exit(0)
    } catch (error) {
        logger.error(fileName, `shutdown END error:${error}`)
        process.exit(1)
    }
}
