import { describe, expect, it, vi } from 'vitest'

vi.mock('ioredis', () => ({
    default: class {
        quit() {}
    },
}))

vi.mock('node-resque', () => ({
    Worker: class {
        on() {}
        connect() {}
        start() {}
    },
}))

const { queueTitles } = await import('~/resque/worker.server')

describe('queueTitles', () => {
    it('derives queue names from REDIS_QUEUE env var', () => {
        expect(queueTitles.schedule.queue).toBe(
            `${process.env.REDIS_QUEUE}-schedule`
        )
        expect(queueTitles.template.queue).toBe(
            `${process.env.REDIS_QUEUE}-template`
        )
    })

    it('exposes schedule and template entries', () => {
        expect(Object.keys(queueTitles).sort()).toEqual([
            'schedule',
            'template',
        ])
    })
})
