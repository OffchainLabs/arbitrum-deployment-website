import { BigNumber, bigNumberify } from 'ethers/utils'

// TODO shared lib

export const TICKS_PER_BLOCK = bigNumberify(1000)
export const SECONDS_PER_BLOCK = bigNumberify(13)

export function blocksToSeconds(blocks: number | BigNumber): BigNumber {
  return SECONDS_PER_BLOCK.mul(blocks)
}

export function blocksToTicks(blocks: number | BigNumber): BigNumber {
  return TICKS_PER_BLOCK.mul(blocks)
}

export function ticksToBlocks(ticks: BigNumber): BigNumber {
  return ticks.div(TICKS_PER_BLOCK)
}

export function ticksToSeconds(ticks: BigNumber): BigNumber {
  return blocksToSeconds(ticksToBlocks(ticks))
}

export function secondsToBlocks(seconds: number | BigNumber): BigNumber {
  return bigNumberify(seconds).div(SECONDS_PER_BLOCK)
}

export function secondsToTicks(seconds: number | BigNumber): BigNumber {
  return blocksToTicks(secondsToBlocks(seconds))
}
