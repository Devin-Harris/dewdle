<template>
  <div class="game">
    <template v-if="game">
      <template v-if="game.started">
        <div v-if="loadingGui" class="loading-in-gui">
          Loading into game...
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <game-gui
          v-if="!loadingGui"
          :game="game"
          :canvasSrc="canvasSrc"
          :clearCanvasKey="clearCanvasKey"
          :showingNewRound="showingNewRound"
          :showingScores="showingScores"
          @clear-canvas="clearCanvas()"
          @restart-game="restartGame()"
          @send-canvas-data="sendCanvasData($event)"
          @send-message="sendMessage($event)"
          @word-selected="selectWord($event)"
          @no-remaining-time="nextDrawer()"
          @show-letter-interval="showNewLetter()"
        />
      </template>
      <template v-else>
        <game-lobby
          :game="game"
          @send-message="sendMessage($event)"
          @rounds-update="updateRoundsGameInfo($event)"
          @draw-time-update="updateDrawTimeGameInfo($event)"
          @start-game="startGame()"
        />
      </template>
    </template>
  </div>
</template>

<script src="./game.ts" lang="ts"></script>
<style src="./game.scss" lang="scss"></style>

