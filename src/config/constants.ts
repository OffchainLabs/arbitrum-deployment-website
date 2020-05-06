import { bigNumberify } from 'ethers/utils'

export const DEFAULT_ALERT_TIMEOUT = 30 * 1000
export const WALLET_IDX = 0
export const DEV_DOC_URL =
  'https://developer.offchainlabs.com/docs/Chain_parameters/'
// seems like metamask switched rinkeby and kovan chain ids?
export const ROLLUP_FACTORIES: { [chainId: number]: string | undefined } = {
  3: '0x0501be99fc97F352D5bA9bFaC23a3d4eEbDF7030', // ropsten
  4: '0x0501be99fc97F352D5bA9bFaC23a3d4eEbDF7030', // rinkeby
  42: '0x0501be99fc97F352D5bA9bFaC23a3d4eEbDF7030' // kovan
}
