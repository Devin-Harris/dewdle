<template>
  <div class="game-lobby">
    <div class="settings">
      <div class="settings_field players">
        <p class="settings_field_label">Players</p>
        <player-icons :players="game.players" />
      </div>
      <div class="settings_field rounds">
        <p class="settings_field_label">Rounds</p>
        <dropdown
          :class="{ disabled: !isClientGameCreator }"
          :selectedItem="game.rounds"
          :items="roundSelections"
          @selected-item="$emit('rounds-update', $event)"
        />
      </div>
      <div class="settings_field draw-time">
        <p class="settings_field_label">Draw time</p>
        <dropdown
          :class="{ disabled: !isClientGameCreator }"
          :selectedItem="game.drawTime"
          :items="drawTimeSelections"
          @selected-item="$emit('draw-time-update', $event)"
        />
      </div>
      <div class="settings_field invite">
        <p class="settings_field_label" @click="copyInviteId()" tabindex="0">
          Invite Id <i class="fas fa-copy"></i>
        </p>
        <div class="invite_input">
          <input type="text" :value="route.params.id" readonly />
        </div>
      </div>
      <div class="settings_field start">
        <button
          @click="$emit('start-game')"
          class="btn"
          :class="{ disabled: !canStartGame }"
        >
          Start Game
        </button>
      </div>
    </div>
    <div class="chat">
      <chat
        :messages="game.messages"
        @send-message="$emit('send-message', $event)"
      />
    </div>
  </div>
</template>

<script src="./game-lobby.ts" lang="ts"></script>
<style src="./game-lobby.scss" lang="scss"></style>

