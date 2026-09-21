import { execFile } from 'node:child_process';
import { access, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { constants } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';

export type CompileResult = { ok: true; template: unknown; diagnostics: string[] } | { ok: false; diagnostics: string[] };
export type BicepCompiler = { compile: (source: string, timeoutMs: number) => Promise<CompileResult> };
const configuredPath = process.env.BICEP_CLI_PATH?.trim() ?? '';
export async function compilerConfigured(): Promise<boolean> {
  if (!isAbsolute(configuredPath)) return false;
  try { await access(configuredPath, constants.X_OK); return true; } catch { return false; }
}
export const artifactHash = (bicep: string, parametersJson: string) => createHash('sha256').update(JSON.stringify([bicep, parametersJson])).digest('hex');

export function safeCompileSource(source: string): boolean {
  return Buffer.byteLength(source) <= 12000 && source.trim().length > 0
    && !/\b(?:module|import|extension|provider|using|load\w*)\b|\/\*|'''|\b(?:list\w*|reference)\s*\(|https?:\/\//i.test(source)
    && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(source);
}

export function localCompiler(binary = configuredPath): BicepCompiler {
  return { async compile(source, timeoutMs) {
    if (!isAbsolute(binary) || !safeCompileSource(source)) return { ok: false, diagnostics: ['Compiler input policy rejected. Modules, imports, extensions and file loading are forbidden.'] };
    const directory = await mkdtemp(join(tmpdir(), 'stack-export-'));
    try {
      const file = join(directory, 'main.bicep');
      await writeFile(file, source, { mode: 0o600 });
      await writeFile(join(directory, 'bicepconfig.json'), JSON.stringify({ analyzers: { core: { enabled: false } } }), { mode: 0o600 });
      return await new Promise<CompileResult>(resolve => {
        execFile(binary, ['build', file, '--stdout', '--no-restore'], {
          cwd: directory, timeout: Math.max(1, Math.min(timeoutMs, 8000)), killSignal: 'SIGKILL', maxBuffer: 512_000,
          env: { HOME: directory, TMPDIR: directory, DOTNET_CLI_HOME: directory, DOTNET_CLI_TELEMETRY_OPTOUT: '1', DOTNET_EnableDiagnostics: '0', DOTNET_GCHeapHardLimit: '10000000', LANG: 'C.UTF-8' },
        }, (error, stdout, stderr) => {
          // Return only compiler codes/positions, never source excerpts, host paths or model text.
          const diagnostics = [...stderr.matchAll(/\((\d+),(\d+)\)\s*:\s*(Error|Warning)\s+(BCP\d+)\b/g)].slice(0, 8)
            .map(match => `${match[3]} ${match[4]} at line ${match[1]}, column ${match[2]}`);
          if (error) { resolve({ ok: false, diagnostics: diagnostics.length ? diagnostics : ['Compiler failed, timed out or exceeded output limits.'] }); return; }
          try { resolve({ ok: true, template: JSON.parse(stdout), diagnostics }); }
          catch { resolve({ ok: false, diagnostics: ['Compiler returned an invalid template.'] }); }
        });
      });
    } finally { await rm(directory, { recursive: true, force: true }); }
  } };
}
