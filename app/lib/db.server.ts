// /* eslint-disable no-var */
import { PrismaClient } from '@prisma/client'
import { logger } from '~/lib/logger.server'

const fileName = 'lib/db.server'

let db: PrismaClient
declare global {
    var __db: PrismaClient | undefined
}

const connect = (client: PrismaClient, env: string) => {
    client
        .$connect()
        .then(() => logger.info(fileName, `prisma connected env:${env}`))
        .catch((e: unknown) => {
            const message = e instanceof Error ? e.message : String(e)
            logger.error(
                fileName,
                `prisma connect failed env:${env} error:${message}`
            )
        })
}

if (process.env.NODE_ENV === 'production') {
    db = new PrismaClient()
    connect(db, 'production')
} else if (process.env.NODE_ENV === 'test' || process.env.CI) {
    // 	 Skip connecting to the database in the test environment or GitHub Actions
    db = new PrismaClient({
        datasources: {
            db: {
                url: 'file:./test.db', // Use an in-memory SQLite database for testing
            },
        },
    })
} else {
    if (!global.__db) {
        global.__db = new PrismaClient()
        connect(global.__db, 'development')
    }
    db = global.__db
}

export * from '@prisma/client'
export { db }
