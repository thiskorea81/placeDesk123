<template>
    <div class="container">
      <header class="mb-20 text-center">
        <h1>출결 현황 모니터링</h1>
      </header>
  
      <div class="controls-panel">
        <div class="attendance-actions">
          <button @click="exportAttendanceToExcel" class="btn btn-success" :disabled="studentStore.masterList.length === 0">
            📊 전체 출결 이력 내보내기 (Excel)
          </button>
          <small>(모든 학생의 생리결석, 체험학습 상세 이력을 내보냅니다.)</small>
        </div>
  
        <div class="attendance-table-wrapper">
          <table class="attendance-table">
            <thead>
              <tr>
                <th>번호</th>
                <th>이름</th>
                <th>체험(국내)</th>
                <th>체험(국외)</th>
                <th>월간 생리결석</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              <StudentAttendanceRow
                v-for="student in studentStore.masterList"
                :key="student.number"
                :student="student"
                :settings="appStore.attendanceSettings"
              />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { useStudentStore } from '@/stores/students'
  import { useAppStore } from '@/stores/app'
  import StudentAttendanceRow from '@/components/StudentAttendanceRow.vue'
  import * as XLSX from 'xlsx'; // SheetJS 임포트
  
  const studentStore = useStudentStore()
  const appStore = useAppStore()
  
  // 출결 이력 엑셀 내보내기 함수
  const exportAttendanceToExcel = () => {
    if (studentStore.masterList.length === 0) {
      alert("내보낼 학생 명단이 없습니다. [설정 (관리)] 탭에서 명단을 업로드해주세요.");
      return;
    }
    
    const fileName = `${studentStore.grade}학년 ${studentStore.classNum}반_출결이력(${new Date().toISOString().slice(5, 10)}).xlsx`;
    
    const allLogs = [];
    // 헤더 추가
    allLogs.push(['번호', '이름', '구분', '날짜', '일수', '사유/유형']);
  
    // masterList에서 모든 로그를 순회하며 데이터 추가
    studentStore.masterList.forEach(s => {
      // 생리결석 로그
      s.attendance.menstrualLog.forEach(log => {
        allLogs.push([s.number, s.name, '생리결석', log.date, 1, log.type]);
      });
      // 국내 체험학습 로그
      s.attendance.expDomesticLog.forEach(log => {
        allLogs.push([s.number, s.name, '체험(국내)', log.date, log.days, log.reason]);
      });
      // 국외 체험학습 로그
      s.attendance.expInternationalLog.forEach(log => {
        allLogs.push([s.number, s.name, '체험(국외)', log.date, log.days, log.reason]);
      });
    });
  
    const ws = XLSX.utils.aoa_to_sheet(allLogs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '전체 출결 이력');
    
    XLSX.writeFile(wb, fileName);
  };
  
  </script>
  
  <style scoped>
  .controls-panel { 
    background: #f8f9fa; 
    padding: 25px; 
    border-radius: 12px; 
  }
  .attendance-actions {
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px dashed #ccc;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .attendance-table-wrapper {
    overflow-x: auto;
  }
  .attendance-table {
    width: 100%;
    border-collapse: collapse;
    text-align: center;
  }
  .attendance-table th, 
  .attendance-table td {
    padding: 12px 8px;
    border-bottom: 1px solid #ddd;
  }
  .attendance-table th {
    background-color: #f1f3f5;
  }
  </style>