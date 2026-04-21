import { beforeEach, describe, expect, it, vi } from 'vitest'

const queueConnect = vi.fn()
const queueEnqueue = vi.fn()
const queueEnd = vi.fn()
const queueLength = vi.fn()
const queueOn = vi.fn()

vi.mock('node-resque', () => ({
    Queue: class {
        connect = queueConnect
        enqueue = queueEnqueue
        end = queueEnd
        length = queueLength
        on = queueOn
    },
    Worker: class {},
    Scheduler: class {},
}))

vi.mock('ioredis', () => ({
    default: class {
        quit() {}
    },
}))

const { resqueTask, getQueueStatus, connectionDetails } = await import(
    '~/resque/main.server'
)

describe('connectionDetails', () => {
    it('reads Redis config from env', () => {
        expect(connectionDetails.pkg).toBe('ioredis')
        expect(connectionDetails.host).toBe(process.env.REDIS_HOST)
        expect(connectionDetails.port).toBe(Number(process.env.REDIS_PORT))
        expect(connectionDetails.username).toBe(process.env.REDIS_USERNAME)
    })
})

describe('resqueTask', () => {
    beforeEach(() => {
        queueConnect.mockReset().mockResolvedValue(undefined)
        queueEnqueue.mockReset().mockResolvedValue(undefined)
        queueEnd.mockReset().mockResolvedValue(undefined)
    })

    it('enqueues a template job on the template queue', async () => {
        await resqueTask({ job: 'template', templateProps: {} })
        expect(queueConnect).toHaveBeenCalledTimes(1)
        expect(queueEnqueue).toHaveBeenCalledTimes(1)
        const [queueName, jobName, args] = queueEnqueue.mock.calls[0]
        expect(queueName).toBe(`${process.env.REDIS_QUEUE}-template`)
        expect(jobName).toBe('template')
        expect(args).toEqual([{}])
        expect(queueEnd).toHaveBeenCalledTimes(1)
    })

    it('calls queue.end() even when enqueue fails', async () => {
        queueEnqueue.mockRejectedValueOnce(new Error('redis down'))
        await expect(
            resqueTask({ job: 'template', templateProps: {} })
        ).rejects.toThrow('redis down')
        expect(queueEnd).toHaveBeenCalledTimes(1)
    })

    it('throws "Invalid job type" when templateProps is missing', async () => {
        await expect(
            resqueTask({ job: 'template' } as any)
        ).rejects.toThrow(/invalid job type/i)
    })
})

describe('getQueueStatus', () => {
    beforeEach(() => {
        queueConnect.mockReset().mockResolvedValue(undefined)
        queueLength.mockReset().mockResolvedValue(5)
        queueEnd.mockReset().mockResolvedValue(undefined)
    })

    it('returns { pending: <length> } for the given queue', async () => {
        const result = await getQueueStatus('my-queue')
        expect(queueConnect).toHaveBeenCalled()
        expect(queueLength).toHaveBeenCalledWith('my-queue')
        expect(result).toEqual({ pending: 5 })
        expect(queueEnd).toHaveBeenCalled()
    })

    it('still closes the queue when length() throws', async () => {
        queueLength.mockRejectedValueOnce(new Error('boom'))
        await expect(getQueueStatus('q')).rejects.toThrow('boom')
        expect(queueEnd).toHaveBeenCalled()
    })
})
