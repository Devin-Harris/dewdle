<template>
  <div class="player-icons">
    <div v-for="player in players" :key="player.id" class="player_icon">
      <avatar :size="70" :username="player.name ? player.name : ''" />
      <p>{{ player.name }}</p>
    </div>
  </div>
</template>

<script src="./player-icons.ts" lang="ts"></script>
<style src="./player-icons.scss" lang="scss"></style>