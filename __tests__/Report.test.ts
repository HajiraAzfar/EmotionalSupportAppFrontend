/**
 * The PDF download: refreshed token first, the period's report fetched with
 * it, copied into Downloads, the cached copy removed; a failed one says so.
 */
import {FileSystem} from 'react-native-file-access';

import {apiRequest} from '../src/api/client';
import {downloadReport} from '../src/api/insights';

jest.mock('react-native-file-access', () => ({
  Dirs: {CacheDir: '/cache'},
  FileSystem: {
    fetch: jest.fn(),
    cpExternal: jest.fn(async () => {}),
    unlink: jest.fn(async () => {}),
  },
}));
jest.mock('../src/api/client', () => ({
  ...jest.requireActual('../src/api/client'),
  apiRequest: jest.fn(async () => ({})),
}));
jest.mock('../src/storage/tokens', () => ({getAccessToken: async () => 'token'}));

beforeEach(() => jest.clearAllMocks());

test('saves the period report to Downloads with the token', async () => {
  (FileSystem.fetch as jest.Mock).mockResolvedValue({ok: true, status: 200});
  const name = await downloadReport('30d');

  expect(apiRequest).toHaveBeenCalledWith('/auth/me', {token: 'token'});
  const [url, init] = (FileSystem.fetch as jest.Mock).mock.calls[0];
  expect(url).toContain('/insights/report.pdf?period=30d&tz_offset=');
  expect(init.headers).toEqual({Authorization: 'Bearer token'});
  expect(name).toMatch(/^mind-doc-report-\d{4}-\d{2}-\d{2}\.pdf$/);
  expect(FileSystem.cpExternal).toHaveBeenCalledWith(`/cache/${name}`, name, 'downloads');
  expect(FileSystem.unlink).toHaveBeenCalledWith(`/cache/${name}`);
});

test('a failed report says so and saves nothing', async () => {
  (FileSystem.fetch as jest.Mock).mockResolvedValue({ok: false, status: 500});
  await expect(downloadReport('7d')).rejects.toThrow("Couldn't make the report");
  expect(FileSystem.cpExternal).not.toHaveBeenCalled();
});
