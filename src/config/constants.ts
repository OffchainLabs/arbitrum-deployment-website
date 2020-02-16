import { bigNumberify } from 'ethers/utils'

export const DEFAULT_ALERT_TIMEOUT = 30 * 1000
export const WALLET_IDX = 0
export const DEV_DOC_URL =
  'https://developer.offchainlabs.com/docs/Chain_parameters/'
// seems like metamask switched rinkeby and kovan chain ids?
export const ROLLUP_FACTORIES: { [chainId: number]: string | undefined } = {
  3: '0x670dFfa13bF5fF7A42C94EA94A9484Dd7C6a1650', // ropsten
  4: '0x2ff2D1Cced0EBD48ca829d3C9E7f86A1141F761F', // rinkeby
  42: '0x46168bA7Cc052427085544534623fDEcb9bD92D8' // kovan
}
