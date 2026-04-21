import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

process.env.SESSION_SECRET ??= 'test-session-secret'
process.env.APP_SECRET ??= 'test-app-secret'
process.env.REDIS_QUEUE ??= 'test-queue'
process.env.REDIS_HOST ??= 'localhost'
process.env.REDIS_PORT ??= '6379'
process.env.REDIS_USERNAME ??= 'default'
process.env.REDIS_PASSWORD ??= ''

afterEach(() => {
    cleanup()
})
