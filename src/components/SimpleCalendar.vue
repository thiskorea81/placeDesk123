<template>
    <div class="calendar-widget">
      <div class="calendar-header">
        <button @click="prevMonth">&lt;</button>
        <h2>{{ currentMonthName }} {{ currentYear }}</h2>
        <button @click="nextMonth">&gt;</button>
      </div>
      <div class="calendar-grid days-header">
        <span>일</span>
        <span>월</span>
        <span>화</span>
        <span>수</span>
        <span>목</span>
        <span>금</span>
        <span>토</span>
      </div>
      <div class="calendar-grid dates-grid">
        <div 
          v-for="(day, index) in calendarDays" 
          :key="index" 
          class="calendar-day"
          :class="{ 'is-today': day === today && isCurrentMonth }"
        >
          {{ day }}
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue'
  
  const currentDate = ref(new Date())
  
  // --- 날짜 계산 ---
  const currentYear = computed(() => currentDate.value.getFullYear())
  const currentMonthIndex = computed(() => currentDate.value.getMonth())
  const today = computed(() => new Date().getDate())
  const currentMonthName = computed(() => 
    currentDate.value.toLocaleString('default', { month: 'long' })
  )
  // 현재 뷰가 실제 오늘 날짜가 속한 달인지 확인
  const isCurrentMonth = computed(() => {
    const now = new Date();
    return now.getFullYear() === currentYear.value && now.getMonth() === currentMonthIndex.value
  })
  
  // 달력 그리드 생성
  const calendarDays = computed(() => {
    const year = currentYear.value
    const month = currentMonthIndex.value
  
    // 이 달의 첫 번째 날의 요일 (0=일요일, 1=월요일...)
    const firstDayOffset = new Date(year, month, 1).getDay()
    // 이 달의 마지막 날짜
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const days = []
    
    // 1. 첫 번째 날까지 빈 칸 채우기
    for (let i = 0; i < firstDayOffset; i++) {
      days.push('')
    }
    
    // 2. 날짜 채우기
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    
    return days
  })
  
  // --- 이벤트 핸들러 ---
  const prevMonth = () => {
    currentDate.value = new Date(currentYear.value, currentMonthIndex.value - 1, 1)
  }
  const nextMonth = () => {
    currentDate.value = new Date(currentYear.value, currentMonthIndex.value + 1, 1)
  }
  </script>
  
  <style scoped>
  .calendar-widget {
    width: 100%;
    background: #f8f9fa;
    border-radius: 12px;
    padding: 20px;
  }
  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }
  .calendar-header h2 {
    margin: 0;
    font-size: 1.2em;
    color: #333;
  }
  .calendar-header button {
    background: none;
    border: none;
    font-size: 1.5em;
    cursor: pointer;
    color: #4dabf7;
  }
  
  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 5px;
  }
  .days-header span {
    text-align: center;
    font-weight: 600;
    font-size: 0.9em;
    color: #888;
  }
  .dates-grid {
    margin-top: 10px;
  }
  .calendar-day {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 35px;
    font-size: 0.9em;
    color: #555;
  }
  .calendar-day.is-today {
    background-color: #4dabf7;
    color: white;
    font-weight: bold;
    border-radius: 50%;
  }
  </style>