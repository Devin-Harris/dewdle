<template>
  <div class="brush-selector">
    <div class="sizes">
      <div
        v-for="size in BrushSizes"
        :key="size.size"
        class="size"
        :class="{ selected: brushSize.size === size.size }"
        :style="{
          width: size.size + 'px',
          height: size.size + 'px',
        }"
        @click="$emit('brush-size-selection', size)"
      />
    </div>
    <div class="tools">
      <div
        v-for="tool in brushTools"
        :key="tool.type"
        class="tool"
        :class="{ selected: brushTool.type === tool.type }"
        @click="$emit('brush-tool-selection', tool)"
      >
        <i class="fas" :class="tool.icon"></i>
      </div>
    </div>
  </div>
</template>

<script src="./brush-selector.ts" lang="ts"></script>
<style src="./brush-selector.scss" lang="scss"></style>