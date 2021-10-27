<template>
  <div class="home">
    <div class="title-container" ref="titleContainer">
      <div class="text">
        <h1 class="title" ref="title">dewdle</h1>
        <h1 class="title title_before">dewdle</h1>
        <h1 class="title title_after">dewdle</h1>
      </div>
    </div>

    <div class="inputs">
      <div class="input">
        <label for="name">Name</label>
        <input
          name="name"
          class="input-name"
          v-model="name"
          type="text"
          placeholder="Enter your name"
        />
      </div>
      <div class="input">
        <label for="id">Game Id</label>
        <input
          class="input-id"
          name="id"
          v-model="id"
          type="text"
          placeholder="Enter a game id"
        />
      </div>
    </div>

    <div class="buttons">
      <button
        :class="{ disabled: name === '' }"
        class="btn"
        @click="createGame"
      >
        Create
      </button>
      <button :class="{ disabled: name === '' }" class="btn" @click="joinGame">
        {{ id ? "Join" : "Join random" }}
      </button>
    </div>
  </div>
</template>

<script src="./home.ts" lang="ts"></script>
<style src="./home.scss" lang="scss"></style>

