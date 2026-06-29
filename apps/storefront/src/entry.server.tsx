import type { EntryContext, RouterContextProvider } from 'react-router';
import { ServerRouter } from 'react-router';
import { renderToString } from 'react-dom/server';

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

  const markup = renderToString(
    <ServerRouter context={routerContext} url={request.url} />
  );

  responseHeaders.set('Content-Type', 'text/html');

  return new Response(`<!DOCTYPE html>${markup}`, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
