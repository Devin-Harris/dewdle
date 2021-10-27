import { defineComponent, onMounted } from 'vue'
import Avatar from './Avatar.vue'

export default defineComponent({
  components: {
    Avatar
  },

  props: {
    players: {
      type: Array,
      required: true
    }
  },

  setup(props) {
    onMounted(() => {
    })
  }
})