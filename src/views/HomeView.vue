<template>
  <div class="container">
    <header class="mb-20 text-center">
      <h1>교사 대시보드</h1>
    </header>

    <div class="dashboard-grid">
      <div class="dashboard-widget calendar-container">
        <SimpleCalendar />
      </div>

      <div class="dashboard-widget todo-container">
        <h3>📌 To-Do List</h3>
        <div class="todo-input-group">
          <input 
            type="text" 
            v-model="newTodoText" 
            @keyup.enter="handleAddTodo" 
            placeholder="새 할 일 추가..." 
            class="form-control"
          />
          <button @click="handleAddTodo" class="btn btn-primary">+</button>
        </div>
        <ul class="todo-list">
          <li v-for="todo in todoStore.todoList" :key="todo.id" :class="{ completed: todo.completed }">
            <input 
              type="checkbox" 
              :checked="todo.completed" 
              @change="todoStore.toggleTodo(todo.id)" 
            />
            <span class="todo-text" @click="handleUpdateTodo(todo)">{{ todo.text }}</span>
            <button @click="todoStore.deleteTodo(todo.id)" class="btn-delete">×</button>
          </li>
        </ul>
        <span v-if="todoStore.todoList.length === 0" class="text-muted">
          할 일이 없습니다.
        </span>
      </div>

      <div class="dashboard-widget genai-container">
        <div v-if="appStore.apiKey">
          <div class="briefing-header">
            <h3>📢 담임 조종례 브리핑</h3>
            <button @click="generateBriefing" :disabled="briefingLoading" class="btn btn-primary btn-sm">
              {{ briefingLoading ? '생성 중...' : '🔄 새로고침' }}
            </button>
          </div>
          
          <div v-if="briefingError" class="error-box mt-20">
            {{ briefingError }}
          </div>
          
          <div v-if="appStore.lastBriefing && !briefingLoading" class="result-box mt-20">
            <pre>{{ appStore.lastBriefing }}</pre>
          </div>
          
          <div v-if="!appStore.lastBriefing && !briefingLoading && !briefingError" class="text-muted mt-20">
            [새로고침] 버튼을 눌러 오늘 메시지 이력에서<br/>전달사항을 요약합니다.
          </div>
        </div>
        
        <div v-else class="api-warning">
          <p>GenAI 기능을 사용하려면 [설정 (관리)] 탭에서 API 키를 등록해주세요.</p>
          <RouterLink to="/admin" class="btn btn-primary mt-20">설정으로 이동</RouterLink>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { useTodoStore } from '@/stores/todo'
import { useMessagesStore } from '@/stores/messages'
import { RouterLink } from 'vue-router'
import SimpleCalendar from '@/components/SimpleCalendar.vue'
import { GoogleGenAI } from '@google/genai'

const appStore = useAppStore()
const todoStore = useTodoStore()
const messagesStore = useMessagesStore()

// --- To-Do 관련 (변경 없음) ---
const newTodoText = ref('')
const handleAddTodo = () => {
  todoStore.addTodo(newTodoText.value)
  newTodoText.value = ''
}
const handleUpdateTodo = (todo) => {
  const newText = prompt('할 일 수정:', todo.text)
  if (newText !== null && newText !== todo.text) {
    todoStore.updateTodo(todo.id, newText)
  }
}

// --- 조종례 브리핑 관련 ---
const briefingLoading = ref(false)
const briefingError = ref('')

