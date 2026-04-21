import { Queue } from 'node-resque'
import { jobs } from '~/resque/jobs.server'
import { logger } from '~/lib/logger.server'
import { queueTitles } from '~/resque/worker.server'

export type ResqueTaskInput = {
    job: 'template'
    templateProps?: TemplateJobProps
}

export type TemplateJobProps = {}

export const connectionDetails = {
    pkg: 'ioredis',
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
    port: Number(process.env.REDIS_PORT),
    username: process.env.REDIS_USERNAME,
    database: 0,
}

const fileName = 'resque/main.server'

export async function resqueTask({ job, templateProps }: ResqueTaskInput) {
    const jobDetails = {
        template: {
            queue: queueTitles['template'].queue,
            props: templateProps,
        },
    }
    const props = jobDetails[job].props
    const queueTitle = jobDetails[job].queue

    if (!queueTitle || !props) {
        throw new Error('Invalid job type')
    }

    const redisQueue = new Queue({ connection: connectionDetails }, jobs)

    redisQueue.on('error', function (error) {
        logger.error(fileName, `queue error job:${job} error:${error}`)
    })
    try {
        await redisQueue.connect()
        logger.info(fileName, `START enqueue job:${job} queue:${queueTitle}`)
        await redisQueue.enqueue(queueTitle, job, [props])
        logger.info(fileName, `END enqueue job:${job} queue:${queueTitle}`)
    } catch (error) {
        logger.error(
            fileName,
            `END enqueue job:${job} queue:${queueTitle} error:${error}`
        )
        throw error
    } finally {
        await redisQueue.end()
    }
}

// Helper function to check queue status
export async function getQueueStatus(queueName: string) {
    const redisQueue = new Queue({ connection: connectionDetails }, jobs)

    try {
        await redisQueue.connect()
        const queueLength = await redisQueue.length(queueName)
        logger.info(fileName, `queue status queue:${queueName} pending:${queueLength}`)
        return { pending: queueLength }
    } finally {
        await redisQueue.end()
    }
}
