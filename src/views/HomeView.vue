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
        <GenAiChat v-if="appStore.apiKey" :api-key="appStore.apiKey" />
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
import { useTodoStore } from '@/stores/todo' // [신규]
import { RouterLink } from 'vue-router'
import GenAiChat from '@/components/GenAiChat.vue'
import SimpleCalendar from '@/components/SimpleCalendar.vue' // [신규]

const appStore = useAppStore()
const todoStore = useTodoStore() // [신규]

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
  .genai-container {
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