/**
  HATETRIS
*/

'use strict'

import commander from 'commander'
import log4js from 'log4js'

import getEnemyAi from '../enemy-ais/get-hatetris'
import getPlayerAi from '../player-ais/player-ai'
import getGameIsOver from '../game-over-conditions/get-hatetris'
import getPlaceFirstPiece from '../piece-placement/get-hatetris'
import rotationSystem from '../rotation-systems/hatetris'
import Game from './game-local'

// Fixed attributes of all of Tetris
const bar = 4
const wellDepth = 20 // min = bar
const wellWidth = 10 // min = 4

commander
  .option('-l, --log-level <level>', 'log level', 'info')
  .option('-w, --beam-width <width>', 'width of beam search', 500)
  .option('-d, --beam-depth <depth>', 'depth of beam search', 30)
  .option('-s, --search-params <params>', 'search parameters (comma separated format)', '')
commander.parse(process.argv)

log4js.configure({
  appenders: {
    console: { type: 'console' }
  },
  categories: {
    default: {
      appenders: ['console'],
      level: commander.logLevel
    }
  }
})

const placeFirstPiece = getPlaceFirstPiece(wellWidth)
const gameIsOver = getGameIsOver(bar)
const enemyAi = getEnemyAi(rotationSystem, placeFirstPiece, bar, wellDepth, wellWidth)
const playerAi = getPlayerAi(
  rotationSystem, placeFirstPiece, bar, wellDepth, wellWidth,
  parseInt(commander.beamWidth), parseInt(commander.beamDepth), commander.searchParams
)
const replayTimeout = 30 // milliseconds per frame

const game = new Game({
  bar,
  enemyAi,
  playerAi,
  gameIsOver,
  placeFirstPiece,
  replayTimeout,
  rotationSystem,
  wellDepth,
  wellWidth,
})

game.run()
