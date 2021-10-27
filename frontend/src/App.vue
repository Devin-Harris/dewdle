<template>
  <router-view v-if="hasClientInitialized" />
</template>

<script lang="ts">
import {
  defineComponent,
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  onUnmounted,
} from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { eventTypes } from "@/interfaces/event_types";

export default defineComponent({
  setup() {
    const store = useStore();
    const socket = computed(() => store.getters.getSocket);
    const router = useRouter();
    const hasClientInitialized = ref(false);

    onMounted(async () => {
      await store.dispatch("initializeSocket");
      socket.value.onmessage = socketOnMessage;
      socket.value.onclose = (event: any) => {
        router.push("/");
      };
    });

    onBeforeUnmount(async () => {
      if (socket.value) {
        await socket.value.close();
      }
    });
    onUnmounted(() => {
      hasClientInitialized.value = false;
    });

    function socketOnMessage(event: any) {
      const { type, data } = JSON.parse(event.data);
      if (type === eventTypes.GET_CLIENT_INFO) {
        store.commit("setClientInfo", data);
        hasClientInitialized.value = true;
      }
    }

    return {
      hasClientInitialized,
    };
  },
});
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Montserrat", sans-serif;
}

html,
body {
  overflow-x: hidden;
}
</style>
