const API_BASE = '/api';

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }
  return data;
}

export const api = {
  // Auth
  getAuthConfig: () =>
    request<{ botUsername: string | null; telegramAuthConfigured: boolean; demoModeEnabled: boolean }>('/auth/config'),

  authTelegram: (data: { initData?: string; mockUser?: any; referralCode?: string }) =>
    request<{ user: any; authMode?: string; sessionToken?: string }>('/auth/telegram', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  authTelegramWidget: (data: { widgetData: any; referralCode?: string }) =>
    request<{ user: any; authMode: string; sessionToken: string }>('/auth/telegram-widget', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  authSession: (sessionToken: string) =>
    request<{ user: any; authMode: string }>('/auth/session', {
      method: 'POST',
      body: JSON.stringify({ sessionToken }),
    }),

  // Campaigns
  getCampaigns: (category?: string, search?: string, minReward?: number, status?: string, projectId?: string) => {
    const params = new URLSearchParams();
    if (category && category !== 'ALL') params.append('category', category);
    if (search) params.append('search', search);
    if (minReward) params.append('minReward', minReward.toString());
    if (status) params.append('status', status);
    if (projectId) params.append('projectId', projectId);
    return request<any[]>(`/campaigns?${params.toString()}`);
  },

  getProjects: () => request<any[]>('/campaigns/projects/list'),

  getCampaign: (id: string) => request<any>(`/campaigns/${id}`),

  createCampaign: (data: any) =>
    request<any>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  fundCampaign: (id: string, depositRef?: string) =>
    request<any>(`/campaigns/${id}/fund`, {
      method: 'POST',
      body: JSON.stringify({ depositRef }),
    }),

  getCampaignTelemetry: (id: string) => request<any>(`/campaigns/${id}/telemetry`),

  exportParticipants: (id: string) => request<any>(`/campaigns/${id}/export`),

  closeCampaign: (id: string) =>
    request<any>(`/campaigns/${id}/close`, {
      method: 'POST',
    }),

  // Tasks
  startTask: (campaignId: string, userId: string) =>
    request<any>('/tasks/start', {
      method: 'POST',
      body: JSON.stringify({ campaignId, userId }),
    }),

  verifyTask: (taskId: string, payload?: string) =>
    request<any>(`/tasks/${taskId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ payload }),
    }),

  getUserTasks: (userId: string) => request<any[]>(`/tasks/user/${userId}`),

  // Contributor User
  getUserProfile: (userId: string) => request<any>(`/user/profile/${userId}`),

  getUserBalance: (userId: string) => request<any>(`/user/balance/${userId}`),

  requestWithdrawal: (data: { userId: string; amount: number; destinationAddress: string; network: string }) =>
    request<any>('/user/withdraw', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Admin
  getAdminOverview: () => request<any>('/admin/overview'),
  getPendingCampaigns: () => request<any[]>('/admin/campaigns/pending'),
  reviewCampaign: (id: string, action: 'APPROVE' | 'REJECT', reason?: string) =>
    request<any>(`/admin/campaigns/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, reason }),
    }),

  getPendingProofs: () => request<any[]>('/admin/proofs/pending'),
  decisionProof: (id: string, decision: 'APPROVE' | 'REJECT', reason?: string) =>
    request<any>(`/admin/proofs/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision, reason }),
    }),

  getPendingWithdrawals: () => request<any[]>('/admin/withdrawals/pending'),
  authorizeWithdrawal: (id: string, txHash?: string) =>
    request<any>(`/admin/withdrawals/${id}/authorize`, {
      method: 'POST',
      body: JSON.stringify({ txHash }),
    }),

  rejectWithdrawal: (id: string, reason?: string) =>
    request<any>(`/admin/withdrawals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  getFraudCases: () => request<any[]>('/admin/fraud/cases'),
  resolveFraudCase: (id: string, action: 'CLEARED' | 'BANNED', notes?: string) =>
    request<any>(`/admin/fraud/cases/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ action, notes }),
    }),

  getLedgerAudit: () => request<any>('/admin/ledger/audit'),

  // Health & Monitor
  getHealth: async (): Promise<{
    ok: boolean;
    statusCode: number;
    latencyMs: number;
    data: any;
  }> => {
    const started = performance.now();
    try {
      const response = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        cache: 'no-store',
      });
      const latencyMs = Math.max(1, Math.round(performance.now() - started));
      const data = await response.json().catch(() => ({}));
      return { ok: response.ok, statusCode: response.status, latencyMs, data };
    } catch (err: any) {
      const latencyMs = Math.max(1, Math.round(performance.now() - started));
      return {
        ok: false,
        statusCode: 0,
        latencyMs,
        data: { status: 'unhealthy', database: 'disconnected', error: err?.message || 'Network error' },
      };
    }
  },
};
