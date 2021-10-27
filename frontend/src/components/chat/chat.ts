import store from "@/store";
import { defineComponent, ref, onUpdated } from "vue";
import Avatar from '@/components/player-icons/Avatar.vue'
import { useStore } from "vuex";

export default defineComponent({
  components: {
    Avatar
  },

  props: {
    messages: {
      type: Array,
      required: true
    }
  },

  emits: ['send-message'],

  setup(props, { emit }) {

    const store = useStore();
    const message = ref('')
    const messagesRef = ref()

    onUpdated(() => {
      scrollToBottom()
    })

    function scrollToBottom() {
      messagesRef.value.scrollTop = 2 * messagesRef.value.scrollHeight;
    }

    function sendMessage() {
      emit('send-message', message.value)
      message.value = ''
    }

    function isMessageMyMessage(message: any) {
      return (message.sender.id === store.getters.getClientInfo.id)
    }

    return {
      message,
      sendMessage,
      messagesRef,
      isMessageMyMessage
    }
  }
})