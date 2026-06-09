import express from 'express'
import multer from 'multer'
import authJwt from '../middlewares/authJwt'
import authPermission from '../middlewares/authPermission'
import * as estateosController from '../controllers/estateosController'
import * as billingController from '../controllers/billingController'
import * as qualityController from '../controllers/qualityController'
import * as distributionController from '../controllers/distributionController'
import * as partnerController from '../controllers/partnerController'
import * as pilotController from '../controllers/pilotController'

const routes = express.Router()

// Ops routes (admin:moderate)
routes.route('/api/v1/ops/command-center').get(authJwt.verifyToken, authPermission('admin:moderate'), estateosController.opsCommandCenter)
routes.route('/api/v1/ops/properties').get(authJwt.verifyToken, authPermission('admin:moderate'), estateosController.opsProperties)
routes.route('/api/v1/ops/property-claims').get(authJwt.verifyToken, authPermission('admin:moderate'), estateosController.opsPropertyClaims)
routes.route('/api/v1/ops/property-evidence').get(authJwt.verifyToken, authPermission('admin:moderate'), estateosController.opsPropertyEvidence)
routes.route('/api/v1/ops/verification-jobs').get(authJwt.verifyToken, authPermission('admin:moderate'), estateosController.opsVerificationJobs)
routes.route('/api/v1/ops/verification-reports').get(authJwt.verifyToken, authPermission('admin:moderate'), estateosController.opsVerificationReports)
routes.route('/api/v1/ops/risk-flags').get(authJwt.verifyToken, authPermission('admin:moderate'), estateosController.opsRiskFlags)
routes.route('/api/v1/ops/api-keys').get(authJwt.verifyToken, authPermission('admin:moderate'), estateosController.opsApiKeys)
routes.route('/api/v1/ops/api-usage').get(authJwt.verifyToken, authPermission('admin:moderate'), estateosController.opsApiUsage)
routes.route('/api/v1/ops/contribution-ledger').get(authJwt.verifyToken, authPermission('admin:moderate'), estateosController.opsContributionLedger)
routes.route('/api/v1/ops/data-usage-ledger').get(authJwt.verifyToken, authPermission('admin:moderate'), estateosController.opsDataUsageLedger)
routes.route('/api/v1/ops/audit-logs').get(authJwt.verifyToken, authPermission('admin:moderate'), estateosController.opsAuditLogs)
routes.route('/api/v1/ops/cleanup').get(authJwt.verifyToken, authPermission('admin:moderate'), estateosController.opsCleanupInfo)
routes.route('/api/v1/ops/cleanup').post(authJwt.verifyToken, authPermission('admin:moderate'), estateosController.opsRunCleanup)

// Public property routes
routes.route('/api/v1/properties').get(estateosController.listProperties)
routes.route('/api/v1/properties/:id/trust-state').get(estateosController.getTrustState)
routes.route('/api/v1/properties/:id').get(estateosController.getProperty)

// Supply routes (property:create_claim, property:upload_evidence)
routes.route('/api/v1/supply/properties').post(authJwt.verifyToken, authPermission('property:create_claim'), estateosController.createSupplyProperty)
routes.route('/api/v1/supply/properties/:id/evidence').get(authJwt.verifyToken, authPermission('property:upload_evidence'), estateosController.listPropertyEvidence)
routes.route('/api/v1/supply/properties/:id/evidence').post([authJwt.verifyToken, authPermission('property:upload_evidence'), multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } }).single('file')], estateosController.attachEvidence)

// Verification routes (verification:accept_job, verification:submit_report)
routes.route('/api/v1/verification/jobs').get(authJwt.verifyToken, authPermission('verification:accept_job'), estateosController.listVerificationJobs)
routes.route('/api/v1/verification/jobs').post(authJwt.verifyToken, authPermission('verification:submit_report'), estateosController.createVerificationJob)
routes.route('/api/v1/verification/jobs/:id/submit').post(authJwt.verifyToken, authPermission('verification:submit_report'), estateosController.submitVerificationReport)

// API key routes (api:create_key, api:read_usage)
routes.route('/api/v1/api-keys').post(authJwt.verifyToken, authPermission('api:create_key'), estateosController.createApiKey)
routes.route('/api/v1/api-keys/:id').delete(authJwt.verifyToken, authPermission('api:create_key'), estateosController.revokeApiKey)
routes.route('/api/v1/api-usage').get(authJwt.verifyToken, authPermission('api:read_usage'), estateosController.getApiUsage)
routes.route('/api/v1/api-scopes').get(estateosController.apiScopes)

