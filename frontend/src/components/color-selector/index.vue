<template>
  <div class="color-selector">
    <div
      v-for="color in ColorSelections"
      :key="color"
      class="color"
      :class="{ selected: selectedColor === color }"
      :style="{ backgroundColor: color }"
      @click="$emit('color-selection', color)"
    ></div>
  </div>
</template>

<script src="./color-selector.ts" lang="ts"></script>
<style src="./color-selector.scss" lang="scss"></style>