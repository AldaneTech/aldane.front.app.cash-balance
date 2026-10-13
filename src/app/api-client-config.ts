import { Configuration } from '@aldanetech/cash-balance-api-client-angular';
import { environment } from '../environments/environment';

export function apiClientConfiguration(): Configuration {
  return new Configuration({
    basePath: environment.apiUrl
  });
}
