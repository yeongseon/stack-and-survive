import type { ExportRequest } from './export-bicep';
import type { ExportResponse } from './export-bicep-schema';

// Hand-authored offline fixture, not evidence of real AI generation or deployment.
export const exportRequestFixture: ExportRequest = {
  challengeId: 'black-friday', rulesVersion: '0.4', durationSeconds: 180,
  outcome: { status: 'COMPLETED', objectiveMet: true, elapsedSeconds: 180, availability: .99, score: 9400, infrastructureCost: 90, emergencyCost: 0, netBusinessValue: 400,
    primaryCause: 'No Critical Issue', peaks: { app: .9, sqlRead: 1.1, sqlWrite: .8 } },
  finalArchitecture: { app: { tier: 1, tierName: 'Standard I', instances: 2, capacityPerInstance: 150 },
    sql: { tier: 1, tierName: 'General Purpose I', readReplicas: 0, reads: 180, writes: 70 }, cache: { present: false, active: false }, protectedEdge: { present: false, active: false } },
  timeline: [{ t: 10, action: 'SCALE_OUT' }],
};
export const exportResponseFixture: ExportResponse = {
  title: 'Your two-instance architecture',
  bicep: `targetScope = 'resourceGroup'
param location string = resourceGroup().location
param namePrefix string = 'stack-survive'
param sqlAdminObjectId string
param sqlAdminLogin string
var tags = { 'stack-and-survive': 'export', challenge: 'black-friday' }
resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: '\${namePrefix}-plan'
  location: location
  tags: tags
  kind: 'linux'
  sku: { name: 'S1', tier: 'Standard', capacity: 2 }
  properties: { reserved: true }
}
resource app 'Microsoft.Web/sites@2023-12-01' = {
  name: '\${namePrefix}-app-\${uniqueString(resourceGroup().id)}'
  location: location
  tags: tags
  kind: 'app,linux'
  properties: { serverFarmId: plan.id, httpsOnly: true }
}
resource sqlServer 'Microsoft.Sql/servers@2023-08-01-preview' = {
  name: '\${namePrefix}-sql-\${uniqueString(resourceGroup().id)}'
  location: location
  tags: tags
  properties: {
    version: '12.0'
    minimalTlsVersion: '1.2'
    administrators: {
      administratorType: 'ActiveDirectory'
      azureADOnlyAuthentication: true
      login: sqlAdminLogin
      sid: sqlAdminObjectId
      tenantId: subscription().tenantId
    }
  }
}
resource database 'Microsoft.Sql/servers/databases@2023-08-01-preview' = {
  parent: sqlServer
  name: '\${namePrefix}-db'
  location: location
  tags: tags
  sku: { name: 'GP_S_Gen5_2', tier: 'GeneralPurpose', family: 'Gen5', capacity: 2 }
  properties: { minCapacity: json('0.5'), autoPauseDelay: 60 }
}`,
  parametersJson: JSON.stringify({ contentVersion: '1.0.0.0', parameters: { namePrefix: { value: 'stack-survive' } } }),
  resources: [
    { gameResource: 'App', azureService: 'Azure App Service', bicepSymbol: 'app', sku: 'S1', reason: 'You finished with 2 App instances and 99% availability. This preserves your final App count.' },
    { gameResource: 'SQL', azureService: 'Azure SQL Database', bicepSymbol: 'database', sku: 'GP_S_Gen5_2', reason: 'Your SQL read utilization peaked at 1.1. This preserves your tier 1 primary.' },
  ],
  caveats: ['Supply sqlAdminObjectId and sqlAdminLogin for your tenant before deployment. Compile and review regional availability; application code and service integration are not included.'],
};

