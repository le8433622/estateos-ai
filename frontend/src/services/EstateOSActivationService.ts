import axiosInstance from './axiosInstance'

export interface EstateOSActivationRow<T = Record<string, unknown>> {
  rows: T[]
  rowCount: number
}

export const listOwnProfiles = () =>
  axiosInstance
    .get('/api/v1/activation/profiles', { withCredentials: true })
    .then((res) => res.data)

export const createOwnProfile = (data: { profile_type: string }) =>
  axiosInstance
    .post('/api/v1/activation/profiles', data, { withCredentials: true })
    .then((res) => res.data)

export const listOwnSupplyProperties = () =>
  axiosInstance
    .get('/api/v1/activation/supply/properties', { withCredentials: true })
    .then((res) => res.data)

export const listDemandProfiles = () =>
  axiosInstance
    .get('/api/v1/activation/demand/profiles', { withCredentials: true })
    .then((res) => res.data)

export const createDemandProfile = (data: {
  demand_type?: string
  target_locations?: string[]
  budget_min?: number
  budget_max?: number
  currency?: string
}) =>
  axiosInstance
    .post('/api/v1/activation/demand/profiles', data, { withCredentials: true })
    .then((res) => res.data)

export const updateDemandProfile = (id: string, data: Record<string, unknown>) =>
  axiosInstance
    .put(`/api/v1/activation/demand/profiles/${encodeURIComponent(id)}`, data, { withCredentials: true })
    .then((res) => res.data)

export const deleteDemandProfile = (id: string) =>
  axiosInstance
    .delete(`/api/v1/activation/demand/profiles/${encodeURIComponent(id)}`, { withCredentials: true })

export const listSavedProperties = () =>
  axiosInstance
    .get('/api/v1/activation/saved-properties', { withCredentials: true })
    .then((res) => res.data)

export const saveProperty = (propertyId: string, notes?: string) =>
  axiosInstance
    .post('/api/v1/activation/saved-properties', { property_id: propertyId, notes }, { withCredentials: true })
    .then((res) => res.data)

export const removeSavedProperty = (propertyId: string) =>
  axiosInstance
    .delete(`/api/v1/activation/saved-properties/${encodeURIComponent(propertyId)}`, { withCredentials: true })

export const listOwnVerifierJobs = () =>
  axiosInstance
    .get('/api/v1/activation/verifier/jobs', { withCredentials: true })
    .then((res) => res.data)

export const listOwnApiKeys = () =>
  axiosInstance
    .get('/api/v1/activation/api-keys', { withCredentials: true })
    .then((res) => res.data)

export const getOwnApiUsage = () =>
  axiosInstance
    .get('/api/v1/activation/api-usage', { withCredentials: true })
    .then((res) => res.data)
