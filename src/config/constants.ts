export const DEFAULT_ALERT_TIMEOUT = 30 * 1000
export const WALLET_IDX = 0
export const DEV_DOC_URL =
  'https://developer.offchainlabs.com/docs/Chain_parameters/'
// seems like metamask switched rinkeby and kovan chain ids?
export const ROLLUP_FACTORIES: { [chainId: number]: string | undefined } = {
  3: '0xdd565D7D0115bb0e975E6B7248F16361c10a3dA7', // ropsten
  4: '0x716F0d674efeecA329F141D0CA0D97A98057BDBf', // rinkeby
  42: '0x716F0d674efeecA329F141D0CA0D97A98057BDBf' // kovan
}
