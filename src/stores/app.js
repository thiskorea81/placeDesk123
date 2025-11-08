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

  // [수정됨] lastResetYearMonth 관련 상태 및 watch 제거

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