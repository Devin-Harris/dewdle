const express = require('express')
const app = express()
const expressws = require('express-ws')(app)
const { uuid } = require('uuidv4')

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`)
})

app.get('/', (req, res) => {
  try {
    res.send('connected')
  } catch (e) {
    res.send('not connected: ' + e)
  }
})


let clients = []
let games = []

app.ws('/', (ws, req) => {
  clients.some(client => client.socket === ws) || clients.push({ socket: ws, id: uuid() })

  ws.on('message', (msg) => {
    try {
      const { type, data } = JSON.parse(msg)
      const client = clients.find(c => c.socket === ws)

      switch (type) {
        case 'GET_CLIENT_INFO':
          if (!client) return
          ws.send(JSON.stringify({ type: 'GET_CLIENT_INFO', data: { name: client.name, id: client.id } }))
          break
        case 'CREATE_GAME':
          clients = clients.map(c => c.id === client.id ? { ...c, name: data } : c)
          ws.send(createGame(ws))
          break
        case 'JOIN_GAME':
          clients = clients.map(c => c.socket === ws ? { ...c, name: data.name } : c)
          if (data.id) {
            const game = joinGameById(ws, data.id)
            if (!game) {
              // Invalid id passed in
              console.log('Invalid id', data.id)
            }
            sendPlayersJoinedGameMessage(ws, game)
          } else {
            joinRandomGame(ws)
          }
          break
        case 'GET_GAME_INFO':
          let game = games.find(g => g.id === data)
          if (!game) {
            // No game found
            ws.send(JSON.stringify({ type: 'NO_GAME_FOUND', data }))
            return
          }
          if (!game.players.some(player => player.id === client.id)) {
            ws.send(JSON.stringify({ type: 'UNNAMED_CLIENT_GAME_JOIN', data: { ...game, currentWord: game.currentWord ? replaceLettersWithUnderScore(game.currentWord, game.currentWordShownLetterIndexs) : '' } }))
          }
          ws.send(JSON.stringify({
            type, data: {
              ...game,
              currentWord: game.currentWord
                ? client.id === game.drawer.id
                  ? game.currentWord
                  : replaceLettersWithUnderScore(game.currentWord, game.currentWordShownLetterIndexs)
                : ''
            }
          }))
          break
        case 'CANVAS_DRAW':
          if (data.gameId && data.canvasSrc) {
            const gameToDraw = games.find(game => game.id === data.gameId)
            updateGameForAllPlayersInLobby(gameToDraw, type, data.canvasSrc)
          }
          break
        case 'CLEAR_CANVAS':
          const gameToClear = games.find(g => g.id === data.gameId)
          if (gameToClear) updateGameForAllPlayersInLobby(gameToClear, 'CLEAR_CANVAS')
          break
        case 'CHAT':
          handleNewChat(ws, data.gameId, data.message)
          break
        case 'UPDATE_GAME_INFO':
          updateGameInfo(ws, { gameId: data.gameId, rounds: data.rounds, drawTime: data.drawTime })
          break
        case 'START_GAME':
          startGame(ws, data.gameId)
          break
        case 'RESTART_GAME':
          restartGame(ws, data.gameId)
          break
        case 'LEAVING_GAME':
          removePlayerFromGame(ws)
          break
        case 'WORD_SELECTION':
          if (data.gameId && data.word) {
            selectWordForGame(data.gameId, data.word)
          }
          break
        case 'NEXT_DRAWER':
          assignNewDrawer(data.gameId)
          break;
        case 'SHOW_NEW_LETTER':
          showNewLetter(data.gameId)
          break

        default:
          console.log('unrecognized message type')
          break
      }
    } catch (e) {
      console.log(e)
    }
  })

  ws.on('close', (e) => {
    removePlayerFromGame(ws)
    clients = clients.filter(client => client.socket !== ws)
  })
})


/* Helper Functions */

// Game Functions
function removePlayerFromGame(ws) {
  const client = clients.find(client => client.socket === ws)
  if (!client) return
  let gameToNotify = null
  games = games.map(game => {
    const doesGameIncludeLeavingPlayer = game.players.some(player => player.id === client.id)
    if (doesGameIncludeLeavingPlayer) {
      const newPlayers = game.players.filter(p => p.id !== client.id)
      if (newPlayers.length === 0) return null
      if (game.creator.id === client.id) {
        gameToNotify = {
          ...game,
          players: newPlayers,
          creator: newPlayers[0]
        }
      } else {
        gameToNotify = { ...game, players: newPlayers }
      }
      return gameToNotify
    }
    return game
  }).filter(game => game !== null)


  if (!gameToNotify) return
  updateGameForAllPlayersInLobby(gameToNotify)
}
function createGame(ws) {
  const client = clients.find(c => c.socket === ws)
  const newGame = {
    creator: { id: client.id, name: client.name },
    players: [{ id: client.id, name: client.name, }],
    id: uuid(),
    drawer: null,
    started: false,
    isOver: false,
    messages: [],
    rounds: 2,
    drawTime: 30,
    currentRound: 1,
    wordChoices: [],
    currentWord: '',
    currentWordShownLetterIndexs: [],
    currentWordShownLetterInterval: 0,
    currentRoundTimestamp: null
  }
  games.push(newGame)
  return JSON.stringify({ type: 'CREATE_GAME', data: newGame })
}
function joinGameById(ws, id) {
  const client = clients.find(c => c.socket === ws)
  const index = games.findIndex(game => game.id === id)
  if (index === undefined || index === null || !games[index]) return null
  games[index].players.push({ id: client.id, name: client.name })
  return games[index]
}
function joinRandomGame(ws) {
  if (games.length === 0) {
    // Create game instead of joining one
    ws.send(createGame(ws))
    return
  }

  const randomIndex = Math.floor(Math.random() * ALL_WORDS.length - 1)
  const game = { ...joinGameById(ws, games[randomIndex].id) }
  sendPlayersJoinedGameMessage(ws, game)
}
function sendPlayersJoinedGameMessage(ws, game) {
  if (!game) return
  for (let i = 0; i < game.players.length; i++) {
    const playerClient = clients.find(c => c.id === game.players[i].id)
    if (playerClient) {
      playerClient.socket.send(JSON.stringify({
        type: (playerClient.socket !== ws) ? 'PLAYER_JOINED' : 'JOINED_GAME',
        data: {
          ...game,
          currentWord: game.currentWord
            ? playerClient.id === game.drawer.id
              ? game.currentWord
              : replaceLettersWithUnderScore(game.currentWord, game.currentWordShownLetterIndexs)
            : ''
        }
      }))
    }
  }
}
function updateGameInfo(ws, { gameId, rounds, drawTime }) {
  let updatedGame = null
  games = games.map(game => {
    if (game.id === gameId) {
      const client = clients.find(client => client.socket === ws)
      if (!client || game.creator.id !== client.id) return game
      updatedGame = { ...game }
      if (rounds !== undefined) updatedGame.rounds = rounds
      if (drawTime !== undefined) updatedGame.drawTime = drawTime
    }
    return game.id === gameId
      ? updatedGame
      : game
  })

  if (!updatedGame) return
  updateGameForAllPlayersInLobby(updatedGame)
}
function startGame(ws, gameId) {
  let updatedGame = null
  games = games.map(game => {
    if (game.id === gameId) {
      const client = clients.find(client => client.socket === ws)
      if (!client || game.creator.id !== client.id) return game

      updatedGame = {
        ...game,
        started: true,
        isOver: false,
        players: game.players.map(p => {
          return {
            ...p,
            score: 0,
            currentRound: 1,
            currentWord: '',
            currentWordShownLetterIndexs: [],
            lastPointsAdded: 0,
            answeredCorrectly: false
          }
        }),
        messages: [],
        drawer: game.players[game.players.length - 1],
        wordChoices: generate3RandomWords()
      }
    }
    return game.id === gameId
      ? updatedGame
      : game
  })

  if (!updatedGame) return
  updateGameForAllPlayersInLobby(updatedGame)
  updateGameForAllPlayersInLobby(updatedGame, 'NEW_ROUND')
}
function restartGame(ws, gameId) {
  let updatedGame = null
  games = games.map(game => {
    if (game.id === gameId) {
      const client = clients.find(client => client.socket === ws)
      if (!client || game.creator.id !== client.id) return game

      updatedGame = {
        ...game,
        started: false,
        isOver: false,
        currentRound: 1,
        players: game.players.map(p => {
          return {
            ...p,
            score: 0,
            currentRound: 1,
            currentWord: '',
            currentWordShownLetterIndexs: [],
            lastPointsAdded: 0,
            answeredCorrectly: false
          }
        }),
        messages: [],
        drawer: game.players[game.players.length - 1],
        wordChoices: []
      }
    }
    return game.id === gameId
      ? updatedGame
      : game
  })

  if (!updatedGame) return
  updateGameForAllPlayersInLobby(updatedGame, 'RESTART_GAME')
}
function updateGameForAllPlayersInLobby(game, messageType = 'GET_GAME_INFO', data = null) {
  for (let i = 0; i < game.players.length; i++) {
    const playerClient = clients.find(c => c.id === game.players[i].id)
    if (playerClient) {
      playerClient.socket.send(JSON.stringify({
        type: messageType,
        data: data ? data : {
          ...game,
          currentWord: game.currentWord
            ? playerClient.id === game.drawer.id
              ? game.currentWord
              : replaceLettersWithUnderScore(game.currentWord, game.currentWordShownLetterIndexs)
            : ''
        }
      }))
    }
  }
}
function calculateShownLetterForWordInterval(word, drawTime) {
  const numOfNonSpaceChars = word.split('').filter(c => c !== ' ').length
  const maxCharsToShow = Math.floor(numOfNonSpaceChars / 3)
  return Math.floor((drawTime - 10) / maxCharsToShow)
}
function selectWordForGame(gameId, word) {
  let updatedGame = null
  games = games.map(g => {
    if (g.id === gameId) updatedGame = {
      ...g,
      messages: [],
      currentWord: word,
      currentWordShownLetterIndexs: [],
      currentWordShownLetterInterval: calculateShownLetterForWordInterval(word, g.drawTime),
      wordChoices: [],
      currentRoundTimestamp: new Date(Date.now()),
      players: g.players.map(p => { return { ...p, lastPointsAdded: null } })
    }
    return g.id === gameId
      ? updatedGame
      : g
  })

  if (updatedGame) {
    updateGameForAllPlayersInLobby(updatedGame, 'CLEAR_CANVAS')
  }
}
function assignNewDrawer(gameId) {
  let mutatedGame = null
  games = games.map(game => {
    if (game.id === gameId) {
      mutatedGame = { ...game }

      if (mutatedGame.drawer) {
        mutatedGame.wordChoices = generate3RandomWords()
        mutatedGame.currentWord = ''
        mutatedGame.messages = []

        // Take 75% of the fastest correct guess
        // Multiply by percentage of correct guesses
        // Add extra points for everyone guessing correct
        // Remove points for no one guessing correct
        const correctlyAnsweredPlayers = mutatedGame.players.filter(p => p.answeredCorrectly).sort((a, b) => b.lastPointsAdded - a.lastPointsAdded)
        let drawerPoints = 0
        if (correctlyAnsweredPlayers.length > 0) {
          const percentageOfCorrectlyAnsweredPlayers = (correctlyAnsweredPlayers.length / (mutatedGame.players.length - 1))
          const fastedCorrectlyAnsweredPlayer = correctlyAnsweredPlayers[0]
          drawerPoints = .75 * percentageOfCorrectlyAnsweredPlayers * fastedCorrectlyAnsweredPlayer.lastPointsAdded
          if (percentageOfCorrectlyAnsweredPlayers === 1) drawerPoints + 250
          else if (percentageOfCorrectlyAnsweredPlayers === 0) drawerPoints - 250
        } else {
          drawerPoints = -250
        }

        mutatedGame.players = mutatedGame.players.map(player => {
          let updatedPlayer = { ...player, answeredCorrectly: false }
          if (player.id === mutatedGame.drawer.id) {
            updatedPlayer.lastPointsAdded = Math.floor(drawerPoints)
            updatedPlayer.score = updatedPlayer.score + Math.floor(drawerPoints)
          }
          return updatedPlayer
        })

        const drawerPlayerIndex = mutatedGame.players.findIndex(p => p.id === mutatedGame.drawer.id)
        if (drawerPlayerIndex === 0) {
          mutatedGame.drawer = mutatedGame.players[mutatedGame.players.length - 1]

          // Start new round
          if (mutatedGame.currentRound >= mutatedGame.rounds) {
            // Game is over
            mutatedGame.isOver = true
            updateGameForAllPlayersInLobby(mutatedGame, 'GAME_OVER')
          } else {
            mutatedGame.currentRound = mutatedGame.currentRound + 1
            updateGameForAllPlayersInLobby(mutatedGame, 'NEW_ROUND')
            updateGameForAllPlayersInLobby(mutatedGame, 'ASSIGNED_NEW_DRAWER')
          }
        } else {
          mutatedGame.drawer = mutatedGame.players[drawerPlayerIndex - 1]
          updateGameForAllPlayersInLobby(mutatedGame, 'ASSIGNED_NEW_DRAWER')
        }
      } else {
        mutatedGame.drawer = mutatedGame.players[mutatedGame.players.length - 1]
      }

      return mutatedGame
    }
    return game
  })

  if (mutatedGame) updateGameForAllPlayersInLobby(mutatedGame)
}
function showNewLetter(gameId) {
  let mutatedGame = null
  games = games.map(game => {
    if (game.id === gameId) {
      mutatedGame = { ...game }

      const numOfCharactersCurrentlyShown = mutatedGame.currentWordShownLetterIndexs.length
      const showingAtMost3Characters = numOfCharactersCurrentlyShown < 3
      const showingAtMostAThirdOfTheCharacters = numOfCharactersCurrentlyShown < Math.floor(mutatedGame.currentWord.split('').length / 3)
      const currentTime = new Date(Date.now()).getTime()
      const startingTime = mutatedGame.currentRoundTimestamp.getTime()
      const canAddNewCharacter = numOfCharactersCurrentlyShown * mutatedGame.currentWordShownLetterInterval <= currentTime - startingTime
      if (showingAtMost3Characters && showingAtMostAThirdOfTheCharacters && canAddNewCharacter) {
        while (mutatedGame.currentWordShownLetterIndexs.length === numOfCharactersCurrentlyShown) {
          randomIndex = Math.floor(Math.random() * mutatedGame.currentWord.length - 1)
          if (mutatedGame.currentWordShownLetterIndexs.includes(randomIndex)) break
          else if (!mutatedGame.currentWord[randomIndex] || mutatedGame.currentWord[randomIndex] === ' ') break
          else mutatedGame.currentWordShownLetterIndexs.push(randomIndex)
        }
      }

      return mutatedGame
    }
    return game
  })

  if (mutatedGame) updateGameForAllPlayersInLobby(mutatedGame)
}

// Word functions
const ALL_WORDS = require('./words')
function generate3RandomWords() {
  let words = []
  let randomIndex = 0
  while (words.length < 3) {
    randomIndex = Math.floor(Math.random() * ALL_WORDS.length - 1)
    words.includes(ALL_WORDS[randomIndex]) || !ALL_WORDS[randomIndex] || words.push(ALL_WORDS[randomIndex])
  }
  return words
}
function replaceLettersWithUnderScore(inputString, ignoreIndexs) {
  if (inputString === '') return ''
  let currentIndex = -1
  return [...inputString.split(' ').map(ss => ss.split('').map(c => {
    currentIndex += 1
    return ignoreIndexs.includes(currentIndex) ? c : '_'
  }).join(' '))].join('   ')
}

// Chat Functions
function handleNewChat(ws, gameId, message) {
  const gameIndex = games.findIndex(game => game.id === gameId)
  if (gameIndex === undefined || gameIndex === null) return null
  const game = games[gameIndex]

  const { id, name } = clients.find(client => client.socket === ws)
  if (!id || !name) return null

  let updatedGame = { ...game }
  games = games.map(game => {
    if (game.id === gameId) {
      let messageToShow = message
      let isCorrectGuess = false
      if (game.started && message.toLowerCase() === game.currentWord.toLowerCase()) {
        if (id !== game.drawer.id && !game.players.find(p => p.id === id).answeredCorrectly) {
          isCorrectGuess = true
          // Calculate how many points to add
          const maxPoints = 750
          const currentTime = new Date(Date.now()).getTime()
          const dateRoundStarted = new Date(game.currentRoundTimestamp).getTime()
          const drawTimeInMilliseconds = game.drawTime * 1000
          const percentageOfTotalTime = (drawTimeInMilliseconds - (currentTime - dateRoundStarted)) / drawTimeInMilliseconds
          const pointsToAdd = Math.floor(percentageOfTotalTime * maxPoints)

          // Add points to player
          game.players = game.players.map(player => {
            return player.id === id
              ? { ...player, score: player.score ? player.score + pointsToAdd : pointsToAdd, lastPointsAdded: pointsToAdd, answeredCorrectly: true }
              : player
          })
          messageToShow = name + ' has answered correctly!'
        }
      }

      updatedGame = { ...game, messages: [...game.messages, { sender: { id, name }, message: { message: messageToShow, isCorrectGuess } }] }
    }
    return game.id === gameId
      ? updatedGame
      : game
  })

  updateGameForAllPlayersInLobby(updatedGame, 'NEW_MESSAGE')

  // if all players have answered correctly, start new round
  if (updatedGame.started && updatedGame.players.filter(p => p.answeredCorrectly).length === updatedGame.players.length - 1) {
    assignNewDrawer(updatedGame.id)
  }
}

