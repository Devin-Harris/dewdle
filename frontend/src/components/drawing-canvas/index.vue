<template>
  <div
    class="drawing-canvas"
    :style="{
      cursor: `url('${brushSize.cursor}') ${Math.ceil(
        brushSize.size / 2
      )} ${Math.ceil(brushSize.size / 2)}, pointer`,
    }"
  >
    <div
      ref="canvasContainer"
      class="canvas-container"
      @mousedown="setPosition($event)"
      @mouseup="sendCanvasData()"
      @mouseenter="setPosition($event)"
      @mousemove="draw($event)"
      @click.stop="clickOnCanvas($event)"
    >
      <canvas
        width="900"
        height="675"
        ref="canvas"
        :class="{ disabled: disabled }"
      ></canvas>
    </div>
  </div>
</template>

<script src="./drawing-canvas.ts" lang="ts"></script>
<style src="./drawing-canvas.scss" lang="scss"></style>

