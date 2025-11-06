<template>
  <HomeView />
</template>

<script setup>
import HomeView from './views/HomeView.vue';
</script>

<style>
/* 전역 스타일은 assets/main.css에서 관리하므로 여기는 비워두거나 앱 전체에 적용할 특수 스타일만 추가합니다. */
#app {
  min-height: 100vh;
  background-color: #f0f2f5; /* 전체 배경색 예시 */
}
@media print {
  #app {
    background-color: white;
  }
}
</style>