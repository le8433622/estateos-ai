import axiosInstance from './axiosInstance'

export const getQualityOverview = () =>
  axiosInstance
    .get('/api/v1/quality/admin/overview', { withCredentials: true })
    .then((res) => res.data)

export const getQualityQueue = (flag?: string, limit = 50) =>
  axiosInstance
    .get(`/api/v1/quality/admin/queue?limit=${limit}${flag ? `&flag=${encodeURIComponent(flag)}` : ''}`, { withCredentials: true })
    .then((res) => res.data)

export const getQualityDetail = (id: string) =>
  axiosInstance
    .get(`/api/v1/quality/admin/properties/${encodeURIComponent(id)}`, { withCredentials: true })
    .then((res) => res.data)

export const refreshQuality = (id?: string) =>
  axiosInstance
    .post(`/api/v1/quality/admin/refresh${id ? `/${encodeURIComponent(id)}` : ''}`, {}, { withCredentials: true })
    .then((res) => res.data)

export const getMarketSignals = () =>
  axiosInstance
    .get('/api/v1/quality/admin/market-signals', { withCredentials: true })
    .then((res) => res.data)