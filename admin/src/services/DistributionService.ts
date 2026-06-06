import axiosInstance from './axiosInstance'

export const getDistributionAnalytics = () =>
  axiosInstance
    .get('/api/v1/distribution/admin/analytics', { withCredentials: true })
    .then((res) => res.data)

export const listDataProducts = () =>
  axiosInstance
    .get('/api/v1/data-products')
    .then((res) => res.data)

export const previewDataProduct = (id: string) =>
  axiosInstance
    .get(`/api/v1/data-products/${encodeURIComponent(id)}/preview`, { withCredentials: true })
    .then((res) => res.data)

export const adminListWebhooks = () =>
  axiosInstance
    .get('/api/v1/distribution/admin/webhooks', { withCredentials: true })
    .then((res) => res.data)

export const adminListDeliveries = () =>
  axiosInstance
    .get('/api/v1/distribution/admin/deliveries', { withCredentials: true })
    .then((res) => res.data)