export const optionalBicepFixture = `
resource redis 'Microsoft.Cache/redisEnterprise@2025-04-01' = {
  name: '\${namePrefix}-redis'
  location: location
  tags: tags
  sku: { name: 'Balanced_B1' }
  properties: { minimumTlsVersion: '1.2', highAvailability: 'Enabled' }
}
resource redisDatabase 'Microsoft.Cache/redisEnterprise/databases@2025-04-01' = {
  parent: redis
  name: 'default'
  properties: { clientProtocol: 'Encrypted', clusteringPolicy: 'EnterpriseCluster', evictionPolicy: 'VolatileLRU', port: 10000 }
}
resource network 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  name: '\${namePrefix}-vnet'
  location: location
  tags: tags
  properties: {
    addressSpace: { addressPrefixes: ['10.0.0.0/16'] }
    subnets: [{ name: 'gateway', properties: { addressPrefix: '10.0.1.0/24' } }]
  }
}
resource publicIp 'Microsoft.Network/publicIPAddresses@2023-09-01' = {
  name: '\${namePrefix}-ip'
  location: location
  tags: tags
  sku: { name: 'Standard' }
  properties: { publicIPAllocationMethod: 'Static' }
}
resource policy 'Microsoft.Network/ApplicationGatewayWebApplicationFirewallPolicies@2023-09-01' = {
  name: '\${namePrefix}-waf'
  location: location
  tags: tags
  properties: {
    policySettings: { state: 'Enabled', mode: 'Prevention' }
    managedRules: { managedRuleSets: [{ ruleSetType: 'OWASP', ruleSetVersion: '3.2' }] }
  }
}
var gatewayName = '\${namePrefix}-gateway'
var gatewayId = resourceId('Microsoft.Network/applicationGateways', gatewayName)
resource gateway 'Microsoft.Network/applicationGateways@2023-09-01' = {
  name: gatewayName
  location: location
  tags: tags
  properties: {
    sku: { name: 'WAF_v2', tier: 'WAF_v2', capacity: 2 }
    firewallPolicy: { id: policy.id }
    gatewayIPConfigurations: [{ name: 'gatewayConfig', properties: { subnet: { id: network.properties.subnets[0].id } } }]
    frontendIPConfigurations: [{ name: 'frontend', properties: { publicIPAddress: { id: publicIp.id } } }]
    frontendPorts: [{ name: 'port80', properties: { port: 80 } }]
    backendAddressPools: [{ name: 'pool', properties: { backendAddresses: [{ fqdn: app.properties.defaultHostName }] } }]
    backendHttpSettingsCollection: [{ name: 'settings', properties: { port: 443, protocol: 'Https', cookieBasedAffinity: 'Disabled', pickHostNameFromBackendAddress: true, requestTimeout: 30 } }]
    httpListeners: [{ name: 'listener', properties: {
      frontendIPConfiguration: { id: '\${gatewayId}/frontendIPConfigurations/frontend' }
      frontendPort: { id: '\${gatewayId}/frontendPorts/port80' }
      protocol: 'Http'
    } }]
    requestRoutingRules: [{ name: 'route', properties: {
      ruleType: 'Basic'
      priority: 100
      httpListener: { id: '\${gatewayId}/httpListeners/listener' }
      backendAddressPool: { id: '\${gatewayId}/backendAddressPools/pool' }
      backendHttpSettings: { id: '\${gatewayId}/backendHttpSettingsCollection/settings' }
    } }]
  }
}`;

export function allResourcesFixture(): { request: ExportRequest; response: ExportResponse } {
  const request = structuredClone(exportRequestFixture), response = structuredClone(exportResponseFixture);
  request.finalArchitecture.cache = { present: true, active: true };
  request.finalArchitecture.protectedEdge = { present: true, active: true };
  response.bicep += optionalBicepFixture;
  response.resources.push(
    { gameResource: 'Cache', azureService: 'Azure Managed Redis', bicepSymbol: 'redis', sku: 'Balanced_B1', reason: 'Your run finished with 99% availability. This preserves your installed Cache.' },
    { gameResource: 'Protected Edge', azureService: 'Azure Application Gateway', bicepSymbol: 'gateway', sku: 'WAF_v2', reason: 'Your run lasted 180 seconds. This preserves your installed Protected Edge.' },
  );
  response.caveats.push('The HTTP frontend is only a scaffold. Configure an approved TLS certificate and restrict direct App ingress before production; these are not configured by this export.');
  return { request, response };
}
