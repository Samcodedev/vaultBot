import nombaService from './nomba.service.js';

interface CreateVirtualAccountDto {
  userId: string;
  fullName: string;
}

export interface NombaVirtualAccountResponse {
  code: string;
  description: string;
  data: {
    bankAccountNumber: string;
    accountHolderId: string;
    bankName: string;
    bankAccountName: string;
  };
}

export async function createVirtualAccount({
  userId,
  fullName,
}: CreateVirtualAccountDto): Promise<NombaVirtualAccountResponse> {
  const response = await nombaService.request<NombaVirtualAccountResponse>({
    method: 'POST',
    url: '/v1/accounts/virtual',
    data: {
      accountRef: userId,
      accountName: fullName,
      currency: 'NGN',
    },
  });

  return response.data;
}
