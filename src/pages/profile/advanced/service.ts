import { request } from '@/max';
import type { AdvancedProfileData } from './data.d';

export async function queryAdvancedProfile(): Promise<{
  data: AdvancedProfileData;
}> {
  return request<{ data: AdvancedProfileData }>('/api/profile/advanced');
}
