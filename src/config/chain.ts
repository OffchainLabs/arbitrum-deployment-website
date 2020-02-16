export interface RollupParams {
  gracePeriod: string // minutes
  speedLimitFactor: string // cpu factor
  maxAssertionSize: string // seconds
  maxBlockWidth: string // blocks
  maxTimestampWidth: string // seconds
  stakeRequirement: string // eth
  vmHash: string
}

export const init: RollupParams = {
  gracePeriod: '',
  speedLimitFactor: '',
  maxAssertionSize: '',
  maxBlockWidth: '',
  maxTimestampWidth: '',
  stakeRequirement: '',
  vmHash: ''
}

export const local: RollupParams = {
  gracePeriod: '10',
  speedLimitFactor: '0.2',
  maxAssertionSize: '15',
  maxBlockWidth: '20',
  maxTimestampWidth: '600',
  stakeRequirement: '0.1',
  vmHash: ''
}

export const testnet: RollupParams = {
  gracePeriod: '180',
  speedLimitFactor: '1.0',
  maxAssertionSize: '50',
  maxBlockWidth: '20',
  maxTimestampWidth: '600',
  stakeRequirement: '1',
  vmHash: ''
}