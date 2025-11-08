<template>
  <header class="app-header no-print">
    <nav class="tabs">
      <RouterLink to="/">GenAI 홈</RouterLink>
      <RouterLink to="/seating">자리 배치</RouterLink>
      <RouterLink to="/attendance">출결 관리</RouterLink>
      <RouterLink to="/messages">메신저 정리</RouterLink> <RouterLink to="/admin">설정 (관리)</RouterLink>
    </nav>
  </header>
  <main>
    <RouterView />
  </main>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<style>
/* 탭 스타일 (변경 없음) */
.app-header {
  background-color: #343a40;
  padding: 15px 0;
  display: flex;
  justify-content: center;
}
.tabs {
  display: flex;
  gap: 10px;
  flex-wrap: wrap; /* [수정] 탭이 많아지면 줄바꿈 */
}
.tabs a {
  padding: 10px 20px;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: background-color 0.2s;
}
.tabs a:hover {
  background-color: #495057;
}
.tabs a.router-link-exact-active {
  background-color: #4dabf7;
}
</style>