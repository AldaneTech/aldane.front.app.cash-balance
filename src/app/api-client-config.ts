import { Configuration } from '@aldanetech/cash-balance-api-client-angular';

export function apiClientConfiguration(): Configuration {
  return new Configuration({
    basePath: 'http://localhost:8080/cash-balance'  // 🔁 AJUSTA SI CAMBIA
  });
}
