const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') localStorage.setItem('token', token);
  }

  getToken() {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') return localStorage.getItem('token');
    return null;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') localStorage.removeItem('token');
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    if (options.headers) {
      Object.assign(headers, options.headers);
    }
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    if (!res.ok) {
      const isDemo = token?.startsWith('demo-') || token === 'demo-mode';
      if (res.status === 401 && typeof window !== 'undefined' && !isDemo && !path.includes('/login') && !path.includes('/verify-otp')) {
        this.clearToken();
        localStorage.removeItem('agrimind_user');
        localStorage.removeItem('cached_farms');
        localStorage.removeItem('selectedFarmId');
        localStorage.removeItem('selectedFieldId');
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login?expired=1';
        }
      }
      const error = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Request failed');
    }
    return res.json();
  }

  login(email: string, password: string) {
    return this.request<{ access_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  register(name: string, email: string, password: string) {
    return this.request<{ message: string; user_id: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  sendOtp(name: string, email: string, password: string, phone?: string) {
    return this.request<{ message: string; email_sent: boolean; sms_sent: boolean; phone?: string; dev_otp?: string; code_length?: number }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone }),
    });
  }

  verifyOtp(email: string, otp: string, name: string, password: string, phone?: string) {
    return this.request<{ access_token: string; refresh_token: string; expires_in: number }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, name, password, phone }),
    });
  }

  getMe() { return this.request<any>('/auth/me'); }
  getFarms() { return this.request<any[]>('/farms/'); }
  getFarm(farmId: string) { return this.request<any>(`/farms/${farmId}`); }
  createFarm(data: any) { return this.request<any>('/farms/', { method: 'POST', body: JSON.stringify(data) }); }
  getFields(farmId: string) { return this.request<any[]>(`/farms/${farmId}/fields`); }
  getField(fieldId: string) { return this.request<any>(`/fields/${fieldId}`); }
  createField(farmId: string, data: any) { return this.request<any>(`/farms/${farmId}/fields`, { method: 'POST', body: JSON.stringify(data) }); }
  getCropTypes() { return this.request<any[]>('/farms/crop-types'); }
  
  analyzeCropHealth(formData: FormData) {
    return this.request<any>('/crop-health/analyze', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set boundary for FormData
    });
  }

  detectDisease(formData: FormData) {
    return this.request<any>('/disease/detect', {
      method: 'POST',
      body: formData,
      headers: {},
    });
  }

  predictPest(cropCycleId: string) {
    return this.request<any>(`/pest/predict/${cropCycleId}`);
  }

  analyzeSoil(data: any) {
    return this.request<any>('/soil/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  predictWater(fieldId: string) { return this.request<any>(`/water/predict/${fieldId}`); }
  getIrrigationRecommendation(fieldId: string) { return this.request<any>(`/irrigation/recommend/${fieldId}`); }
  getAlerts(unread = false) { return this.request<any[]>(`/alerts/?unread_only=${unread}`); }
  markAlertRead(alertId: string) { return this.request<any>(`/alerts/${alertId}/read`, { method: 'PATCH' }); }
  getWeather(fieldId: string) { return this.request<any>(`/weather/forecast/${fieldId}`); }
  getFertilizerRecommendation(cropCycleId: string) { return this.request<any>(`/fertilizer/recommend/${cropCycleId}`); }
  predictHarvest(cropCycleId: string) { return this.request<any>(`/harvest/predict/${cropCycleId}`); }
  getMarketPrices(cropTypeId: string, state = 'Punjab') { return this.request<any>(`/market/prices/${cropTypeId}?state=${state}`); }
  getSellRecommendation(cropCycleId: string) { return this.request<any>(`/market/sell-recommendation/${cropCycleId}`); }
  predictProfit(cropCycleId: string) { return this.request<any>(`/profit/predict/${cropCycleId}`); }
  
  askAssistant(query: string, fieldId?: string, language = 'en') {
    return this.request<any>('/assistant/query', {
      method: 'POST',
      body: JSON.stringify({ query, field_id: fieldId, language }),
    });
  }

  getLatestSensors(fieldId: string) {
    return this.request<any[]>(`/sensors/${fieldId}/latest`);
  }

  generateReport(data: any) {
    return this.request<any>('/reports/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();

