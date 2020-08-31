export interface RollupParams {
  gracePeriod: string // minutes
  speedLimitFactor: string // cpu factor
  maxAssertionSize: string // seconds
  stakeRequirement: string // eth
}

export const init: RollupParams = {
  gracePeriod: '',
  speedLimitFactor: '',
  maxAssertionSize: '',
  stakeRequirement: '',
}

export const local: RollupParams = {
  gracePeriod: '10',
  speedLimitFactor: '0.2',
  maxAssertionSize: '15',
  stakeRequirement: '0.1',
}

export const testnet: RollupParams = {
  gracePeriod: '180',
  speedLimitFactor: '1.0',
  maxAssertionSize: '50',
  stakeRequirement: '1',
}
