import { configureAmplify } from '@credo/platform-amplify';
import outputs from '../../../../amplify_outputs.json';
import { resolveStorefrontBootstrap } from './storefront-bootstrap';

// Route loaders may run before the parent layout mounts.
configureAmplify(outputs);

export const storefront = resolveStorefrontBootstrap();
