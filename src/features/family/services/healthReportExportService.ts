import { Platform } from 'react-native';
import { fetch as expoFetch } from 'expo/fetch';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { AppConfig } from '../../../core/config/appConfig';
import { clearAll, getToken } from '../../../core/storage/secureStorage';
import { emitSessionExpired } from '../../../core/auth/sessionEvents';

export type HealthReportExportResult =
  | { kind: 'shared'; uri: string }
  | { kind: 'premium_required' }
  | { kind: 'unauthorized' }
  | { kind: 'forbidden' }
  | { kind: 'unsupported' }
  | { kind: 'busy' }
  | { kind: 'error' };

export interface HealthReportExportParams {
  elderlyId: string;
  from: string;
  to: string;
  types?: string[];
}

interface CacheFile {
  uri: string;
  create: (options: { overwrite: boolean }) => void;
  write: (bytes: Uint8Array) => void;
}

interface Dependencies {
  platform: string;
  fetch: typeof globalThis.fetch;
  getToken: () => Promise<string | null>;
  createCacheFile: (filename: string) => CacheFile;
  isSharingAvailable: () => Promise<boolean>;
  share: (uri: string) => Promise<void>;
  expireSession: () => Promise<void>;
}

const defaultDependencies: Dependencies = {
  platform: Platform.OS,
  fetch: expoFetch as typeof globalThis.fetch,
  getToken,
  createCacheFile: (filename) => new File(Paths.cache, filename),
  isSharingAvailable: Sharing.isAvailableAsync,
  share: (uri) =>
    Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: 'Chia sẻ báo cáo sức khỏe CareNest',
    }),
  expireSession: async () => {
    await clearAll();
    emitSessionExpired();
  },
};

export function createHealthReportExportService(dependencies: Dependencies = defaultDependencies) {
  let inProgress = false;

  return async function exportHealthReport(
    params: HealthReportExportParams,
  ): Promise<HealthReportExportResult> {
    if (inProgress) return { kind: 'busy' };
    if (dependencies.platform === 'web') return { kind: 'unsupported' };

    inProgress = true;
    try {
      if (!(await dependencies.isSharingAvailable())) return { kind: 'unsupported' };

      const token = await dependencies.getToken();
      if (!token) {
        await dependencies.expireSession();
        return { kind: 'unauthorized' };
      }

      const query = new URLSearchParams({ from: params.from, to: params.to });
      if (params.types && params.types.length > 0) query.set('types', params.types.join(','));
      const baseUrl = AppConfig.apiBaseUrl.replace(/\/$/, '');
      const url = `${baseUrl}/elderly/${encodeURIComponent(params.elderlyId)}/health-report.pdf?${query}`;
      const response = await dependencies.fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/pdf' },
      });

      if (response.status === 402) return { kind: 'premium_required' };
      if (response.status === 401) {
        await dependencies.expireSession();
        return { kind: 'unauthorized' };
      }
      if (response.status === 403) return { kind: 'forbidden' };
      if (!response.ok) return { kind: 'error' };

      const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
      const bytes = await response.bytes();
      if (
        !contentType.startsWith('application/pdf') ||
        bytes.length < 4 ||
        String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) !== '%PDF'
      ) {
        return { kind: 'error' };
      }

      const filename = `carenest-health-report-${params.elderlyId}-${params.from.slice(0, 10)}-${params.to.slice(0, 10)}.pdf`;
      const file = dependencies.createCacheFile(filename);
      file.create({ overwrite: true });
      file.write(bytes);
      await dependencies.share(file.uri);
      return { kind: 'shared', uri: file.uri };
    } catch {
      return { kind: 'error' };
    } finally {
      inProgress = false;
    }
  };
}

export const exportHealthReportPdf = createHealthReportExportService();
