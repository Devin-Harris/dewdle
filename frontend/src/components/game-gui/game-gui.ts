import { defineComponent, computed, ref, onUnmounted, onMounted, watch } from "vue"
import { useStore } from "vuex";
import DrawingCanvas from "@/components/drawing-canvas/index.vue";
import Avatar from '@/components/player-icons/Avatar.vue'
import Chat from '@/components/chat/index.vue'
import BrushSelector from '@/components/brush-selector/index.vue'
import BrushSizes from '@/interfaces/brush-sizes_selections'
import ColorSelector from '@/components/color-selector/index.vue'
import ColorSelections from '@/interfaces/color_selections'

export default defineComponent({
  components: {
    Avatar,
    Chat,
    DrawingCanvas,
    ColorSelector,
    BrushSelector
  },

  props: {
    game: {
      type: Object as any,
      required: true
    },
    canvasSrc: {
      type: String,
      required: false
    },
    clearCanvasKey: {
      type: Number,
      required: false
    },
    showingNewRound: {
      type: Boolean,
      required: false
    },
    showingScores: {
      type: Boolean,
      required: false
    }
  },

  emits: ['send-canvas-data', 'restart-game', 'send-message', 'word-selected', 'no-remaining-time', 'clear-canvas', 'show-letter-interval'],

  setup(props, { emit }) {
    const store = useStore();
    const canvasColor = ref(ColorSelections[1])
    const brushSize = ref(BrushSizes[0])
    const brushTool = ref({ icon: 'fa-paint-brush', type: 'brush' })
    const remainingTime = ref(0)
    var remainingTimeInterval = setInterval(() => { updateRemainingTime() }, 1000)
    var showNewLetterTimeInterval = setInterval(() => { updateShownLetters() }, 1000)

    const isClientGameDrawer = computed(() => {
      return props.game.drawer && (store.getters.getClientInfo ? store.getters.getClientInfo.id : null) === props.game.drawer.id
    })
    const isClientGameCreator = computed(() => {
      return props.game.creator && (store.getters.getClientInfo ? store.getters.getClientInfo.id : null) === props.game.creator.id
    })
    const formattedRemainingTime = computed(() => {
      let minutes = Math.floor(remainingTime.value / 60)
      if (minutes < 0) minutes = 0
      let seconds = remainingTime.value - (minutes * 60)

      let secondsString = String(seconds)
      if (seconds < 10) secondsString = '0' + String(seconds)

      return String(minutes) + ':' + secondsString
    })

    watch(() => props.game.currentWord, () => {
      if (props.game.currentWord) {
        updateRemainingTime()
        startTimeInterval()
        startShownLetterInterval()
      } else {
        clearTimeInterval()
        clearShownLetterInterval()
      }
    })
    watch(() => props.game, () => {
      props.game.players.forEach((player: any) => {
        setMaxWidthHeight(player.id)
      })
    })
    watch(() => props.showingScores, () => {
      props.game.players.forEach((player: any) => {
        setMaxWidthHeight(player.id)
      })
    })
    watch(() => props.showingNewRound, () => {
      props.game.players.forEach((player: any) => {
        setMaxWidthHeight(player.id)
      })
    })

    onMounted(() => {
      if (props.game.currentWord) {
        updateRemainingTime()
        startTimeInterval()
        startShownLetterInterval()
      } else {
        clearTimeInterval()
        clearShownLetterInterval()
      }
    })
    onUnmounted(() => {
      clearTimeInterval()
      clearShownLetterInterval()
    })

    function startTimeInterval() {
      if (remainingTimeInterval) clearTimeInterval()
      remainingTimeInterval = setInterval(() => { updateRemainingTime() }, 1000)
    }
    function clearTimeInterval() {
      clearInterval(remainingTimeInterval)
    }
    function updateRemainingTime() {
      const dateNow = new Date(Date.now()).getTime()
      const dateRoundStarted = new Date(props.game.currentRoundTimestamp).getTime()
      const drawTimeInMilliseconds = props.game.drawTime * 1000
      const timeLeftMilliseconds = drawTimeInMilliseconds - (dateNow - dateRoundStarted)
      if (props.game.currentRoundTimestamp) {
        remainingTime.value = Math.ceil(timeLeftMilliseconds / 1000)
        if (remainingTime.value <= 0) {
          remainingTime.value = 0
          clearTimeInterval()
          if (isClientGameDrawer.value) emit('no-remaining-time')
        }
      }
    }

    function startShownLetterInterval() {
      if (showNewLetterTimeInterval) clearShownLetterInterval()
      showNewLetterTimeInterval = setInterval(() => { updateShownLetters() }, props.game.currentWordShownLetterInterval * 1000)
    }
    function clearShownLetterInterval() {
      clearInterval(showNewLetterTimeInterval)
    }
    function updateShownLetters() {
      if (props.game.currentWordShownLetterInterval) {
        if (isClientGameDrawer.value) emit('show-letter-interval')
      }
    }

    function setColor(color: string) {
      canvasColor.value = color
    }
    function setBrushSize(size: any) {
      brushSize.value = size
    }
    function setBrushTool(tool: any) {
      if (tool.type === 'clear') {
        emit('clear-canvas')
        return
      }
      brushTool.value = tool
    }
    function setMaxWidthHeight(playerId: string) {
      const elm = document.getElementById(`gui_scores_score_number_${playerId}`)
      if (!elm) return
      elm.style.height = 'unset'
      elm.style.width = 'unset'

      const elmBounds = elm?.getBoundingClientRect()
      if (!elmBounds) return

      const maxSize = Math.max(elmBounds.height, elmBounds.width)
      if (maxSize) {
        elm.style.height = maxSize + 'px'
        elm.style.width = maxSize + 'px'
      }
    }

    return {
      isClientGameDrawer,
      isClientGameCreator,
      canvasColor,
      setColor,
      brushSize,
      setBrushSize,
      brushTool,
      setBrushTool,
      remainingTime,
      formattedRemainingTime,
      startTimeInterval,
      clearTimeInterval,
      updateRemainingTime,
      updateShownLetters

    }
  }
})