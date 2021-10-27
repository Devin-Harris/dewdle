import { defineComponent, computed, ref } from 'vue'
import { useStore } from "vuex";
import { useRoute } from 'vue-router'
import Chat from '@/components/chat/index.vue'
import PlayerIcons from '@/components/player-icons/index.vue'
import Dropdown from '@/components/dropdown/index.vue'
import { roundSelections } from '@/interfaces/round_selections'
import { drawTimeSelections } from '@/interfaces/draw-time_selections'

export default defineComponent({
  components: {
    PlayerIcons,
    Dropdown,
    Chat
  },

  props: {
    game: {
      type: Object as any,
      required: true
    }
  },

  emits: ['send-message', 'rounds-update', 'draw-time-update', 'start-game'],

  setup(props) {

    // Data
    const store = useStore();
    const route = useRoute()

    // Computed
    const canStartGame = computed(() => {
      return Boolean(props.game.players.length > 1 && isClientGameCreator.value)
    })
    const isClientGameCreator = computed(() => {
      return (store.getters.getClientInfo ? store.getters.getClientInfo.id : null) === props.game.creator.id
    })

    // Methods
    function fallbackCopyTextToClipboard() {
      const textArea = document.createElement("textarea");
      textArea.value = String(route.params.id);
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }

    function copyInviteId() {
      if (!navigator.clipboard) {
        fallbackCopyTextToClipboard();
        return;
      }
      navigator.clipboard.writeText(String(route.params.id)).then(() => {
        console.log('Async: Copying to clipboard was successful!');
      })
    }

    return {
      canStartGame,
      copyInviteId,
      route,
      roundSelections,
      drawTimeSelections,
      isClientGameCreator
    }

  }
})