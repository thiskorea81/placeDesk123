<template>
    <div class="container">
      <header class="mb-20 text-center">
        <h1>메신저 내용 정리</h1>
      </header>
  
      <section class="controls-panel mb-20">
        <div v-if="!appStore.apiKey" class="api-warning">
          <p>GenAI 기능이 비활성화되어 있습니다.</p>
          <p>[설정 (관리)] 탭에서 API 키를 먼저 입력해주세요.</p>
          <RouterLink to="/admin" class="btn btn-primary mt-20">설정으로 이동</RouterLink>
        </div>
  
        <div v-else class="form-grid">
          <div class="form-group">
            <label class="form-label">발신자 (선택)</label>
            <input type="text" v-model="sender" class="form-control" placeholder="예: 교감선생님, 1학년 2반 OOO학부모">
          </div>
          <div class="form-group area-full">
            <label class="form-label">메시지 내용</label>
            <textarea v-model="rawText" rows="8" class="form-control" placeholder="여기에 정리할 메신저 내용을 붙여넣으세요."></textarea>
          </div>
        </div>
        <div class="action-buttons">
          <button @click="processMessages" :disabled="!rawText || loading" class="btn btn-success">
            {{ loading ? '정리 중...' : 'AI로 정리하기' }}
          </button>
        </div>
      </section>
  
      <section v-if="processedResult" class="controls-panel mb-20">
        <h2>AI 처리 결과</h2>
        <div class="result-grid">
          <div class="result-box todos">
            <h3>🚨 해야할 일 (To-Do)</h3>
            <ul>
              <li v-for="(todo, i) in processedResult.todos" :key="'t'+i">{{ todo }}</li>
            </ul>
            <span v-if="!processedResult.todos.length" class="text-muted">특이사항 없음</span>
          </div>
          <div class="result-box notices">
            <h3>📢 담임 전달사항 (Notices)</h3>
            <ul>
              <li v-for="(notice, i) in processedResult.notices" :key="'n'+i">{{ notice }}</li>
            </ul>
            <span v-if="!processedResult.notices.length" class="text-muted">특이사항 없음</span>
          </div>
        </div>
        <div class="action-buttons">
          <button @click="saveToLog" class="btn btn-save">
            💾 이력에 저장 (및 To-Do 리스트로 전송)
          </button>
        </div>
      </section>
  
      <section class="history-panel">
        <h2>메시지 이력</h2>
        <div v-if="messagesStore.log.length === 0" class="text-center text-muted">
          저장된 이력이 없습니다.
        </div>
        <div v-else class="log-list">
          <div v-for="entry in messagesStore.log" :key="entry.id" class="log-entry">
            <div class="log-header">
              <strong>{{ entry.date }}</strong>
              <span v-if="entry.sender" class="sender-badge">{{ entry.sender }}</span>
              <button @click="messagesStore.deleteLog(entry.id)" class="btn-delete">삭제</button>
            </div>
            <div classs="log-content">
              <div class="result-grid">
                <div class="result-box todos-sm">
                  <strong>해야할 일:</strong>
                  <ul><li v-for="(t, i) in entry.todos" :key="i">{{ t }}</li></ul>
                  <span v-if="!entry.todos.length" class="text-muted">없음</span>
                </div>
                <div class="result-box notices-sm">
                  <strong>전달사항:</strong>
                  <ul><li v-for="(n, i) in entry.notices" :key="i">{{ n }}</li></ul>
                  <span v-if="!entry.notices.length" class="text-muted">없음</span>
                </div>
              </div>
              <details class="original-text">
                <summary>원본 메시지 보기</summary>
                <pre>{{ entry.original }}</pre>
              </details>
            </div>
          </div>
        </div>
      </section>
  
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { RouterLink } from 'vue-router'
  import { useAppStore } from '@/stores/app'
  import { useMessagesStore } from '@/stores/messages'
  import { useTodoStore } from '@/stores/todo' // [신규] To-Do 스토어 임포트
  import { GoogleGenAI } from '@google/genai'
  
  const appStore = useAppStore()
  const messagesStore = useMessagesStore()
  const todoStore = useTodoStore() // [신규] To-Do 스토어 사용
  
  const rawText = ref('')
  const sender = ref('')
  const loading = ref(false)
  const error = ref('')
  const processedResult = ref(null) // { todos: [], notices: [] }
  
  // GenAI 호출 함수 (변경 없음)
  async function processMessages() {
    loading.value = true
    error.value = ''
    processedResult.value = null
  
    const GEMINI_API_KEY = appStore.apiKey.trim()
    if (!GEMINI_API_KEY) {
      error.value = 'API 키가 없습니다.'
      loading.value = false
      return
    }
  
    const prompt = `
      당신은 한국 학교의 교사를 돕는 AI 비서입니다.
      다음은 교사가 받은 메신저 내용입니다.
      발신자: "${sender.value || '지정 안 됨'}"
      메시지:
      ---
      ${rawText.value}
      ---
  
      이 메시지 내용을 분석하여, 교사가 '해야 할 일(todos)'과 '학생들에게 전달할 사항(notices)'으로 요약 정리해주세요.
      반드시 다음의 JSON 형식으로만 응답해주세요:
      {
        "todos": ["해야 할 일 1", "해야 할 일 2", ...],
        "notices": ["학생 전달사항 1", "학생 전달사항 2", ...]
      }
      만약 특정 항목이 없으면 빈 배열 []로 응답하세요.
    `
  
    try {
      const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      
      let jsonResponse;
      try {
        const jsonText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        jsonResponse = JSON.parse(jsonText);
      } catch (parseError) {
        console.error("AI 응답 JSON 파싱 실패:", parseError);
        jsonResponse = { todos: [response.text], notices: [] };
      }
  
      processedResult.value = jsonResponse;
  
    } catch (e) {
      console.error(e);
      error.value = `[GenAI 오류] ${e.message || '알 수 없는 오류가 발생했습니다.'}`
      processedResult.value = { todos: [], notices: [`오류 발생: ${e.message}`] };
    } finally {
      loading.value = false
    }
  }
  
  // [수정됨] 이력에 저장 및 To-Do 리스트로 전송
  function saveToLog() {
    if (!processedResult.value) return;
  
    const entry = {
      id: Date.now().toString(),
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      sender: sender.value || '미지정',
      original: rawText.value,
      todos: processedResult.value.todos,
      notices: processedResult.value.notices,
    }
  
    // 1. 메시지 이력에 저장
    messagesStore.addLog(entry);
  
    let todoCount = 0;
    // 2. [신규] '해야할 일'을 To-Do 스토어로 전송
    if (processedResult.value.todos && processedResult.value.todos.length > 0) {
      processedResult.value.todos.forEach(todoText => {
        todoStore.addTodo(todoText); // To-Do 리스트에 추가
      });
      todoCount = processedResult.value.todos.length;
    }
  
    // 사용자 피드백
    if (todoCount > 0) {
      alert(`메시지 이력을 저장하고, To-Do 리스트에 ${todoCount}개 항목을 추가했습니다.`);
    } else {
      alert('메시지 이력을 저장했습니다.');
    }
  
    // 입력 필드 초기화
    rawText.value = ''
    sender.value = ''
    processedResult.value = null
  }
  </script>
  
  <style scoped>
  /* 새 뷰를 위한 스타일 */
  .api-warning {
    text-align: center;
    padding: 20px;
    background-color: #fff3cd;
    border: 1px solid #ffeeba;
    color: #856404;
    border-radius: 8px;
  }
  .form-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 15px;
  }
  @media (min-width: 768px) {
    .form-grid {
      grid-template-columns: 1fr 2fr;
    }
    .form-group.area-full {
      grid-column: 2 / 3;
      grid-row: 1 / 3;
    }
  }
  .action-buttons { text-align: center; margin-top: 20px; }
  .btn-save { background-color: #e03131; color: white; }
  
  .result-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 15px;
    margin-top: 15px;
  }
  @media (min-width: 768px) {
    .result-grid { grid-template-columns: 1fr 1fr; }
  }
  .result-box {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 15px;
    min-height: 150px; /* 최소 높이 */
  }
  .result-box h3 { margin-top: 0; margin-bottom: 10px; }
  .result-box ul { padding-left: 20px; margin: 0; }
  .result-box.todos { background-color: #fff9db; border-color: #fff3bf; }
  .result-box.notices { background-color: #e6f7ff; border-color: #b3e0ff; }
  .text-muted { color: #888; }
  
  /* 이력 스타일 */
  .history-panel h2 { text-align: center; margin-bottom: 20px; }
  .log-list { display: flex; flex-direction: column; gap: 15px; }
  .log-entry {
    background: #f8f9fa;
    border: 1px solid #eee;
    border-radius: 8px;
  }
  .log-header {
    padding: 10px 15px;
    border-bottom: 1px solid #eee;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap; /* 모바일에서 줄바꿈 */
  }
  .sender-badge {
    background-color: #e9ecef;
    color: #495057;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 0.8em;
    font-weight: 600;
  }
  .btn-delete {
    margin-left: auto;
    padding: 3px 8px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8em;
    background-color: #ffebee; 
    color: #c62828;
  }
  .log-content {
    padding: 15px;
  }
  .result-box.todos-sm, .result-box.notices-sm {
    padding: 10px;
    font-size: 0.9em;
  }
  .original-text {
    margin-top: 15px;
  }
  .original-text summary {
    cursor: pointer;
    color: #555;
    font-size: 0.9em;
  }
  .original-text pre {
    background-color: #eee;
    padding: 10px;
    border-radius: 4px;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-size: 0.85em;
    margin-top: 5px;
  }
  </style>