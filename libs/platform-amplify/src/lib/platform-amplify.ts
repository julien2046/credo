import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';

type AmplifyConfigInput = Parameters<typeof Amplify.configure>[0];

let isConfigured = false;

export function configureAmplify(config: AmplifyConfigInput) {
  if (isConfigured) return;

  Amplify.configure(config);
  isConfigured = true;
}

// Keep the client untyped for now; we'll add shared schema typing once data-access
// libs are in place and we want stronger boundaries.
export const dataClient = generateClient();
