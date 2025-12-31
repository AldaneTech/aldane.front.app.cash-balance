import { Configuration } from '@aldanetech/cash-balance-api-client-angular';

export function apiClientConfiguration(): Configuration {
  return new Configuration({
    basePath: 'https://api.finzbal.com/cash-balance/'  // 🔁 AJUSTA SI CAMBIA
  });
}
