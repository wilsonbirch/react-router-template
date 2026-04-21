import { Queue, Scheduler } from 'node-resque'
import * as schedule from 'node-schedule'
import { jobs } from '~/resque/jobs.server'
import { logger } from '~/lib/logger.server'
import { connectionDetails } from '~/resque/main.server'
import { queueTitles } from '~/resque/worker.server'

const fileName = 'resque/scheduler.server'
export async function nodeScheduler() {
    // ////////////////////////
    //        SCHEDULER      //
    // ////////////////////////

    const scheduler = new Scheduler({ connection: connectionDetails })
    await scheduler.connect()
    scheduler.start()

    scheduler.on('start', () => {
        logger.info(fileName, 'scheduler started')
    })
    scheduler.on('end', () => {
        logger.info(fileName, 'scheduler ended')
    })
    scheduler.on('poll', () => {
        logger.debug(fileName, 'scheduler polling')
    })
    scheduler.on('leader', () => {
        logger.info(fileName, 'scheduler became leader')
    })
    scheduler.on('error', (error) => {
        logger.error(fileName, `scheduler error error:${error}`)
    })
    scheduler.on('cleanStuckWorker', (workerName, errorPayload, delta) => {
        logger.warn(
            fileName,
            `stuck worker worker:${workerName} stuckSec:${delta} payload:${JSON.stringify(
                errorPayload
            )}`
        )
    })
    scheduler.on('workingTimestamp', (timestamp) => {
        logger.debug(fileName, `working timestamp:${timestamp}`)
    })
    scheduler.on('transferredJob', (timestamp, job) => {
        logger.info(
            fileName,
            `transferred timestamp:${timestamp} job:${JSON.stringify(job)}`
        )
    })

    // //////////////
    // DEFINE JOBS //
    // //////////////

    const queue = new Queue({ connection: connectionDetails }, jobs)
    queue.on('error', function (error) {
        logger.error(fileName, `queue error error:${error}`)
    })
    await queue.connect()

    // const tenAfterMidnight = new schedule.RecurrenceRule()
    // tenAfterMidnight.hour = 0
    // tenAfterMidnight.minute = 10
    // tenAfterMidnight.tz = 'Etc/UTC'

    // const firstOfTheMonth = new schedule.RecurrenceRule()
    // firstOfTheMonth.hour = 0
    // firstOfTheMonth.minute = 1
    // firstOfTheMonth.date = 1
    // firstOfTheMonth.tz = 'Etc/UTC'

    // const everyHour = new schedule.RecurrenceRule()
    // everyHour.minute = 1
    // everyHour.tz = 'Etc/UTC'

    const everySunday = new schedule.RecurrenceRule()
    everySunday.dayOfWeek = 0 // This will run every Sunday
    everySunday.hour = 20 // At 8pm (20:00)
    everySunday.minute = 0 // At 10 minutes past midnight
    everySunday.tz = 'Etc/UTC' // In UTC timezone

    // const test = new schedule.RecurrenceRule()
    // test.hour = 22
    // test.minute = 14
    // test.tz = 'Canada/Eastern'
    // logger.info(Object.keys(schedule.scheduledJobs)[0])
    // logger.info(schedule.scheduledJobs[Object.keys(schedule.scheduledJobs)[0]].nextInvocation())

    schedule.scheduleJob(everySunday, async () => {
        if (scheduler.leader) {
            logger.info(
                fileName,
                `enqueue scheduled queue:${queueTitles.schedule.queue}`
            )
            await queue.enqueue(queueTitles.schedule.queue, '{}', [])
        }
    })

    const shutdown = async () => {
        await scheduler.end()
        logger.info(fileName, 'scheduler shutdown')
        process.exit()
    }

    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)
}
