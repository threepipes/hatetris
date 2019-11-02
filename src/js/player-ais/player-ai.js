'use strict'


import getGetPossibleMoves from './get-get-possible-moves'
import getEnemyAi from './../enemy-ais/get-hatetris'

export default (
      rotationSystem,
      placeFirstPiece,
      bar,
      wellDepth,
      wellWidth,
      beamWidth = 600,
      beamDepth = 40,
      searchParams = '{}'
    ) => {
  const getPossibleMoves = getGetPossibleMoves(rotationSystem, placeFirstPiece, bar, wellDepth, wellWidth, searchParams)
  const virtualEnemy = getEnemyAi(rotationSystem, placeFirstPiece, bar, wellDepth, wellWidth)

  const hashCode = state =>
    state.well.reduce((row, cur) => cur * (1 << wellWidth) + row, 0)

  const restoreChain = chain => {
    if (chain.pre) {
      const arr = restoreChain(chain.pre)
      arr.push(chain.cmd)
      return arr
    } else {
      return [chain.cmd]
    }
  }

  // pick the worst piece that could be put into this well
  // return the piece but not its rating
  const getBestMoves = (well, pieceId) => {
    let currentQueue = getPossibleMoves(well, pieceId)
    const depth = beamDepth
    const width = beamWidth
    const compare = (a, b) => b.rating - a.rating
    for (let d = 0; d < depth; d++) {
      const seen = []
      const nextQueue = []
      currentQueue.sort(compare).slice(0, width)
        .forEach(state => {
          const nextPieceId = virtualEnemy(state.well)
          getPossibleMoves(state.well, nextPieceId, d + 1, state.moveChain, state.score).forEach(nextState => {
            const hash = hashCode(nextState)
            if (seen[hash] !== undefined) return
            seen[hash] = 1
            nextQueue.push(nextState)
          })
        })

      if (nextQueue.length === 0) break
      currentQueue = nextQueue
    }

    const topState = currentQueue.sort(compare)[0]
    const result = restoreChain(topState.moveChain)
    return result
  }

  return getBestMoves
}
