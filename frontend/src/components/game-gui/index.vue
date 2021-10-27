<template>
  <div class="game-gui">
    <div v-if="showingScores" class="showing-scores">
      <p v-if="game.isOver" class="game-over-header">Game over!</p>
      <div class="scores">
        <div
          v-for="player in game.players.sort((a, b) =>
            game.isOver
              ? b.score - a.score
              : b.lastPointsAdded - a.lastPointsAdded
          )"
          :key="player.id"
          class="score"
        >
          <avatar :size="45" :username="player.name" />
          <div class="score_text">
            <div class="score_text_name">{{ player.name }}</div>
            <div
              class="score_text_number"
              :class="{
                plain: game.isOver || !player.lastPointsAdded,
                subtracting:
                  (!game.isOver && player.lastPointsAdded < 0) ||
                  (game.isOver && player.score < 0),
              }"
            >
              {{ game.isOver ? "" : player.lastPointsAdded >= 0 ? "+" : "-" }}
              {{
                game.isOver
                  ? player.score
                    ? player.score
                    : 0
                  : player.lastPointsAdded
                  ? Math.abs(player.lastPointsAdded)
                  : 0
              }}
            </div>
          </div>
        </div>
      </div>

      <button
        v-if="game.isOver && isClientGameCreator"
        class="btn"
        @click="$emit('restart-game')"
      >
        Return to lobby
      </button>
    </div>
    <div v-else-if="showingNewRound" class="new-round">
      Round {{ game.currentRound }}
    </div>
    <div v-else-if="game.currentWord === ''" class="choosing-word">
      <div v-if="isClientGameDrawer" class="word-choices">
        <p>Choose a word to draw</p>
        <div class="words">
          <button
            v-for="word in game.wordChoices"
            :key="word"
            class="word"
            @click="$emit('word-selected', word)"
          >
            {{ word }}
          </button>
        </div>
      </div>
      <div v-else class="drawer-is-choosing-word">
        <p>{{ game.drawer.name }} is choosing a word...</p>
      </div>
    </div>

    <template v-if="!game.isOver">
      <div class="game-gui_scores">
        <div
          v-for="player in game.players.sort((a, b) => b.score - a.score)"
          :key="player.id"
          class="game-gui_scores_score"
        >
          <avatar
            class="game-gui_scores_score_avatar"
            :class="{ correct: player.answeredCorrectly }"
            :size="50"
            :username="player.name"
            backgroundColor="#725ac1"
          />
          <div class="game-gui_scores_score_number">
            <p :id="'gui_scores_score_number_' + player.id">
              {{ player.score ? player.score : 0 }}
            </p>
          </div>
          <div
            v-if="game.drawer.id === player.id"
            class="game-gui_scores_score_drawing"
          >
            <i class="fas fa-pencil-alt"></i>
          </div>
        </div>
      </div>

      <div class="game-gui_grid">
        <span></span>
        <div class="game-gui_timer">
          <div
            v-if="game.currentRound && game.rounds"
            class="game-gui_timer_rounds"
          >
            Round {{ game.currentRound }} / {{ game.rounds }}
          </div>
          <div
            v-if="formattedRemainingTime"
            class="game-gui_timer_remaining-time"
          >
            {{ formattedRemainingTime }}
          </div>
        </div>
        <span></span>

        <div class="game-gui_selections">
          <template v-if="isClientGameDrawer">
            <div class="game-gui_selections_brushs">
              <BrushSelector
                :brushSize="brushSize"
                :brushTool="brushTool"
                @brush-size-selection="setBrushSize($event)"
                @brush-tool-selection="setBrushTool($event)"
              />
            </div>
            <div class="game-gui_selections_colors">
              <ColorSelector
                :selectedColor="canvasColor"
                @color-selection="setColor($event)"
              />
            </div>
          </template>
        </div>
        <div class="game-gui_canvas">
          <drawing-canvas
            :canvasSrc="isClientGameDrawer ? '' : canvasSrc"
            :clearCanvasKey="clearCanvasKey"
            :color="canvasColor"
            :brushSize="brushSize"
            :brushTool="brushTool"
            :disabled="!isClientGameDrawer"
            @send-canvas-data="$emit('send-canvas-data', $event)"
          />
        </div>
        <div class="game-gui_chat">
          <chat
            :messages="game.messages"
            @send-message="$emit('send-message', $event)"
          />
        </div>

        <div v-if="game.currentWord !== ''" class="game-gui_word">
          <span>{{ game.currentWord.split(" ").join("&nbsp;") }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script src="./game-gui.ts" lang="ts"></script>
<style src="./game-gui.scss" lang="scss"></style>