// src/stores/app.js
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useAppStore = defineStore('app', () => {
  const apiKey = ref(localStorage.getItem('GEMINI_API_KEY') || '')
  const adminInfo = ref(localStorage.getItem('ADMIN_INFO') || '')

  const defaultSettings = {
    menstrualLimit: 1,
    expDomesticLimit: 7,
    expInternationalLimit: 30
  }
  const attendanceSettings = ref(
    JSON.parse(localStorage.getItem('ATTENDANCE_SETTINGS')) || defaultSettings
  )

  // [추가] apiKey가 변경되면 로컬 스토리지에 저장
  watch(apiKey, (newKey) => {
    localStorage.setItem('GEMINI_API_KEY', newKey)
  })

  // [추가] adminInfo가 변경되면 로컬 스토리지에 저장
  watch(adminInfo, (newInfo) => {
    localStorage.setItem('ADMIN_INFO', newInfo)
  })

  watch(attendanceSettings, (newSettings) => {
    localStorage.setItem('ATTENDANCE_SETTINGS', JSON.stringify(newSettings))
  }, { deep: true })

  function setApiKey(key) {
    apiKey.value = key
  }
  function setAdminInfo(info) {
    adminInfo.value = info
  }
  function saveAttendanceSettings(settings) {
    attendanceSettings.value = settings
  }
  
  // [수정됨] setLastResetMonth 액션 제거

  return { 
    apiKey, 
    adminInfo, 
    attendanceSettings,
    setApiKey, 
    setAdminInfo,
    saveAttendanceSettings,
  }
})