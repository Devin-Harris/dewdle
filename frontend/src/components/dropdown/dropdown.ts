import { defineComponent, ref, onMounted, onBeforeUnmount } from "vue";

export default defineComponent({
  components: {},

  props: {
    items: {
      type: Array,
      required: true
    },
    selectedItem: {
      required: true
    }
  },

  emits: ['selected-item'],

  setup(props, { emit }) {

    const isDropdownOpen = ref(false)
    const dropdownLabel = ref()

    onMounted(() => {
      document.addEventListener('click', checkForClickOutside)
    })

    onBeforeUnmount(() => {
      document.removeEventListener('click', checkForClickOutside)
    })

    function closeIsDropdownOpen() {
      isDropdownOpen.value = false
    }

    function checkForClickOutside(e: any) {
      if (!dropdownLabel.value) return
      if (!e.path.includes(dropdownLabel.value)) closeIsDropdownOpen()
    }

    function toggleIsDropdownOpen() {
      isDropdownOpen.value = !isDropdownOpen.value
    }

    function selectItem(item: string | number) {
      closeIsDropdownOpen()
      emit('selected-item', item)
    }

    return {
      isDropdownOpen,
      toggleIsDropdownOpen,
      selectItem,
      dropdownLabel
    }

  }
})