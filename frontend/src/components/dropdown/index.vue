<template>
  <div class="dropdown">
    <div
      ref="dropdownLabel"
      class="dropdown_label"
      @click="toggleIsDropdownOpen()"
    >
      <p>{{ selectedItem }}</p>
      <i
        class="fas fa-chevron-down"
        :class="{
          'rotate-up': isDropdownOpen,
        }"
      ></i>
    </div>

    <div v-if="isDropdownOpen" class="dropdown_items">
      <div
        v-for="item in items"
        :key="item"
        class="dropdown_items_item"
        @click="selectItem(item)"
      >
        <p>{{ item }}</p>
      </div>
    </div>
  </div>
</template>

<script src="./dropdown.ts" lang="ts"></script>
<style src="./dropdown.scss" lang="scss"></style>