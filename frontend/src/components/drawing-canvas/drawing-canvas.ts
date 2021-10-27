import { defineComponent, ref, onMounted, watch, onUnmounted } from "vue";

export default defineComponent({
  components: {},

  props: {
    canvasSrc: {
      type: String,
      required: false
    },
    clearCanvasKey: {
      type: Number,
      required: true
    },
    color: {
      type: String,
      required: false
    },
    brushSize: {
      type: Object,
      required: true
    },
    brushTool: {
      type: Object,
      required: true
    },
    disabled: {
      type: Boolean,
      required: false
    }
  },

  emits: ['send-canvas-data'],

  setup(props, { emit }) {
    const canvas = ref()
    const canvasContainer = ref()
    const ctx = ref()
    const pos = ref({ x: 0, y: 0 })

    watch(() => props.canvasSrc, () => {
      loadCanvasData()
    })
    watch(() => props.clearCanvasKey, () => {
      if (props.clearCanvasKey > 1) {
        ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
      }
    })

    onMounted(() => {
      ctx.value = canvas.value.getContext('2d')
      loadCanvasData()
      window.addEventListener('mousemove', setPosition)
    })
    onUnmounted(() => {
      window.removeEventListener('mousemove', setPosition)
    })

    function setPosition(e: MouseEvent) {
      const rect = canvas.value.getBoundingClientRect();
      const aspectRatio = canvas.value.width / rect.width
      pos.value.x = aspectRatio * (e.clientX - rect.left);
      pos.value.y = aspectRatio * (e.clientY - rect.top) > 0 ? aspectRatio * (e.clientY - rect.top) : 0;
    }

    function draw(e: MouseEvent, wasClick = false) {
      if (props.disabled || (e.buttons !== 1 && !wasClick) || props.brushTool.type === 'bucket') return;

      ctx.value.beginPath();

      ctx.value.lineWidth = props.brushSize.size;
      ctx.value.lineCap = 'round';
      ctx.value.strokeStyle = props.brushTool.type === 'eraser' ? '#FFF' : props.color;

      ctx.value.moveTo(pos.value.x, pos.value.y);
      setPosition(e);
      ctx.value.lineTo(pos.value.x, pos.value.y);

      ctx.value.stroke();
      sendCanvasData()
    }
    function sendCanvasData() {
      if (!props.disabled) emit('send-canvas-data', canvas.value.toDataURL("toDataURL"))
    }
    function loadCanvasData() {
      if (props.canvasSrc) {
        var img = new Image();
        img.onload = function () {
          ctx.value.drawImage(img, 0, 0)
        }
        img.src = props.canvasSrc;
      }
    }

    let imageData = null

    function clickOnCanvas(e: MouseEvent) {
      setPosition(e);
      if (props.brushTool.type === 'bucket') {
        imageData = ctx.value.getImageData(0, 0, ctx.value.canvas.width, ctx.value.canvas.height)
        floodFill(imageData, hexToRgbA(props.color), Math.floor(pos.value.x), Math.floor(pos.value.y))
        ctx.value.putImageData(imageData, 0, 0)
        sendCanvasData()
        return
      }

      draw(e, true);
    }
    function hexToRgbA(hex: any) {
      var r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16),
        a = 255;
      return { r, g, b, a }
    }
    function getColorAtPixel(imageData: any, x: any, y: any) {
      const { width, data } = imageData

      return {
        r: data[4 * (width * y + x) + 0],
        g: data[4 * (width * y + x) + 1],
        b: data[4 * (width * y + x) + 2],
        a: data[4 * (width * y + x) + 3]
      }
    }
    function setColorAtPixel(imageData: any, color: any, x: any, y: any) {
      const { width, data } = imageData

      data[4 * (width * y + x) + 0] = color.r & 0xff
      data[4 * (width * y + x) + 1] = color.g & 0xff
      data[4 * (width * y + x) + 2] = color.b & 0xff
      data[4 * (width * y + x) + 3] = color.a & 0xff
    }
    function colorMatch(a: any, b: any) {
      return a.r === b.r && a.g === b.g && a.b === b.b && (!a.a || !b.a || a.a === b.a)
    }
    function floodFill(imageData: any, newColor: any, x: any, y: any) {
      const { width, height, data } = imageData
      let operator = { x, y }
      const stack = [{ x: operator.x, y: operator.y }]
      const baseColor = getColorAtPixel(imageData, x, y)

      // Check if base color and new color are the same
      if (colorMatch(baseColor, newColor)) {
        return
      }

      // Add the clicked location to stack

      while (stack.length) {
        //@ts-ignore
        operator = stack.pop()
        let contiguousDown = true // Vertical is assumed to be true
        let contiguousUp = true // Vertical is assumed to be true
        let contiguousLeft = false
        let contiguousRight = false

        // Move to top most contiguousDown pixel
        while (contiguousUp && operator.y >= 0) {
          operator.y--
          contiguousUp = colorMatch(getColorAtPixel(imageData, operator.x, operator.y), baseColor)
        }

        // Move downward
        while (contiguousDown && operator.y < height) {
          setColorAtPixel(imageData, newColor, operator.x, operator.y)

          // Check left
          if (operator.x - 1 >= 0 && colorMatch(getColorAtPixel(imageData, operator.x - 1, operator.y), baseColor)) {
            if (!contiguousLeft) {
              contiguousLeft = true
              stack.push({ x: operator.x - 1, y: operator.y })
            }
          } else {
            contiguousLeft = false
          }

          // Check right
          if (operator.x + 1 < width && colorMatch(getColorAtPixel(imageData, operator.x + 1, operator.y), baseColor)) {
            if (!contiguousRight) {
              stack.push({ x: operator.x + 1, y: operator.y })
              contiguousRight = true
            }
          } else {
            contiguousRight = false
          }

          operator.y++
          contiguousDown = colorMatch(getColorAtPixel(imageData, operator.x, operator.y), baseColor)
        }
      }
    }

    return {
      canvas,
      canvasContainer,
      draw,
      setPosition,
      sendCanvasData,
      clickOnCanvas
    }

  },
});