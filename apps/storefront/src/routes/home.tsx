import { RoutePlaceholder } from '@credo/feature';
import { storefront } from '../app/storefront-runtime';

export default function HomeRoute() {
  return (
    <RoutePlaceholder
      title="Home"
      details="Page vitrine publique qui pourra etre prerenderisee pour le SEO."
      theme={storefront.theme}
    />
  );
}
