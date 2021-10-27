import { defineComponent, onMounted, onBeforeUnmount, computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useStore } from 'vuex'
import { eventTypes } from '@/interfaces/event_types'
import router from "@/router";

export default defineComponent({
  components: {},

  setup(props) {
    const store = useStore();
    const socket = computed(() => store.getters.getSocket)
    const route = useRoute()
    const name = ref('')
    const id = ref('')
    const title = ref()
    const titleContainer = ref()

    onMounted(async () => {
      if (!socket.value) await store.dispatch('initializeSocket')
      socket.value.onmessage = socketOnMessage
      if (route.query.gameId) id.value = String(route.query.gameId)

      titleContainer.value.addEventListener('mousemove', animateTitle)
      titleContainer.value.addEventListener('mouseleave', resetTitle)
    })
    onBeforeUnmount(() => {
      titleContainer.value.removeEventListener('mousemove', animateTitle)
      titleContainer.value.removeEventListener('mouseleave', resetTitle)
    })

    watch(socket, () => {
      if (socket.value) {
        socket.value.onmessage = socketOnMessage
      }
    })

    function resetTitle() {
      const before = titleContainer.value.parentElement.querySelector('.title_before')
      before.style.transition = '.3s'
      before.style.top = 8 + 'px'
      before.style.left = -8 + 'px'
      const after = titleContainer.value.parentElement.querySelector('.title_after')
      after.style.transition = '.3s'
      after.style.top = 2 * 8 + 'px'
      after.style.left = 2 * -8 + 'px'
    }
    function animateTitle(e: MouseEvent) {
      const titleBounds = titleContainer.value.getBoundingClientRect()
      const centerOfTitleX = titleBounds.x + (titleBounds.width / 2)
      const centerOfTitleY = titleBounds.y + (titleBounds.height / 2)

      const mouseX = e.clientX
      const mouseY = e.clientY
      const diffFromCenterX = centerOfTitleX - mouseX
      const diffFromCenterY = centerOfTitleY - mouseY
      if (Math.abs(diffFromCenterX) === titleBounds.width / 2 || Math.abs(diffFromCenterY) === titleBounds.height / 2) return
      const percentageOfDiffX = diffFromCenterX / titleBounds.width
      const percentageOfDiffY = diffFromCenterY / titleBounds.height

      const magnitude = 24
      const defaultTop = magnitude
      const defaultLeft = -1 * magnitude

      const before = titleContainer.value.parentElement.querySelector('.title_before')
      before.style.transition = '0s'
      before.style.top = defaultTop * percentageOfDiffY + 'px'
      before.style.left = defaultLeft * percentageOfDiffX + 'px'
      const after = titleContainer.value.parentElement.querySelector('.title_after')
      after.style.transition = '0s'
      after.style.top = 2 * defaultTop * percentageOfDiffY + 'px'
      after.style.left = 2 * defaultLeft * percentageOfDiffX + 'px'
    }

    function socketOnMessage(event: any) {
      const { type, data } = JSON.parse(event.data)
      if (type === eventTypes.CREATE_GAME) {
        router.push(`/game/${data.id}`)
      } else if (type === eventTypes.JOINED_GAME) {
        router.push(`/game/${data.id}`)
      }
    }
    async function createGame() {
      if (!socket.value || socket.value.readyState !== 1) {
        await store.dispatch("initializeSocket");
      }
      socket.value.send(JSON.stringify({
        type: eventTypes.CREATE_GAME,
        data: name.value,
        clientId: store.getters.getClientInfo ? store.getters.getClientInfo.id : null
      }))
    }
    async function joinGame() {
      if (!socket.value || socket.value.readyState !== 1) {
        await store.dispatch("initializeSocket");
      }
      socket.value.send(JSON.stringify({
        type: eventTypes.JOIN_GAME,
        data: { name: name.value, id: id.value },
        clientId: store.getters.getClientInfo ? store.getters.getClientInfo.id : null
      }))
    }

    return {
      createGame,
      joinGame,
      name,
      id,
      title,
      titleContainer
    }
  },
});