async function generateBriefing() {
  briefingLoading.value = true
  briefingError.value = ''
  // 생성 시작 시, 스토어의 내용을 비우지 않고 로딩 상태만 표시
  // (에러 발생 시 이전 내용이라도 보여주기 위함)

  const GEMINI_API_KEY = appStore.apiKey.trim()
  if (!GEMINI_API_KEY) {
    briefingError.value = 'API 키가 없습니다. [설정 (관리)] 탭에서 유효한 키를 입력해주세요.'
    briefingLoading.value = false
    return
  }

  // 1. 오늘 날짜의 '전달사항(notices)' 수집
  const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
  const todaysLogs = messagesStore.log.filter(log => log.date.startsWith(today));
  const allNotices = todaysLogs.flatMap(log => log.notices);

  if (allNotices.length === 0) {
    const resultText = '✅ 오늘 새로 수집된 전달사항이 없습니다. \n(메신저 정리 탭에서 이력을 추가해주세요.)'
    appStore.setLastBriefing(resultText) // 스토어에 저장
    briefingLoading.value = false
    return
  }

  // 2. GenAI 프롬프트 생성
  const prompt = `
    당신은 한국 학교의 친절한 담임 교사 AI 비서입니다.
    다음은 오늘 하루 동안 수집된 전달사항 목록입니다. 이 내용을 바탕으로 아침 조례 또는 종례 시간에 학생들에게 전달할 '담임 전달사항'을 하나의 완결된 브리핑 멘트로 요약, 정리해주세요.

    [오늘 수집된 전달사항 목록]
    ${allNotices.map(notice => `- ${notice}`).join('\n')}

    [작성 규칙]
    - 학생들에게 직접 말하는 부드럽고 명확한 어조로 작성해주세요.
    - 중요한 항목(예: 마감기한, 준비물, 특정 학생)을 강조하여 정리해주세요.
    - 항목이 여러 개일 경우, 불렛(•)이나 숫자로 구분해주세요.
    - "안녕하세요, 여러분. 오늘 전달사항입니다." 또는 "이상입니다."와 같이 자연스러운 시작과 끝 인사를 포함해주세요.
  `

  // 3. GenAI API 호출
  try {
    const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    appStore.setLastBriefing(await response.text) // 스토어에 저장

  } catch (e) {
    console.error(e);
    briefingError.value = `[GenAI 오류] ${e.message || '알 수 없는 오류가 발생했습니다.'}`
    // 오류 발생 시, 스토어의 마지막 내용을 건드리지 않음
  } finally {
    briefingLoading.value = false
  }
}
</script>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

/* 데스크탑 2열 레이아웃 */
@media (min-width: 992px) {
  .dashboard-grid {
    grid-template-columns: 1fr 1fr;
  }
  .genai-container { /* '조종례' 섹션이 이 클래스를 사용합니다 */
    grid-column: 1 / 3; /* GenAI 채팅은 하단 전체 */
  }
}

.dashboard-widget {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  min-height: 300px; /* 최소 높이 설정 */
}

/* --- 브리핑 섹션 스타일 --- */
.briefing-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}
.briefing-header h3 {
  margin: 0;
}
.btn-sm {
  padding: 5px 10px;
  font-size: 0.9em;
}
.result-box { 
  background: #e6f7ff; 
  border: 1px solid #b3e0ff; 
  padding: 15px; 
  border-radius: 8px; 
  max-height: 250px; /* 스크롤 추가 */
  overflow-y: auto;
}
.error-box { 
  background: #ffebee; 
  border: 1px solid #ffcdd2; 
  color: #c62828; 
  padding: 15px; 
  border-radius: 8px; 
}
.result-box pre { 
  white-space: pre-wrap; /* 자동 줄바꿈 */
  word-wrap: break-word; 
  font-family: inherit; /* 기본 폰트 상속 */
  font-size: 1em; /* 기본 폰트 크기 */
  margin: 0;
}
/* --- 스타일 끝 --- */


/* To-Do 리스트 스타일 */
.todo-container h3 {
  margin-top: 0;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}
.todo-input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}
.todo-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 280px; /* 스크롤 */
  overflow-y: auto;
}
.todo-list li {
  display: flex;
  align-items: center;
  padding: 8px 5px;
  border-bottom: 1px solid #f0f0f0;
}
.todo-list li.completed .todo-text {
  text-decoration: line-through;
  color: #aaa;
}
.todo-list li input[type="checkbox"] {
  margin-right: 10px;
  width: 18px;
  height: 18px;
}
.todo-text {
  flex-grow: 1;
  cursor: pointer;
  word-break: break-all;
}
.btn-delete {
  background: none;
  border: none;
  color: #e03131;
  font-weight: bold;
  font-size: 1.2em;
  cursor: pointer;
  padding: 0 5px;
}
.text-muted {
  text-align: center;
  display: block;
  margin-top: 20px;
  color: #888;
}

/* GenAI 경고 */
.api-warning {
  text-align: center;
  padding: 20px;
  line-height: 1.8;
}
</style>