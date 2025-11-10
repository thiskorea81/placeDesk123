// src/stores/messages.js
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useMessagesStore = defineStore('messages', () => {
  // localStorage에서 이력을 불러오거나 빈 배열로 시작
  const log = ref(JSON.parse(localStorage.getItem('MESSAGE_LOG')) || [])

  // 이력이 변경되면 localStorage에 자동 저장
  watch(log, (newLog) => {
    localStorage.setItem('MESSAGE_LOG', JSON.stringify(newLog))
  }, { deep: true })

  // 이력 추가
  function addLog(entry) {
    // { id, date, sender, original, todos, notices }
    
    // [수정] 배열을 직접 수정(unshift)하는 대신, 새 배열을 할당하여 watch가 안정적으로 동작하도록 함
    const newLog = [entry, ...log.value];

    // 이력은 최대 50개까지만 보관 (선택 사항)
    if (newLog.length > 50) {
      newLog.splice(50); // 50개 초과분 잘라내기
    }

    log.value = newLog; // ref에 새 배열 할당
  }

  // 이력 삭제
  function deleteLog(id) {
    log.value = log.value.filter(entry => entry.id !== id)
  }

  return { log, addLog, deleteLog }
})