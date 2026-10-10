import type { IsoDateTime } from './common'
import type { PhysicalCardStatus } from './states'

export interface CardStyle {
  id: string
  name: string
  category: string
  ipTag: string
  setName: string
  rarity: string
  valueGrade: 'SS' | 'S' | 'A' | 'B' | 'C'
  marketValueUsd: number
  coinValue: number
  referenceImageUrl: string
  physicalCount: number
  availableCount: number
  updatedAt: IsoDateTime
}

export interface PhysicalCard {
  id: string
  styleId: string
  styleName: string
  frontImageUrl: string
  backImageUrl: string
  gradingAgency: string
  grade: string
  certificateMasked: string
  condition: string
  location: string
  status: PhysicalCardStatus
  reservedBatchId?: string
  updatedAt: IsoDateTime
}

export interface TemplatePool {
  id: string
  name: string
  coinTier: number
  valueGrade: string
  outstandingRights: number
  availableCandidates: number
  lockedCandidates: number
  gap: number
  status: 'healthy' | 'warning' | 'blocked'
  updatedAt: IsoDateTime
}

export interface InventoryMovement {
  id: string
  physicalCardId: string
  action: string
  fromLocation: string
  toLocation: string
  operator: string
  referenceId: string
  createdAt: IsoDateTime
}

export interface Stocktake {
  id: string
  warehouse: string
  scope: string
  expected: number
  scanned: number
  variance: number
  status: 'draft' | 'counting' | 'review' | 'completed'
  updatedAt: IsoDateTime
}
