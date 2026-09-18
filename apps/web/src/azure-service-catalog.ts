import { serviceIcons } from './service-icons';
export type AzureResourceCategory = 'edge' | 'compute' | 'data' | 'cache' | 'operations';
export type AzureServiceId = 'app-service' | 'sql-database' | 'managed-redis' | 'protected-edge' | 'front-door' | 'waf' | 'monitor' | 'application-insights';
export interface AzureServiceDefinition {
  id: AzureServiceId; name: string; category: AzureResourceCategory; role: string;
  icon?: string; fallback: string; playable: boolean; scope: string;
}
export const azureServices: Record<AzureServiceId, AzureServiceDefinition> = {
  'app-service': { id: 'app-service', name: 'Azure App Service', category: 'compute', role: 'Application tier · processes incoming requests.', icon: serviceIcons.compute!.src, fallback: 'APP', playable: true, scope: 'Scale out using existing App bays; activation is delayed.' },
  'sql-database': { id: 'sql-database', name: 'Azure SQL Database', category: 'data', role: 'Data tier · handles reads and order writes.', icon: serviceIcons.database!.src, fallback: 'SQL', playable: true, scope: 'SQL tiers increase read/write capacity. Read replicas add reads only; costs and activation delays apply.' },
  'managed-redis': { id: 'managed-redis', name: 'Azure Managed Redis', category: 'cache', role: 'Read cache · serves eligible reads before SQL.', icon: serviceIcons.cache!.src, fallback: 'CACHE', playable: true, scope: 'Order writes still require SQL.' },
  'protected-edge': { id: 'protected-edge', name: 'Azure Application Gateway', category: 'edge', role: 'Protected Edge / WAF · filters malicious ingress.', icon: serviceIcons.edge!.src, fallback: 'EDGE', playable: true, scope: 'Existing combined game abstraction with WAF, not a separate gateway action. Filtering can reject customers.' },
  'front-door': { id: 'front-door', name: 'Azure Front Door', category: 'edge', role: 'Global application delivery and edge routing.', fallback: 'EDGE', playable: false, scope: 'Concept only · not simulated or deployable here. Official icon pending usage review.' },
  waf: { id: 'waf', name: 'Azure Web Application Firewall', category: 'edge', role: 'Web application protection.', fallback: 'WAF', playable: false, scope: 'Represented within Protected Edge, not a separate resource. Official icon pending usage review.' },
  monitor: { id: 'monitor', name: 'Azure Monitor', category: 'operations', role: 'Observability across cloud resources.', fallback: 'OPS', playable: false, scope: 'Concept only · no Azure Monitor telemetry connection. Official icon pending usage review.' },
  'application-insights': { id: 'application-insights', name: 'Application Insights', category: 'operations', role: 'Application performance investigation.', fallback: 'APM', playable: false, scope: 'Concept only · not deployed or simulated. Official icon pending usage review.' },
};
export const playableAzureServices: AzureServiceId[] = ['app-service', 'sql-database', 'managed-redis', 'protected-edge'];
