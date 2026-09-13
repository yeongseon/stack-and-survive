import type { Kind } from '@stack-and-survive/schema';
import { assetUrl } from './asset-url';

export const serviceIcons: Partial<Record<Kind, { src: string; name: string; context: string; fallback: string }>> = {
  compute: { src: assetUrl('assets/azure-icons/app-service.svg'), name: 'Azure App Service', context: 'Azure App Service', fallback: 'APP' },
  database: { src: assetUrl('assets/azure-icons/azure-sql.svg'), name: 'Azure SQL Database', context: 'Azure SQL Database', fallback: 'SQL' },
  cache: { src: assetUrl('assets/azure-icons/managed-redis.svg'), name: 'Azure Managed Redis', context: 'Azure Managed Redis', fallback: 'CACHE' },
  edge: { src: assetUrl('assets/azure-icons/application-gateway.svg'), name: 'Azure Application Gateway', context: 'Protected Edge: game abstraction of Azure Application Gateway with WAF; not a separate Azure product.', fallback: 'EDGE' },
};

export function createServiceBadge(kind: Kind): HTMLSpanElement | null {
  const icon = serviceIcons[kind];
  if (!icon) return null;
  const badge = document.createElement('span');
  badge.className = 'service-icon'; badge.title = icon.context; badge.dataset.service = kind;
  const image = document.createElement('img');
  image.src = icon.src; image.alt = icon.name; image.width = 24; image.height = 24;
  image.addEventListener('error', () => {
    badge.textContent = icon.fallback;
    badge.setAttribute('role', 'img');
    badge.setAttribute('aria-label', `${icon.name} — icon unavailable`);
    badge.dataset.fallback = 'true';
  }, { once: true });
  badge.append(image);
  return badge;
}
