import { request } from '@/max';

export async function fakeSubmitForm(params: any) {
  return request('/api/basicForm', {
    method: 'POST',
    data: params,
  });
}
