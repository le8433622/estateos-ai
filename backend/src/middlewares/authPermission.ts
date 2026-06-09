import type { Request, Response, NextFunction } from 'express'
import type { AccountProfileDocument } from '../models/AccountProfile'
import type { Permission, AccountProfileType } from '../estateos/constants'
import { requireAccountProfile, EstateOSHttpError } from '../services/accountProfileService'

declare module 'express-serve-static-core' {
  interface Request {
    accountProfile?: AccountProfileDocument
  }
}

const authPermission = (permission: Permission, profileTypes: AccountProfileType[] = []) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountProfile = await requireAccountProfile(req, profileTypes, permission)
      req.accountProfile = accountProfile
      next()
    } catch (err) {
      if (err instanceof EstateOSHttpError) {
        res.status(err.statusCode).send({ message: err.message })
        return
      }
      res.status(500).send({ message: 'Internal server error' })
    }
  }

export default authPermission