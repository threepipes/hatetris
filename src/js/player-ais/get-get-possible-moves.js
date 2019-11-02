'use strict'

/**
 * This is copy of get-get-possible-features.js
 * to generate moves
 * by threepipes
 */

import getGetNextState from './../get-get-next-state'
import moves from './../moves'

export default (rotationSystem, placeFirstPiece, bar, wellDepth, wellWidth, searchParams) => {
  const getNextState = getGetNextState(rotationSystem, bar, wellDepth, wellWidth)
  /**
   * param definition:
   *  depthContrbRandom : init:0, range: -2 to 2
   *  randomCoef        : init:1, range: 0 to 5
   *  capCoef           : init:1, range: 0 to 5
   *  highBlueCoef      : init:1, range: 0 to 5
   */
  const param = Object.assign({
    depthContrbRandom: 0,
    randomCoef: 1,
    capCoef: 1,
    highBlueCoef: 1
  }, Object.fromEntries(
    searchParams.split(',')
      .map(arg => arg.split('='))
      .map(([k, v]) => [k, parseFloat(v)])))

  const generateMoveChain = (currentChain, nextMove) => 
    ({
      cmd: nextMove,
      pre: currentChain
    })
  
  const popcount = (n) => {
    n = n - ((n >> 1) & 0x55555555)
    n = (n & 0x33333333) + ((n >> 2) & 0x33333333)
    return ((n + (n >> 4) & 0xF0F0F0F) * 0x1010101) >> 24
  }

  const getHighestBlue = well => {
    let row
    for (row = 0; row < well.length; row++) {
      if (well[row] !== 0) {
        break
      }
    }
    return row
  }

  const getTwoWhites = well => {
    let count = 0
    well.forEach(row => {
      const rowWithWall = (1 << wellWidth + 1) | (row << 1) | 1
      if (popcount((rowWithWall << 1) | rowWithWall) == 2 + wellWidth
        && popcount(rowWithWall) == wellWidth) {
          count++
      }
    })
    return count
  }

  const getOneWhites = well => {
    let count = 0
    well.forEach(row => {
      if (popcount(row) == wellWidth - 1) {
          count++
      }
    })
    return count
  }

  const getCapped = well => {
    let count = 0
    let preRow = 0
    well.forEach(row => {
      count += popcount(preRow & ~row)
      preRow |= row
    })
    return count
  }

  // TODO(threepipes): rewrite to original
  const getWellRating = (well, depth, score) =>
    score * 10
    + Math.random() * Math.pow(depth, param.depthContrbRandom) * param.randomCoef
    - getCapped(well) * param.capCoef
    + getHighestBlue(well) * param.highBlueCoef
  

  return (well, pieceId, depth, currentChain = null, currentScore = 0) => {
    const hashCode = (x, y, o) =>
      (x * (wellDepth + 3) + y) * 4 + o

    let piece = placeFirstPiece(pieceId)
    let initialMove = currentChain

    while (
      piece.y + 4 < wellDepth && // piece is above the bottom
      well[piece.y + 4] === 0 // nothing immediately below it
    ) {
      piece = getNextState({
        well: well,
        score: currentScore,
        piece: piece
      }, 'D').piece
      initialMove = generateMoveChain(initialMove, 'D')
    }

    // push first position
    const pieceStates = [{
      piece,
      score: currentScore,
      moveChain: initialMove
    }]

    const seen = []
    seen[hashCode(piece.x, piece.y, piece.o)] = 1

    const possibleFutures = []

    // a simple for loop won't work here because
    // we are increasing the list as we go
    let i = 0
    while (i < pieceStates.length) {
      const {
        piece,
        score,
        moveChain
      } = pieceStates[i]

      // apply all possible moves
      moves.forEach(move => {
        const nextState = getNextState({
          well,
          score,
          piece
        }, move)
        const newPiece = nextState.piece
        const nextMoveChain = currentChain || generateMoveChain(moveChain, move)
        nextState.moveChain = nextMoveChain // bad pattern
        nextState.rating = getWellRating(nextState.well, depth, nextState.score)

        if (newPiece === null) {
          if (move === 'D' && well[3] === 0) {
            possibleFutures.push(nextState)
          }
        } else {
          const newHashCode = hashCode(newPiece.x, newPiece.y, newPiece.o)

          if (seen[newHashCode] === undefined) {
            pieceStates.push({
              piece: newPiece,
              score: nextState.score,
              moveChain: nextMoveChain
            })
            seen[newHashCode] = 1
          }
        }
      })
      i++
    }

    return possibleFutures
  }
}
