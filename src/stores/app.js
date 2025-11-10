// src/stores/app.js
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

// [신규] 로컬 스토리지에서 JSON을 안전하게 파싱하는 헬퍼 함수
function getStoredJSON(key, defaultValue) {
  const item = localStorage.getItem(key);
  if (!item) {
    return defaultValue;
  }
  try {
    // 여기서 [object Object] 같은 잘못된 문자열 파싱 시 에러 발생
    return JSON.parse(item);
  } catch (e) {
    console.warn(`localStorage 파싱 오류 (${key}):`, e);
    return defaultValue; // 오류 시 기본값 반환
  }
}

export const useAppStore = defineStore('app', () => {
  const apiKey = ref(localStorage.getItem('GEMINI_API_KEY') || '')
  
  const defaultAdminInfo = { name: '', role: '', homeroom: '' }
  // [수정] adminInfo 로드 시 안전한 헬퍼 함수 사용
  const adminInfo = ref(
    getStoredJSON('ADMIN_INFO', defaultAdminInfo)
  )

  const defaultSettings = {
    menstrualLimit: 1,
    expDomesticLimit: 7,
    expInternationalLimit: 30
  }
  // [수정] attendanceSettings 로드 시 안전한 헬퍼 함수 사용
  const attendanceSettings = ref(
    getStoredJSON('ATTENDANCE_SETTINGS', defaultSettings)
  )

  // [신규] 마지막 AI 브리핑 내용을 저장할 상태 추가
  const lastBriefing = ref(localStorage.getItem('LAST_BRIEFING') || '')

  // --- Watchers (로컬 스토리지에 자동 저장) ---

  watch(apiKey, (newKey) => {
    localStorage.setItem('GEMINI_API_KEY', newKey)
  })

  watch(adminInfo, (newInfo) => {
    localStorage.setItem('ADMIN_INFO', JSON.stringify(newInfo))
  }, { deep: true }) 

  watch(attendanceSettings, (newSettings) => {
    localStorage.setItem('ATTENDANCE_SETTINGS', JSON.stringify(newSettings))
  }, { deep: true })

  // [신규] 마지막 브리핑 내용 감시
  watch(lastBriefing, (newBriefing) => {
    localStorage.setItem('LAST_BRIEFING', newBriefing)
  })

  // --- Actions (상태 변경 함수) ---

  function setApiKey(key) {
    apiKey.value = key
  }
  function setAdminInfo(infoObject) {
    adminInfo.value = infoObject
  }
  function saveAttendanceSettings(settings) {
    attendanceSettings.value = settings
  }
  // [신규] 브리핑 내용 설정 함수
  function setLastBriefing(briefingText) {
    lastBriefing.value = briefingText
  }
  
  return { 
    apiKey, 
    adminInfo, 
    attendanceSettings,
    lastBriefing, // [신규] 외부로 노출
    setApiKey, 
    setAdminInfo,
    saveAttendanceSettings,
    setLastBriefing, // [신규] 외부로 노출
  }
})