import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

import { logger } from '../../utils';

class NombaService {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor() {
    this.client = axios.create({
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private getBaseUrl(): string {
    return (process.env.NOMBA_BASE_URL || 'https://api.nomba.com').replace(/\/+$/, '');
  }

  private async getAccessToken(): Promise<string> {
    const now = new Date();
    // If we have a token and it is still valid (with a 2-minute safety margin)
    if (
      this.accessToken &&
      this.tokenExpiresAt &&
      this.tokenExpiresAt.getTime() > now.getTime() + 120000
    ) {
      return this.accessToken;
    }

    const baseUrl = this.getBaseUrl();
    const clientId = process.env.NOMBA_CLIENT_ID;
    const clientSecret = process.env.NOMBA_CLIENT_SECRET;
    const accountId = process.env.NOMBA_ACCOUNT_ID;

    if (!clientId || !clientSecret || !accountId) {
      throw new Error(
        'Nomba configuration is incomplete. Please check NOMBA_CLIENT_ID, NOMBA_CLIENT_SECRET, and NOMBA_ACCOUNT_ID in env.',
      );
    }

    try {
      const response = await axios.post(
        `${baseUrl}/v1/auth/token/issue`,
        {
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            accountId: accountId,
          },
        },
      );

      const { access_token, expiresAt } = response.data.data;
      this.accessToken = access_token;

      if (expiresAt) {
        this.tokenExpiresAt = new Date(expiresAt);
      } else {
        // Fallback to 30 minutes if expiresAt is not provided
        this.tokenExpiresAt = new Date(now.getTime() + 1800000);
      }

      return this.accessToken!;
    } catch (error: unknown) {
      let errorMsg = 'Unknown error';
      if (axios.isAxiosError(error)) {
        errorMsg = error.response?.data?.description || error.message;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      logger.error(`Failed to authenticate with Nomba API: ${errorMsg}`);
      throw new Error(`Failed to authenticate with Nomba API: ${errorMsg}`, { cause: error });
    }
  }

  public async request<T = unknown>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const token = await this.getAccessToken();
    const accountId = process.env.NOMBA_ACCOUNT_ID;

    const headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
      accountId,
    };

    return this.client.request({
      ...config,
      baseURL: this.getBaseUrl(),
      headers,
    });
  }
}

const nombaService = new NombaService();
export default nombaService;
