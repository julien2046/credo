import App from '../app/app';
import { storefront } from '../app/storefront-runtime';

export default function StorefrontShellRoute() {
  return (
    <App clientConfig={storefront.clientConfig} theme={storefront.theme} />
  );
}
