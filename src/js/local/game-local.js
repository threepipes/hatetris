/**
  HATETRIS instance builder
*/

'use strict'

import log4js from 'log4js'

import getFirstState from '../get-first-state'
import getGetNextState from '../get-get-next-state'

const minWidth = 4

const logger = log4js.getLogger()

class Game {
  constructor (props) {
    this.props = props
    const {
      rotationSystem,
      placeFirstPiece,
      bar,
      wellDepth,
      wellWidth,
      enemyAi
    } = this.props

    if (rotationSystem.length < 1) {
      throw Error('Have to have at least one piece!')
    }

    if (wellDepth < bar) {
      throw Error("Can't have well with depth " + String(wellDepth) + ' less than bar at ' + String(bar))
    }

    if (wellWidth < minWidth) {
      throw Error("Can't have well with width " + String(wellWidth) + ' less than ' + String(minWidth))
    }

    this.firstState = getFirstState(wellDepth, placeFirstPiece, enemyAi)
    this.getNextState = getGetNextState(rotationSystem, bar, wellDepth, wellWidth)

    this.state = {
      mode: 'GAME_OVER',
      wellStateId: -1,
      wellStates: [],
      replay: [],
    }
  }

  setState (state) {
    this.state = state
  }

  startAi () {
    const wellStateId = 0

    // GO
    this.setState({
      mode: 'AIPLAYING',
      wellStateId: wellStateId,
      wellStates: [this.firstState],
      replay: [],
    })
  }

  // Accepts the input of a move and attempts to apply that
  // transform to the live piece in the live well.
  // Returns the new state.
  // 1ターンの動作
  handleMove (move) {
    const {
      enemyAi,
      gameIsOver,
      placeFirstPiece
    } = this.props

    const {
      mode,
      replay,
      wellStateId,
      wellStates
    } = this.state

    const nextWellStateId = wellStateId + 1

    let nextReplay
    let nextWellStates

    if (wellStateId in replay && move === replay[wellStateId]) {
      nextReplay = replay
      nextWellStates = wellStates
    } else {
      // Push the new move
      nextReplay = replay.slice(0, wellStateId).concat([move])

      // And truncate the future
      nextWellStates = wellStates.slice(0, wellStateId + 1)
    }

    if (!(nextWellStateId in nextWellStates)) {
      const nextWellState = this.getNextState(nextWellStates[wellStateId], move)
      nextWellStates = nextWellStates.slice().concat([nextWellState])
    }

    const nextWellState = nextWellStates[nextWellStateId]

    const nextMode = gameIsOver(nextWellState) ? 'GAME_OVER'
      : (mode === 'REPLAYING' && !(nextWellStateId in replay)) ? 'PLAYING'
        : mode

    // no live piece? make a new one
    // suited to the new world, of course
    if (nextWellState.piece === null && nextMode !== 'GAME_OVER') {
      nextWellState.piece = placeFirstPiece(enemyAi(nextWellState.well))
    }

    this.setState({
      mode: nextMode,
      wellStateId: nextWellStateId,
      wellStates: nextWellStates,
      replay: nextReplay
    })
  }

  update () {
    const {
      mode,
      replay,
      wellStateId,
      wellStates
    } = this.state

    const {
      playerAi
    } = this.props

    if (mode === 'PLAYING' || mode === 'REPLAYING' || mode === 'AIPLAYING') {
      if (mode === 'AIPLAYING' && !(wellStateId in replay)) {
        const wellState = wellStates[wellStateId]
        playerAi(wellState.well, wellState.piece.id).forEach(move => {
          replay.push(move)
        })
      }
      if (wellStateId in replay) {
        this.handleMove(replay[wellStateId])
      } else {
        console.warn('Ignoring redo event because end of history has been reached')
      }
      return true
    } else {
      return false
    }
  }

  printWell () {
    const {
      wellStates,
      wellStateId,
      wellWidth
    } = this.state
    const well = wellStates[wellStateId].well
    well.forEach(row => {
      logger.debug(('0000000000' + row.toString(2)).slice(-10))
    })
    logger.debug()
  }

  run () {
    this.startAi()
    while (this.update()) {
      this.printWell()
    }

    const {
      wellStates,
      wellStateId
    } = this.state
    const score = wellStates[wellStateId].score
    console.log(score)
  }
}

export default Game
