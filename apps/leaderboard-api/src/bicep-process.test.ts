import { afterEach, expect, it, vi } from 'vitest';
import { readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
const mocked = vi.hoisted(() => ({ execFile: vi.fn() }));
vi.mock('node:child_process', () => ({ execFile: mocked.execFile }));
import { localCompiler } from './bicep-compiler';
afterEach(() => { mocked.execFile.mockReset(); vi.unstubAllEnvs(); });
it('executes fixed non-restoring arguments with stripped secrets and always removes temporary workspace', async () => {
  vi.stubEnv('AZURE_OPENAI_API_KEY', 'must-not-be-inherited');
  let directory = '';
  mocked.execFile.mockImplementation((binary, args, options, callback) => {
    expect(binary).toBe('/approved/bicep');
    expect(args).toEqual(['build', `${options.cwd}/main.bicep`, '--stdout', '--no-restore']);
    expect(options.env.AZURE_OPENAI_API_KEY).toBeUndefined(); expect(options.env.HOME).toBe(options.cwd);
    expect(options.timeout).toBe(8000); expect(options.maxBuffer).toBe(512000); expect(options.killSignal).toBe('SIGKILL');
    directory = options.cwd; callback(null, '{"resources":[]}', '');
  });
  expect((await localCompiler('/approved/bicep').compile("targetScope = 'resourceGroup'", 20000)).ok).toBe(true);
  await expect(readdir(directory)).rejects.toMatchObject({ code: 'ENOENT' });
});
it('sanitizes stderr and cleans up after execution failure', async () => {
  let directory = '';
  mocked.execFile.mockImplementation((_binary, _args, options, callback) => {
    directory = options.cwd;
    callback(new Error('sensitive'), '', `${directory}/main.bicep(2,3) : Error BCP018: private source/token\n`);
  });
  const result = await localCompiler('/approved/bicep').compile("targetScope = 'resourceGroup'", 1000);
  expect(result).toEqual({ ok: false, diagnostics: ['Error BCP018 at line 2, column 3'] });
  await expect(readdir(directory)).rejects.toMatchObject({ code: 'ENOENT' });
});
it('does not create files or invoke a process for rejected source', async () => {
  const before = (await readdir(tmpdir())).filter(name => name.startsWith('stack-export-')).sort();
  expect((await localCompiler('/approved/bicep').compile("var data = loadTextContent('/private')", 1000)).ok).toBe(false);
  expect(mocked.execFile).not.toHaveBeenCalled();
  expect((await readdir(tmpdir())).filter(name => name.startsWith('stack-export-')).sort()).toEqual(before);
});
