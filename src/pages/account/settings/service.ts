import { request } from '@/max';
import type { CurrentUser, GeographicItemType } from './data';

export async function queryCurrent(): Promise<{ data: CurrentUser }> {
  return request<{ data: CurrentUser }>('/api/accountSettingCurrentUser');
}

export async function queryProvince(): Promise<GeographicItemType[]> {
  return request<{ data: GeographicItemType[] }>(
    '/api/geographic/province',
  ).then(({ data }) => data);
}

export async function queryCity(
  province: string,
): Promise<GeographicItemType[]> {
  return request<{ data: GeographicItemType[] }>(
    `/api/geographic/city/${encodeURIComponent(province)}`,
  ).then(({ data }) => data);
}

export async function query() {
  return request('/api/users');
}
