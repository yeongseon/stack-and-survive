import { expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { serviceIcons } from './service-icons';
import { ServiceIcon } from './ServiceIcon';

it('maps only the four services and explains the edge abstraction', () => {
  expect(Object.keys(serviceIcons)).toEqual(['compute', 'database', 'cache', 'edge']);
  expect(serviceIcons.cache!.src).toBe('/assets/azure-icons/managed-redis.svg');
  expect(serviceIcons.edge!.context).toContain('not a separate Azure product');
  expect(serviceIcons.internet).toBeUndefined();
});
it('uses external unchanged images rather than redrawing icon SVGs', () => {
  const markup = renderToStaticMarkup(createElement(ServiceIcon, { kind: 'cache' }));
  expect(markup).toContain('alt="Azure Managed Redis"');
  expect(markup).toContain('src="/assets/azure-icons/managed-redis.svg"');
  expect(markup).not.toContain('<svg');
  expect(renderToStaticMarkup(createElement(ServiceIcon, { kind: 'internet' }))).toBe('');
});
it('does not duplicate adjacent service names in button accessibility names', () => {
  const markup = renderToStaticMarkup(createElement(ServiceIcon, { kind: 'compute', decorative: true }));
  expect(markup).toContain('aria-hidden="true"'); expect(markup).toContain('alt=""');
});
