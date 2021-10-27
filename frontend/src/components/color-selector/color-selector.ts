import { defineComponent } from 'vue'
import ColorSelections from '@/interfaces/color_selections'

export default defineComponent({

  props: {
    selectedColor: {
      type: String,
      required: true
    }
  },

  emits: ['color-selection'],

  setup(props) {

    return {
      ColorSelections
    }
  }
})