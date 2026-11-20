import { useEffect, useRef, useState } from 'react';
import { getDataClient, type CheckoutQuote } from '@credo/platform-amplify';
import type { DeliveryDetails } from './delivery-form';

type Estimate = {
  quote: CheckoutQuote;
  details: DeliveryDetails;
  attemptId: string;
};
const options = { authMode: 'apiKey' } as const;
const retryQuote =
  'Le panier a changé ou un article est indisponible. Vérifiez votre panier et refaites l’estimation.';

export function useTestCheckout(cart: string) {
  const version = useRef(0);
  const lock = useRef(false);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [phase, setPhase] = useState<'idle' | 'estimating' | 'paying'>('idle');
  const [error, setError] = useState('');
  useEffect(() => {
    function onReturn(event: PageTransitionEvent) {
      if (event.persisted) {
        lock.current = false;
        reset();
      }
    }
    window.addEventListener('pageshow', onReturn);
    return () => {
      version.current++;
      window.removeEventListener('pageshow', onReturn);
    };
  }, []);

  function reset() {
    version.current = version.current + 1;
    setEstimate(null);
    setError('');
    setPhase('idle');
  }

  async function requestEstimate(details: DeliveryDetails) {
    if (lock.current) return;
    reset();
    const current = version.current;
    setPhase('estimating');
    try {
      const { data, errors } = await getDataClient().queries.quoteCheckout(
        {
          cart,
          postalCode: details.postalCode,
        },
        options
      );
      if (current !== version.current) return;
      if (errors?.length || !data) throw new Error(errors?.[0]?.message);
      setEstimate({ quote: data, details, attemptId: crypto.randomUUID() });
    } catch (e) {
      if (current === version.current)
        setError(
          e instanceof Error && e.message.includes('CART_UNAVAILABLE')
            ? retryQuote
            : 'Estimation indisponible. Réessayez dans un instant.'
        );
    } finally {
      if (current === version.current) setPhase('idle');
    }
  }

  async function pay() {
    if (lock.current || !estimate?.quote.paymentEnabled) return;
    lock.current = true;
    const current = version.current;
    setPhase('paying');
    setError('');
    try {
      const { data, errors } =
        await getDataClient().mutations.startTestCheckout(
          {
            cart,
            delivery: JSON.stringify(estimate.details),
            quoteId: estimate.quote.quoteId,
            attemptId: estimate.attemptId,
          },
          options
        );
      if (current !== version.current) return;
      if (errors?.length || !data?.startsWith('https://checkout.stripe.com/')) {
        throw new Error(errors?.[0]?.message);
      }
      window.location.assign(data);
    } catch (e) {
      if (current !== version.current) return;
      if (
        e instanceof Error &&
        /QUOTE_CHANGED|CART_UNAVAILABLE/.test(e.message)
      ) {
        setEstimate(null);
        setError(retryQuote);
      } else {
        setError(
          'Impossible d’ouvrir Stripe. Vous pouvez réessayer sans vider votre panier.'
        );
      }
      lock.current = false;
      setPhase('idle');
    }
  }
  return { quote: estimate?.quote, phase, error, requestEstimate, pay, reset };
}
