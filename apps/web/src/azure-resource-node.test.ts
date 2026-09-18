import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AzureResourceNode, type AzureHealth } from './AzureResourceNode';
describe('Azure resource presentation', () => {
  it.each(['healthy', 'warning', 'critical', 'offline', 'unknown'] as AzureHealth[])('renders a text alternative for %s', health => {
    const html = renderToStaticMarkup(createElement(AzureResourceNode, { service: 'app-service', instances: 2, health, utilization: null }));
    expect(html).toContain(`data-health="${health}"`);
    expect(html).toContain('Azure App Service'); expect(html).toContain('2 instances');
    expect(html).toContain('Utilization not measured');
  });
  it('uses native buttons for keyboard activation and labels selected and critical states', () => {
    const html = renderToStaticMarkup(createElement(AzureResourceNode, { service: 'sql-database', instances: 1, health: 'critical', utilization: 1.4, selected: true, bottleneck: true, onSelect: () => undefined }));
    expect(html).toContain('<button'); expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('140%'); expect(html).toContain('width:100%'); expect(html).toContain('!! Capacity constraint');
    expect(html).toContain('azure-sql.svg');
  });
  it('does not turn an unsupported service into a selectable gameplay resource', () => {
    const html = renderToStaticMarkup(createElement(AzureResourceNode, { service: 'monitor', instances: 0, health: 'unknown', utilization: null, onSelect: () => undefined }));
    expect(html).toContain('disabled=""'); expect(html).not.toContain('<img');
  });
});
