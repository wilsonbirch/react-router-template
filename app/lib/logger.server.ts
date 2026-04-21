enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
}

const LOG_LEVEL_PRIORITY = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
}

class Logger {
    private minLogLevel: LogLevel

    constructor() {
        const envLogLevel = process.env.LOG_LEVEL as LogLevel
        this.minLogLevel = envLogLevel || LogLevel.INFO
    }

    private shouldLog(level: LogLevel): boolean {
        return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.minLogLevel]
    }

    private formatTimestamp(): string {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const hours = String(now.getHours()).padStart(2, '0')
        const minutes = String(now.getMinutes()).padStart(2, '0')
        const seconds = String(now.getSeconds()).padStart(2, '0')
        const milliseconds = String(now.getMilliseconds()).padStart(3, '0')

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds},${milliseconds}`
    }

    private formatModuleName(filename: string): string {
        return filename
            .replace(/\.[^/.]+$/, '')
            .replace(/[/\\]/g, '.')
            .replace(/^\.+|\.+$/g, '')
    }

    private log(level: LogLevel, filename: string, message?: string): void {
        if (!this.shouldLog(level)) return

        const moduleName = this.formatModuleName(filename)
        const messageText = message || 'NO MESSAGE INCLUDED'

        if (process.env.NODE_ENV === 'production') {
            console.log(`${moduleName} - ${level} - ${messageText}`)
        } else {
            const timestamp = this.formatTimestamp()
            console.log(
                `${timestamp} - ${moduleName} - ${level} - ${messageText}`
            )
        }
    }

    info(filename: string, message?: string): void {
        this.log(LogLevel.INFO, filename, message)
    }

    error(filename: string, message?: string): void {
        this.log(LogLevel.ERROR, filename, message)
    }

    warn(filename: string, message?: string): void {
        this.log(LogLevel.WARN, filename, message)
    }

    debug(filename: string, message?: string): void {
        this.log(LogLevel.DEBUG, filename, message)
    }
}

export const logger = new Logger()
