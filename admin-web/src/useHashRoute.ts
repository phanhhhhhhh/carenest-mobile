import { useCallback, useEffect, useState } from 'react';

export type Route =
  | 'overview'
  | 'users'
  | 'elderly'
  | 'family-links'
  | 'emergencies'
  | 'check-ins'
  | 'medications'
  | 'health-metrics'
  | 'cameras'
  | 'notifications'
  | 'appointments'
  | 'subscriptions'
  | 'payments';

const ROUTES: Route[] = [
  'overview',
  'users',
  'elderly',
  'family-links',
  'emergencies',
  'check-ins',
  'medications',
  'health-metrics',
  'cameras',
  'notifications',
  'appointments',
  'subscriptions',
  'payments',
];

function parse(): Route {
  const h = window.location.hash.replace(/^#\/?/, '');
  return (ROUTES as string[]).includes(h) ? (h as Route) : 'overview';
}

export function useHashRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(parse);

  useEffect(() => {
    const onChange = () => setRoute(parse());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((r: Route) => {
    window.location.hash = `#/${r}`;
  }, []);

  return [route, navigate];
}
