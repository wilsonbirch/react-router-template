import { describe, expect, it } from 'vitest'
import { jobs } from '~/resque/jobs.server'

describe('jobs.templateJob', () => {
    it('exposes a templateJob with a perform function', () => {
        expect(jobs.templateJob).toBeDefined()
        expect(typeof jobs.templateJob.perform).toBe('function')
    })

    it('resolves to an empty object', async () => {
        const result = await jobs.templateJob.perform({})
        expect(result).toEqual({})
    })
})
