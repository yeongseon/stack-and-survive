import type { Architecture } from '@stack-and-survive/schema';

export const azureLearn = {
  App: { title: 'Azure App Service', url: 'https://learn.microsoft.com/en-us/azure/app-service/overview' },
  SQL: { title: 'Azure SQL Database', url: 'https://learn.microsoft.com/en-us/azure/azure-sql/database/sql-database-paas-overview?view=azuresql' },
  Cache: { title: 'Azure Managed Redis', url: 'https://learn.microsoft.com/en-us/azure/redis/overview' },
  'Protected Edge': { title: 'Azure Application Gateway', url: 'https://learn.microsoft.com/en-us/azure/application-gateway/overview' },
} as const;
export const bicepLearnUrl = 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/overview';
export function architectureLearnResources(architecture: Architecture): (keyof typeof azureLearn)[] {
  const resources: (keyof typeof azureLearn)[] = [];
  for (const [kind, resource] of [['compute', 'App'], ['database', 'SQL'], ['cache', 'Cache'], ['edge', 'Protected Edge']] as const) {
    if (architecture.resources.some(item => item.kind === kind)) resources.push(resource);
  }
  return resources;
}
