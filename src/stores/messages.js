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
    log.value.unshift(entry) // 새 항목을 맨 위에 추가

    // 이력은 최대 50개까지만 보관 (선택 사항)
    if (log.value.length > 50) {
      log.value.pop()
    }
  }

  // 이력 삭제
  function deleteLog(id) {
    log.value = log.value.filter(entry => entry.id !== id)
  }

  return { log, addLog, deleteLog }
})