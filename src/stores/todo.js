// src/stores/todo.js
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useTodoStore = defineStore('todo', () => {
  // localStorage에서 이력을 불러오거나 빈 배열로 시작
  const todoList = ref(JSON.parse(localStorage.getItem('TODO_LIST')) || [])

  // 이력이 변경되면 localStorage에 자동 저장
  watch(todoList, (newList) => {
    localStorage.setItem('TODO_LIST', JSON.stringify(newList))
  }, { deep: true })

  const generateId = () => Date.now().toString()

  /**
   * 새 To-Do 항목 추가
   * @param {string} text - 할 일 내용
   */
  function addTodo(text) {
    if (!text || !text.trim()) return
    todoList.value.unshift({ 
      id: generateId(), 
      text: text.trim(), 
      completed: false 
    })
  }

  /**
   * To-Do 항목 삭제
   * @param {string} id - 삭제할 항목 ID
   */
  function deleteTodo(id) {
    todoList.value = todoList.value.filter(todo => todo.id !== id)
  }

  /**
   * To-Do 항목 수정
   * @param {string} id - 수정할 항목 ID
   * @param {string} newText - 새 텍스트
   */
  function updateTodo(id, newText) {
    if (!newText || !newText.trim()) return
    const todo = todoList.value.find(todo => todo.id === id)
    if (todo) {
      todo.text = newText.trim()
    }
  }

  /**
   * To-Do 항목 완료/미완료 토글
   * @param {string} id - 토글할 항목 ID
   */
  function toggleTodo(id) {
    const todo = todoList.value.find(todo => todo.id === id)
    if (todo) {
      todo.completed = !todo.completed
    }
  }

  return { 
    todoList, 
    addTodo, 
    deleteTodo, 
    updateTodo, 
    toggleTodo 
  }
})