// Activation routes (self-service, verifyToken only — controller checks own profile)
routes.route('/api/v1/activation/profiles').get(authJwt.verifyToken, estateosController.listOwnProfiles)
routes.route('/api/v1/activation/profiles').post(authJwt.verifyToken, estateosController.createOwnProfile)
routes.route('/api/v1/activation/supply/properties').get(authJwt.verifyToken, estateosController.listOwnSupplyProperties)
routes.route('/api/v1/activation/demand/profiles').get(authJwt.verifyToken, estateosController.listDemandProfiles)
routes.route('/api/v1/activation/demand/profiles').post(authJwt.verifyToken, estateosController.createDemandProfile)
routes.route('/api/v1/activation/demand/profiles/:id').put(authJwt.verifyToken, estateosController.updateDemandProfile)
routes.route('/api/v1/activation/demand/profiles/:id').delete(authJwt.verifyToken, estateosController.deleteDemandProfile)
routes.route('/api/v1/activation/saved-properties').get(authJwt.verifyToken, estateosController.listSavedProperties)
routes.route('/api/v1/activation/saved-properties').post(authJwt.verifyToken, estateosController.saveProperty)
routes.route('/api/v1/activation/saved-properties/:propertyId').delete(authJwt.verifyToken, estateosController.removeSavedProperty)
routes.route('/api/v1/activation/verifier/jobs').get(authJwt.verifyToken, estateosController.listOwnVerifierJobs)
routes.route('/api/v1/activation/api-keys').get(authJwt.verifyToken, estateosController.listOwnApiKeys)
routes.route('/api/v1/activation/api-usage').get(authJwt.verifyToken, estateosController.getOwnApiUsage)

// Billing routes
routes.route('/api/v1/billing/plans').get(billingController.listPlans)
routes.route('/api/v1/billing/plans/:id').get(billingController.getPlan)
routes.route('/api/v1/billing/subscriptions').get(authJwt.verifyToken, authPermission('billing:read'), billingController.listSubscriptions)
routes.route('/api/v1/billing/subscriptions').post(authJwt.verifyToken, authPermission('billing:read'), billingController.createSubscription)
routes.route('/api/v1/billing/invoices').get(authJwt.verifyToken, authPermission('billing:read'), billingController.listInvoices)
routes.route('/api/v1/billing/usage').get(authJwt.verifyToken, authPermission('billing:read'), billingController.getUsageForCurrentPlan)
routes.route('/api/v1/billing/verification-packages').post(authJwt.verifyToken, authPermission('billing:read'), billingController.requestVerificationPackage)
routes.route('/api/v1/billing/verification-packages').get(authJwt.verifyToken, authPermission('billing:read'), billingController.listVerificationPackageRequests)

// Billing admin routes (admin:moderate)
routes.route('/api/v1/billing/admin/overview').get(authJwt.verifyToken, authPermission('admin:moderate'), billingController.billingOverview)
routes.route('/api/v1/billing/admin/invoices').get(authJwt.verifyToken, authPermission('admin:moderate'), billingController.adminListInvoices)
routes.route('/api/v1/billing/admin/invoices').post(authJwt.verifyToken, authPermission('admin:moderate'), billingController.adminIssueInvoice)
routes.route('/api/v1/billing/admin/invoices/:id/status').patch(authJwt.verifyToken, authPermission('admin:moderate'), billingController.adminUpdateInvoiceStatus)
routes.route('/api/v1/billing/admin/subscriptions').get(authJwt.verifyToken, authPermission('admin:moderate'), billingController.adminListSubscriptions)
routes.route('/api/v1/billing/admin/subscriptions').post(authJwt.verifyToken, authPermission('admin:moderate'), billingController.adminAssignSubscription)
routes.route('/api/v1/billing/admin/payments').get(authJwt.verifyToken, authPermission('admin:moderate'), billingController.adminListPaymentRecords)

// Quality routes
routes.route('/api/v1/quality/properties/:id').get(qualityController.getPropertyQuality)
routes.route('/api/v1/quality/supply/:id/hints').get(authJwt.verifyToken, authPermission('property:create_claim'), qualityController.getSupplyQualityHints)

