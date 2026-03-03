import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import * as ReactDOM from 'react-dom/client';
import { configureAmplify } from '@credo/platform-amplify';
import outputs from '../../../amplify_outputs.json';
import App from './app/app';
import { resolveStorefrontBootstrap } from './app/storefront-bootstrap';

configureAmplify(outputs);

const storefront = resolveStorefrontBootstrap();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <BrowserRouter>
      <App clientConfig={storefront.clientConfig} theme={storefront.theme} />
    </BrowserRouter>
  </StrictMode>
);
