import axiosInstance from './axiosInstance'

export interface EstateOSOpsResult<T = Record<string, unknown>> {
  rows: T[]
  rowCount: number
}

export interface EstateOSCommandCenter {
  counts: Record<string, number>
  recent: Record<string, unknown[]>
}

export const getCommandCenter = (): Promise<EstateOSCommandCenter> =>
  axiosInstance
    .get('/api/v1/ops/command-center', { withCredentials: true })
    .then((res) => res.data)

export const getOpsCollection = (collection: string, limit = 25): Promise<EstateOSOpsResult> =>
  axiosInstance
    .get(`/api/v1/ops/${encodeURIComponent(collection)}?limit=${limit}`, { withCredentials: true })
    .then((res) => res.data)
