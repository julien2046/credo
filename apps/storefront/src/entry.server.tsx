import { PassThrough } from 'node:stream';
import { createReadableStreamFromReadable } from '@react-router/node';
import type { EntryContext, RouterContextProvider } from 'react-router';
import { ServerRouter } from 'react-router';
import { renderToPipeableStream } from 'react-dom/server';

export const streamTimeout = 5_000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: RouterContextProvider
) {
  if (request.method.toUpperCase() === 'HEAD') {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders,
    });
  }

  return new Promise<Response>((resolve, reject) => {
    const timeout = setTimeout(() => abort(), streamTimeout + 1000);
    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        // SPA HTML must include the deferred hydration data before it is served.
        onAllReady() {
          const body = new PassThrough();
          body.on('close', () => clearTimeout(timeout));
          body.on('finish', () => clearTimeout(timeout));
          responseHeaders.set('Content-Type', 'text/html');

          resolve(
            new Response(createReadableStreamFromReadable(body), {
              status: responseStatusCode,
              headers: responseHeaders,
            })
          );
          pipe(body);
        },
        onShellError(error: unknown) {
          clearTimeout(timeout);
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          console.error(error);
        },
      }
    );
  });
}
