export const azureTutorialKey = 'stack-and-survive.azure-tutorial.v1';
export const azureTutorialSteps = [
  { title: 'Build an Azure architecture', text: 'Run a simplified Azure architecture through a Black Friday surge. Your decisions change how the business handles the same workload.', highlight: 'all' },
  { title: 'Connect application and data tiers', text: 'Azure App Service processes incoming requests; Azure SQL Database handles reads and order writes. These tiers have different capacity limits.', highlight: 'tiers' },
  { title: 'Follow traffic and pressure', text: 'Traffic arrives in waves, with short recovery windows. Look for pressure labels and marked routes to see where requests are being lost.', highlight: 'traffic' },
  { title: 'Choose one change to try', text: 'Scale out adds App machines; scale up strengthens the same facility. SQL tiers help writes too; Cache and read replicas help reads, with costs and delays.', highlight: 'actions' },
] as const;
export function tutorialSeen(storage: Pick<Storage, 'getItem'>): boolean {
  try { return ['completed', 'skipped'].includes(storage.getItem(azureTutorialKey) ?? ''); } catch { return false; }
}
export function saveTutorial(storage: Pick<Storage, 'setItem'>, status: 'completed' | 'skipped'): boolean {
  try { storage.setItem(azureTutorialKey, status); return true; } catch { return false; }
}
