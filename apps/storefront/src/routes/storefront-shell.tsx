import { configureAmplify } from '@credo/platform-amplify';
import outputs from '../../../../amplify_outputs.json';
import App from '../app/app';
import { resolveStorefrontBootstrap } from '../app/storefront-bootstrap';

configureAmplify(outputs);

const storefront = resolveStorefrontBootstrap();

export default function StorefrontShellRoute() {
  return (
    <App clientConfig={storefront.clientConfig} theme={storefront.theme} />
  );
}
