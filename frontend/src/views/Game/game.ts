import { defineComponent, ref, onMounted, onBeforeUnmount, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from 'vuex'
import { eventTypes } from '@/interfaces/event_types'
import GameGui from "@/components/game-gui/index.vue";
import GameLobby from "@/components/game-lobby/index.vue";

export default defineComponent({
  components: {
    GameGui,
    GameLobby
  },

  setup(props) {
    const store = useStore();
    const socket = computed(() => store.getters.getSocket)
    const route = useRoute()
    const router = useRouter()
    const game = ref()
    const canvasSrc = ref('')
    const clearCanvasKey = ref(0)
    const loadingGui = ref(false)
    const showingNewRound = ref(false)
    const showingScores = ref(false)

    socket.value.onmessage = socketOnMessage
    socket.value.send(JSON.stringify({ type: eventTypes.GET_GAME_INFO, data: route.params.id }))

    onMounted(() => {
      if (!store.getters.getClientInfo.id) router.push('/')
    })
    onBeforeUnmount(() => {
      socket.value.send(JSON.stringify({ type: eventTypes.LEAVING_GAME }))
    })

    function socketOnMessage(event: any) {
      const { type, data } = JSON.parse(event.data)
      if (type === eventTypes.PLAYER_JOINED) {
        socket.value.send(JSON.stringify({ type: eventTypes.GET_GAME_INFO, data: route.params.id }))
      } else if (type === eventTypes.GET_GAME_INFO) {
        if (data && data.started && !game.value.started) {
          // Game has just started
          loadingGui.value = true
          setTimeout(() => {
            loadingGui.value = false
          }, 2000)
        }
        game.value = data
      } else if (type === eventTypes.NEW_MESSAGE) {
        game.value = data
      } else if (type === eventTypes.UNNAMED_CLIENT_GAME_JOIN) {
        router.push(`/?gameId=${data.id}`)
      } else if (type === eventTypes.NO_GAME_FOUND) {
        router.push('/')
      } else if (type === eventTypes.CANVAS_DRAW) {
        canvasSrc.value = data
      } else if (type === eventTypes.CLEAR_CANVAS) {
        clearCanvasKey.value = clearCanvasKey.value + 1
        game.value = data
      } else if (type === eventTypes.GAME_OVER) {
        // Show total scores
        game.value = data
        // Show scores for that drawing
        showingScores.value = true
      } else if (type === eventTypes.RESTART_GAME) {
        // Show total scores
        game.value = data
        // Hide scores
        showingScores.value = false
      } else if (type === eventTypes.NEW_ROUND) {
        game.value = data
        // Show the new round popup
        showingNewRound.value = true
        const time = showingScores.value ? 9000 : 5000
        setTimeout(() => {
          showingNewRound.value = false
        }, time)
      } else if (type === eventTypes.ASSIGNED_NEW_DRAWER) {
        game.value = data
        // Show scores for that drawing
        showingScores.value = true
        setTimeout(() => {
          showingScores.value = false
        }, 5000)
      }
    }

    function sendCanvasData(data: any) {
      socket.value.send(JSON.stringify({ type: eventTypes.CANVAS_DRAW, data: { canvasSrc: data, gameId: game.value.id } }))
    }
    function sendMessage(message: string) {
      socket.value.send(JSON.stringify({ type: eventTypes.CHAT, data: { gameId: route.params.id, message } }))
    }
    function updateRoundsGameInfo(rounds: any) {
      socket.value.send(JSON.stringify({ type: eventTypes.UPDATE_GAME_INFO, data: { gameId: route.params.id, rounds } }))
    }
    function updateDrawTimeGameInfo(drawTime: any) {
      socket.value.send(JSON.stringify({ type: eventTypes.UPDATE_GAME_INFO, data: { gameId: route.params.id, drawTime } }))
    }
    function startGame() {
      socket.value.send(JSON.stringify({ type: eventTypes.START_GAME, data: { gameId: route.params.id } }))
    }
    function selectWord(word: string) {
      socket.value.send(JSON.stringify({ type: eventTypes.WORD_SELECTION, data: { gameId: route.params.id, word } }))
    }
    function nextDrawer() {
      socket.value.send(JSON.stringify({ type: eventTypes.NEXT_DRAWER, data: { gameId: route.params.id } }))
    }
    function clearCanvas() {
      socket.value.send(JSON.stringify({ type: eventTypes.CLEAR_CANVAS, data: { gameId: route.params.id } }))
    }
    function showNewLetter() {
      socket.value.send(JSON.stringify({ type: eventTypes.SHOW_NEW_LETTER, data: { gameId: route.params.id } }))
    }
    function restartGame() {
      socket.value.send(JSON.stringify({ type: eventTypes.RESTART_GAME, data: { gameId: route.params.id } }))
      showingScores.value = false
    }

    return {
      sendCanvasData,
      game,
      sendMessage,
      updateRoundsGameInfo,
      updateDrawTimeGameInfo,
      startGame,
      canvasSrc,
      loadingGui,
      selectWord,
      nextDrawer,
      showingScores,
      showingNewRound,
      clearCanvasKey,
      clearCanvas,
      showNewLetter,
      restartGame
    }

  },
});