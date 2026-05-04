import { cache } from 'react'
import { getUserOrgByAuthId as _getUserOrgByAuthId } from '@/services/organization.service'

export const getUserOrgByAuthId = cache(_getUserOrgByAuthId)
