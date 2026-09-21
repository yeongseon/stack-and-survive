import type { ExportRequest } from './export-bicep';

function object(value: unknown): Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
export function checkCompiledArchitecture(template: unknown, request: ExportRequest): string[] {
  const root = object(template), errors: string[] = [];
  if (!Array.isArray(root.resources) || root.resources.length > 12) return ['Compiled resources must be a bounded flat list.'];
  if (root.functions || root.outputs || root.languageVersion || root.definitions) errors.push('User functions, outputs and experimental template forms are not allowed.');
  const f = request.finalArchitecture;
  const expected = new Map<string, number>([
    ['Microsoft.Web/serverfarms', 1], ['Microsoft.Web/sites', 1], ['Microsoft.Sql/servers', 1], ['Microsoft.Sql/servers/databases', 1],
    ...(f.cache.present ? [['Microsoft.Cache/redisEnterprise', 1], ['Microsoft.Cache/redisEnterprise/databases', 1]] as [string, number][] : []),
    ...(f.protectedEdge.present ? [['Microsoft.Network/applicationGateways', 1], ['Microsoft.Network/ApplicationGatewayWebApplicationFirewallPolicies', 1], ['Microsoft.Network/virtualNetworks', 1], ['Microsoft.Network/publicIPAddresses', 1]] as [string, number][] : []),
  ]);
  const resources = root.resources.map(object);
  if (root.$schema !== 'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#') errors.push('Resource-group ARM template required.');
  for (const r of resources) {
    if (typeof r.type !== 'string' || !expected.has(r.type) || r.copy || r.condition !== undefined || r.resources) errors.push('Unexpected, conditional, nested or repeated resource.');
    if (typeof r.apiVersion !== 'string' || !/^20(?:2[3-9]|[3-9]\d)-\d{2}-\d{2}(?:-preview)?$/.test(r.apiVersion)) errors.push('Unsupported resource API version.');
    if (object(r.tags)['stack-and-survive'] !== 'export' || object(r.tags).challenge !== request.challengeId) {
      // Bicep often keeps a shared literal tags variable rather than inlining it.
      const tags = typeof r.tags === 'string' && r.tags === "[variables('tags')]" ? object(object(root.variables).tags) : {};
      if (tags['stack-and-survive'] !== 'export' || tags.challenge !== request.challengeId) errors.push('Resource provenance tags do not match.');
    }
  }
  for (const [type, count] of expected) if (resources.filter(r => r.type === type).length !== count) errors.push(`Expected exactly ${count} ${type}.`);
  const get = (type: string) => resources.find(r => r.type === type) ?? {};
  const reference = (resource: Record<string, unknown>) => {
    if (typeof resource.type !== 'string' || typeof resource.name !== 'string') return null;
    const name = resource.name.startsWith('[') && resource.name.endsWith(']') ? resource.name.slice(1, -1) : `'${resource.name}'`;
    return `[resourceId('${resource.type}', ${name})]`;
  };
  const plan = get('Microsoft.Web/serverfarms'), planSku = object(plan.sku);
  if (planSku.name !== ['S1', 'S2', 'P1v3'][f.app.tier - 1] || planSku.capacity !== f.app.instances || object(plan.properties).reserved !== true) errors.push('App plan SKU, Linux setting or instance count differs from the finished run.');
  const app = get('Microsoft.Web/sites'), appProperties = object(app.properties);
  if (appProperties.httpsOnly !== true || !reference(plan) || appProperties.serverFarmId !== reference(plan)) errors.push('App must use HTTPS and reference its generated plan.');
  const database = get('Microsoft.Sql/servers/databases'), databaseProperties = object(database.properties);
  if (object(database.sku).name !== ['GP_S_Gen5_2', 'GP_Gen5_4', 'BC_Gen5_4'][f.sql.tier - 1]) errors.push('SQL SKU differs from the finished tier.');
  if ((f.sql.tier === 3 && f.sql.readReplicas > 0) ? databaseProperties.readScale !== 'Enabled' : databaseProperties.readScale === 'Enabled') errors.push('SQL read-scale configuration does not match supported mapping.');
  const admins = object(object(get('Microsoft.Sql/servers').properties).administrators);
  if (admins.azureADOnlyAuthentication !== true || admins.administratorType !== 'ActiveDirectory' || admins.sid !== "[parameters('sqlAdminObjectId')]" || admins.login !== "[parameters('sqlAdminLogin')]") errors.push('SQL must use Entra-only parameterized administrators.');
  const parameters = object(root.parameters);
  for (const key of ['location', 'namePrefix', 'sqlAdminObjectId', 'sqlAdminLogin']) if (object(parameters[key]).type !== 'string') errors.push(`Missing string parameter ${key}.`);
  if (Object.keys(parameters).some(key => !['location', 'namePrefix', 'sqlAdminObjectId', 'sqlAdminLogin'].includes(key))) errors.push('Additional parameters are not allowed.');
  if ('defaultValue' in object(parameters.sqlAdminObjectId) || 'defaultValue' in object(parameters.sqlAdminLogin)) errors.push('SQL administrator defaults are forbidden.');
  if (f.cache.present) {
    if (object(get('Microsoft.Cache/redisEnterprise').sku).name !== 'Balanced_B1') errors.push('Redis SKU differs from the fixed mapping.');
    const redis = object(get('Microsoft.Cache/redisEnterprise/databases').properties);
    if (redis.clientProtocol !== 'Encrypted' || redis.clusteringPolicy !== 'EnterpriseCluster' || redis.evictionPolicy !== 'VolatileLRU' || redis.port !== 10000) errors.push('Redis protocol, cluster, eviction or port differs from mapping.');
  }
  if (f.protectedEdge.present) {
    const gateway = object(get('Microsoft.Network/applicationGateways').properties), policy = object(get('Microsoft.Network/ApplicationGatewayWebApplicationFirewallPolicies').properties);
    if (object(gateway.sku).name !== 'WAF_v2' || object(gateway.sku).tier !== 'WAF_v2' || object(policy.policySettings).mode !== 'Prevention'
      || object(gateway.firewallPolicy).id !== reference(get('Microsoft.Network/ApplicationGatewayWebApplicationFirewallPolicies'))) errors.push('Protected Edge requires WAF_v2 referencing its generated Prevention policy.');
    const ip = get('Microsoft.Network/publicIPAddresses');
    if (object(ip.sku).name !== 'Standard' || object(ip.properties).publicIPAllocationMethod !== 'Static') errors.push('Gateway requires a Standard static public IP.');
    for (const key of ['gatewayIPConfigurations', 'frontendIPConfigurations', 'frontendPorts', 'backendAddressPools', 'backendHttpSettingsCollection', 'httpListeners', 'requestRoutingRules']) {
      if (!Array.isArray(gateway[key]) || !gateway[key].length) errors.push(`Gateway ${key} is missing.`);
    }
  }
  return [...new Set(errors)].slice(0, 8);
}
