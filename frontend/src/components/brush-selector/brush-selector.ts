import { defineComponent, ref } from 'vue'
import BrushSizes from '@/interfaces/brush-sizes_selections'

export default defineComponent({
  props: {
    brushSize: {
      type: Object,
      required: true
    },
    brushTool: {
      type: Object,
      required: true
    }
  },

  emits: ['brush-size-selection', 'brush-tool-selection'],

  setup(props) {

    const brushTools = ref([
      { icon: 'fa-paint-brush', type: 'brush' },
      { icon: 'fa-eraser', type: 'eraser' },
      { icon: 'fa-fill', type: 'bucket' },
      { icon: 'fa-trash', type: 'clear' },
    ])

    return {
      BrushSizes,
      brushTools
    }
  }
})