// Quality admin routes (admin:moderate)
routes.route('/api/v1/quality/admin/overview').get(authJwt.verifyToken, authPermission('admin:moderate'), qualityController.getAdminQualityOverview)
routes.route('/api/v1/quality/admin/queue').get(authJwt.verifyToken, authPermission('admin:moderate'), qualityController.getAdminQualityQueue)
routes.route('/api/v1/quality/admin/properties/:id').get(authJwt.verifyToken, authPermission('admin:moderate'), qualityController.getAdminQualityDetail)
routes.route('/api/v1/quality/admin/refresh').post(authJwt.verifyToken, authPermission('admin:moderate'), qualityController.postRefreshQuality)
routes.route('/api/v1/quality/admin/refresh/:id').post(authJwt.verifyToken, authPermission('admin:moderate'), qualityController.postRefreshQuality)
routes.route('/api/v1/quality/admin/market-signals').get(authJwt.verifyToken, authPermission('admin:moderate'), qualityController.getAdminMarketSignals)

// Data products / Distribution routes (public)
routes.route('/api/v1/data-products').get(distributionController.listDataProducts)
routes.route('/api/v1/data-products/:id').get(distributionController.getDataProduct)
routes.route('/api/v1/data-products/:id/preview').get(distributionController.previewDataProduct)
routes.route('/api/v1/data-products/:id/export').get(distributionController.exportDataProduct)
routes.route('/api/v1/data-products/:id/feed').get(distributionController.feedDataProduct)

// Webhook routes
routes.route('/api/v1/webhooks').get(authJwt.verifyToken, authPermission('api:read_usage'), distributionController.listWebhooks)
routes.route('/api/v1/webhooks').post(authJwt.verifyToken, authPermission('api:create_key'), distributionController.createWebhook)
routes.route('/api/v1/webhooks/:id').delete(authJwt.verifyToken, authPermission('api:create_key'), distributionController.deleteWebhook)
routes.route('/api/v1/webhooks/logs').get(authJwt.verifyToken, authPermission('api:read_usage'), distributionController.listWebhookDeliveryLogs)

// Distribution admin routes (admin:moderate)
routes.route('/api/v1/distribution/admin/analytics').get(authJwt.verifyToken, authPermission('admin:moderate'), distributionController.getDistributionAnalytics)
routes.route('/api/v1/distribution/admin/webhooks').get(authJwt.verifyToken, authPermission('admin:moderate'), distributionController.adminListWebhooks)
routes.route('/api/v1/distribution/admin/deliveries').get(authJwt.verifyToken, authPermission('admin:moderate'), distributionController.adminListDeliveryLogs)

// Partner routes (user self-service, verifyToken only)
routes.route('/api/v1/partners/apply').post(authJwt.verifyToken, partnerController.createApplication)
routes.route('/api/v1/partners/application').get(authJwt.verifyToken, partnerController.getMyApplication)
routes.route('/api/v1/partners/agreements').get(authJwt.verifyToken, partnerController.getMyAgreements)
routes.route('/api/v1/partners/agreements').post(authJwt.verifyToken, partnerController.acceptAgreement)
routes.route('/api/v1/partners/sandbox/credentials').post(authJwt.verifyToken, partnerController.getSandboxCredentials)

// Partner admin routes (admin:moderate)
routes.route('/api/v1/partners/admin/applications').get(authJwt.verifyToken, authPermission('admin:moderate'), partnerController.adminListApplications)
routes.route('/api/v1/partners/admin/applications/:id').get(authJwt.verifyToken, authPermission('admin:moderate'), partnerController.adminGetApplication)
routes.route('/api/v1/partners/admin/applications/:id/status').patch(authJwt.verifyToken, authPermission('admin:moderate'), partnerController.adminUpdateApplicationStatus)
routes.route('/api/v1/partners/admin/sales-pipeline').get(authJwt.verifyToken, authPermission('admin:moderate'), partnerController.adminGetSalesPipeline)
routes.route('/api/v1/partners/admin/agreements').get(authJwt.verifyToken, authPermission('admin:moderate'), partnerController.adminListAgreements)

// Pilot route (admin:moderate)
routes.route('/api/v1/pilot/metrics').get(authJwt.verifyToken, authPermission('admin:moderate'), pilotController.getPilotMetrics)

// EstateOS system routes
routes.route('/api/v1/estateos/health').get(estateosController.health)
routes.route('/api/v1/estateos/readiness').get(estateosController.readiness)
routes.route('/api/v1/estateos/env-validation').get(authJwt.verifyToken, authPermission('admin:moderate'), estateosController.envValidationStatus)
routes.route('/api/v1/estateos/seed').post(authJwt.verifyToken, authPermission('admin:moderate'), estateosController.triggerEstateOSSeed)

export default routes