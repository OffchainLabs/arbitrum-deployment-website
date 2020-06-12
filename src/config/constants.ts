export const DEFAULT_ALERT_TIMEOUT = 30 * 1000
export const WALLET_IDX = 0
export const DEV_DOC_URL =
  'https://developer.offchainlabs.com/docs/Chain_parameters/'
// seems like metamask switched rinkeby and kovan chain ids?
export const ROLLUP_FACTORIES: { [chainId: number]: string | undefined } = {
  3: '0xb8A500d736c7728E61138cE5e0Bc215ba950370E', // ropsten
  4: '0xb5825993dc56a1be7b701b6364bd91E80Ea5D77c', // rinkeby
  42: '0xa265F4c8831632FA4070b0D3b78480165741DC1F' // kovan
}
