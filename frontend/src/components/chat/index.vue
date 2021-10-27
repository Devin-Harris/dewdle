<template>
  <div class="chat-container">
    <div ref="messagesRef" class="messages">
      <div
        v-for="(message, index) in messages"
        :key="(message, index)"
        class="message"
        :class="{
          'my-message': isMessageMyMessage(message),
          'correct-guess': message.message.isCorrectGuess,
        }"
      >
        <div class="avatar-wrapper">
          <avatar
            v-if="!isMessageMyMessage(message)"
            :size="25"
            :username="message.sender.name"
          />
        </div>
        <div class="message_text">
          <p class="message_text_name">{{ message.sender.name }}</p>
          <p class="message_text_message">
            <i
              v-if="message.message.isCorrectGuess"
              class="fas fa-check-circle"
            ></i>
            {{ message.message.message }}
          </p>
        </div>
      </div>
    </div>

    <div class="send-message">
      <textarea
        placeholder="Type something..."
        type="text"
        v-model="message"
        @keydown.enter.prevent="sendMessage()"
      />
      <button @click="sendMessage()"><i class="fas fa-reply"></i></button>
    </div>
  </div>
</template>

<script src="./chat.ts" lang="ts"></script>
<style src="./chat.scss" lang="scss"></style>