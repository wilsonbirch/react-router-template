import { createReadableStreamFromReadable } from '@react-router/node'
import { isbot } from 'isbot'
import { PassThrough } from 'node:stream'
import { renderToPipeableStream } from 'react-dom/server'
import { ServerRouter } from 'react-router'
import { logger } from '~/lib/logger.server'

import type { EntryContext } from 'react-router'

const ABORT_DELAY = 5000
const fileName = 'entry.server'

export default async function handleRequest(
    request: Request,
    responseStatusCode: number,
    responseHeaders: Headers,
    routerContext: EntryContext
) {
    const userAgent = request.headers.get('user-agent')
    const callbackName = isbot(userAgent ?? '') ? 'onAllReady' : 'onShellReady'

    return new Promise((resolve, reject) => {
        const { pipe, abort } = renderToPipeableStream(
            <ServerRouter context={routerContext} url={request.url} />,
            {
                [callbackName]: () => {
                    const body = new PassThrough()
                    const stream = createReadableStreamFromReadable(body)

                    responseHeaders.set('Content-Type', 'text/html')
                    resolve(
                        new Response(stream, {
                            headers: responseHeaders,
                            status: responseStatusCode,
                        })
                    )
                    pipe(body)
                },
                onShellError(error) {
                    reject(error)
                },
                onError(error) {
                    responseStatusCode = 500
                    const message =
                        error instanceof Error ? error.message : String(error)
                    logger.error(
                        fileName,
                        `render error url:${request.url} error:${message}`
                    )
                },
            }
        )

        setTimeout(abort, ABORT_DELAY)
    })
}
