// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import SeatingView from '../views/SeatingView.vue'
import AttendanceView from '../views/AttendanceView.vue'
import AdminView from '../views/AdminView.vue'
import MessageLogView from '../views/MessageLogView.vue' // [신규] 임포트

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/seating',
      name: 'seating',
      component: SeatingView
    },
    {
      path: '/attendance',
      name: 'attendance',
      component: AttendanceView
    },
    // [신규] 메신저 정리 탭 라우트
    {
      path: '/messages',
      name: 'messages',
      component: MessageLogView
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView
    }
  ]
})

export default router