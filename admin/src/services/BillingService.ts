import axiosInstance from './axiosInstance'

export interface BillingRows<T = Record<string, unknown>> {
  rows: T[]
  rowCount: number
}

export const getBillingOverview = () =>
  axiosInstance
    .get('/api/v1/billing/admin/overview', { withCredentials: true })
    .then((res) => res.data)

export const listInvoices = (limit = 25): Promise<BillingRows> =>
  axiosInstance
    .get(`/api/v1/billing/admin/invoices?limit=${limit}`, { withCredentials: true })
    .then((res) => res.data)

export const issueInvoice = (data: {
  account_id: string
  plan_id?: string
  property_id?: string
  amount: number
  currency?: string
  description?: string
  verification_package_type?: string
}) =>
  axiosInstance
    .post('/api/v1/billing/admin/invoices', data, { withCredentials: true })
    .then((res) => res.data)

export const updateInvoiceStatus = (id: string, status: string, notes?: string) =>
  axiosInstance
    .patch(`/api/v1/billing/admin/invoices/${encodeURIComponent(id)}/status`, { status, notes }, { withCredentials: true })
    .then((res) => res.data)

export const listSubscriptions = (limit = 25): Promise<BillingRows> =>
  axiosInstance
    .get(`/api/v1/billing/admin/subscriptions?limit=${limit}`, { withCredentials: true })
    .then((res) => res.data)

export const assignSubscription = (data: { account_id: string; plan_id: string }) =>
  axiosInstance
    .post('/api/v1/billing/admin/subscriptions', data, { withCredentials: true })
    .then((res) => res.data)

export const listPaymentRecords = (limit = 25): Promise<BillingRows> =>
  axiosInstance
    .get(`/api/v1/billing/admin/payments?limit=${limit}`, { withCredentials: true })
    .then((res) => res.data)

export const listPlans = () =>
  axiosInstance
    .get('/api/v1/billing/plans', { withCredentials: true })
    .then((res) => res.data)