export type JsonSchema = { [key: string]: unknown };
export type ExportResponse = {
  title: string; bicep: string; parametersJson: string;
  resources: { gameResource: 'App' | 'SQL' | 'Cache' | 'Protected Edge'; azureService: string; bicepSymbol: string; sku: string; reason: string }[];
  caveats: string[];
};

export const exportBicepSchema: JsonSchema = {
  type: 'object', additionalProperties: false,
  required: ['title', 'bicep', 'parametersJson', 'resources', 'caveats'],
  properties: {
    title: { type: 'string', description: 'At most 80 characters.' },
    bicep: { type: 'string', description: 'Complete resource-group main.bicep, at most 12000 UTF-8 bytes.' },
    parametersJson: { type: 'string', description: 'JSON parameters document matching declared Bicep parameters.' },
    resources: { type: 'array', items: {
      type: 'object', additionalProperties: false,
      required: ['gameResource', 'azureService', 'bicepSymbol', 'sku', 'reason'],
      properties: {
        gameResource: { type: 'string', enum: ['App', 'SQL', 'Cache', 'Protected Edge'] },
        azureService: { type: 'string' }, bicepSymbol: { type: 'string' }, sku: { type: 'string' },
        reason: { type: 'string', description: '2–3 sentences citing only numbers present in the input.' },
      },
    } },
    caveats: { type: 'array', items: { type: 'string' } },
  },
};
