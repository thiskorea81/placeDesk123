<template>
    <div>
      <div class="no-print container">
        <header class="mb-20 text-center">
          <h1>🏫 학급 자리 배치 시스템</h1>
        </header>
  
        <section class="controls-panel">
          <div class="form-group file-upload-group">
            <label class="form-label">📂 명단 불러오기</label>
            <div class="upload-options">
              <button @click="loadMasterList" class="btn btn-dark">
                중앙 명단 불러오기
              </button>
              <div class="divider-or">또는</div>
              <div class="temp-upload">
                <input 
                  type="file" 
                  id="seatingFileUpload" 
                  @change="handleFileUpload" 
                  accept=".csv" 
                  class="file-input-hidden" 
                />
                <label for="seatingFileUpload" class="btn btn-light">📂 임시 파일 선택</label>
                <small>(이 페이지에서만 사용할 임시 CSV 업로드)</small>
              </div>
            </div>
            <span v-if="store.hasStudents" class="status-badge success mt-10">
              ✅ {{ store.grade }}학년 {{ store.classNum }}반 ({{ store.originalStudents.length }}명) 로드됨
            </span>
          </div>
          
          <div class="settings-grid">
            <div class="form-group">
              <label class="form-label">가로 좌석 수</label>
              <input type="number" v-model.number="store.columns" min="5" max="8" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">시력 우선 (앞 2줄)</label>
              <input type="text" v-model="store.visionInput" placeholder="예: 홍길동, 김철수;이영희" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">붙어 앉기 금지 (8방향)</label>
              <input type="text" v-model="store.incompatibleInput" placeholder="예: 이순신;강감찬" class="form-control" />
            </div>
            <div class="form-group fixed-seating">
              <label class="form-label">고정석 배정 (게시용 번호 기준)</label>
              <input type="text" v-model="store.fixedSeatingInput" placeholder="예: 1:고지원, 7:김민성" class="form-control" />
            </div>
          </div>
  
          <div class="action-buttons">
            <button @click="runGenerate(false)" :disabled="!store.hasStudents" class="btn btn-primary">🔢 번호순 배치</button>
            <button @click="runGenerate(true)" :disabled="!store.hasStudents" class="btn btn-success">🎲 랜덤 배치</button>
            
            <button @click="confirmSeating" v-if="tempHistory" class="btn btn-save">
              💾 좌석 확정 (저장)
            </button>
          </div>
  
          <div class="history-controls">
            <select v-model="selectedHistoryDate" class="form-control">
              <option value="">-- 이전 좌석 불러오기 --</option>
              <option v-for="item in store.seatingHistoryList" :key="item.date" :value="item.date">
                {{ item.date }}
              </option>
            </select>
            <button @click="loadHistory" :disabled="!selectedHistoryDate" class="btn btn-light">
              불러오기
            </button>
            <button @click="print" :disabled="!hasResult" class="btn btn-warning">
              🖨️ 인쇄
            </button>
            <button @click="exportSeatingToExcel" :disabled="!hasResult" class="btn btn-success">
              📊 Excel 내보내기
            </button>
          </div>
        </section>
  
        <section v-if="hasResult" class="preview-section mt-20">
          <div class="view-toggle text-center mb-20">
            <button @click="viewMode='student'" :class="['btn', viewMode==='student'?'btn-dark':'btn-light']">게시용 (학생 시선)</button>
            <button @click="viewMode='teacher'" :class="['btn', viewMode==='teacher'?'btn-dark':'btn-light']">교탁용 (교사 시선)</button>
          </div>
          <div class="classroom-preview">
            <ClassroomGrid :grid-data="currentViewGrid" :columns="store.columns">
              <template #[screenSlot]>
                <div class="screen-marker">📺 {{ viewMode === 'student' ? '칠판 (앞)' : '교탁 (선생님 시선)' }} 📺</div>
              </template>
            </ClassroomGrid>
          </div>
        </section>
        
        <section v-else class="preview-section mt-20 text-center">
          <p>먼저 [중앙 명단 불러오기] 또는 [임시 파일 선택]을 통해 학생 명단을 로드해주세요.</p>
          <p>(명단을 로드하면 이곳에 빈 좌석 번호가 표시됩니다.)</p>
        </section>
      </div>
  
      <div class="print-only">
        <div class="print-page">
          <header class="print-header">
            <h1 class="print-title">{{ store.grade }}학년 {{ store.classNum }}반 자리 배치표 ({{ currentMonth }}월) - 게시용</h1>
          </header>
          <div class="print-layout">
            <div class="left-panel">
              <div class="view-section full-height">
                <ClassroomGrid :grid-data="store.seatingGrid" :is-print="true" :columns="store.columns">
                  <template #screen-top><div class="screen-box">칠판</div></template>
                </ClassroomGrid>
              </div>
            </div>
            <div class="right-panel student-list">
              <h2 class="list-title">명렬표</h2>
              <ul>
                <li v-for="s in store.sortedStudents" :key="s.number">
                  <span class="list-num">{{ s.number }}.</span> {{ s.name }}
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div class="print-page page-break">
          <header class="print-header">
            <h1 class="print-title">{{ store.grade }}학년 {{ store.classNum }}반 자리 배치표 ({{ currentMonth }}월) - 교탁용</h1>
          </header>
          <div class="print-layout">
            <div class="left-panel">
              <div class="view-section full-height">
                <ClassroomGrid :grid-data="teacherGrid" :is-print="true" :columns="store.columns">
                  <template #screen-bottom><div class="screen-box">교탁 (앞)</div></template>
                </ClassroomGrid>
              </div>
            </div>
            <div class="right-panel student-list">
              <h2 class="list-title">명렬표</h2>
              <ul>
                <li v-for="s in store.sortedStudents" :key="s.number">
                  <span class="list-num">{{ s.number }}.</span> {{ s.name }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue';
  import { useSeatingStore } from '@/stores/seating';
  import ClassroomGrid from '@/components/ClassroomGrid.vue';
  import * as XLSX from 'xlsx'; // [신규] SheetJS 임포트
  
  const store = useSeatingStore();
  const viewMode = ref('student');
  const currentMonth = new Date().getMonth() + 1;
  
  // 임시 이력 (확정 전)
  const tempHistory = ref(null);
  // 불러올 이력 날짜
  const selectedHistoryDate = ref('');
  
  // hasResult는 seatingGrid에 빈 배열이라도(빈 좌석 표시) 무언가 있으면 true
  const hasResult = computed(() => store.seatingGrid.length > 0);
  
  // 교탁용 뷰 계산 (원본 그리드를 뒤집음)
  const teacherGrid = computed(() => {
      if (!hasResult.value) return [];
      return [...store.seatingGrid].reverse().map(row => [...row].reverse());
  });
  
  // 현재 뷰(게시용/교탁용)에 따라 보여줄 그리드 데이터
  const currentViewGrid = computed(() => {
    return viewMode.value === 'student' ? store.seatingGrid : teacherGrid.value;
  });
  const screenSlot = computed(() => viewMode.value === 'student' ? 'screen-top' : 'screen-bottom');
  
  // 명단 로드 시 임시 이력 초기화
  const loadMasterList = () => {
    store.loadFromMasterList();
    tempHistory.value = null;
    selectedHistoryDate.value = '';
  }
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      store.loadStudentsFromCSV(e.target.result);
      tempHistory.value = null;
      selectedHistoryDate.value = '';
    }
    reader.readAsText(file, 'UTF-8');
  };
  
  // 생성 래퍼 함수
  const runGenerate = (isRandom) => {
    const newHistory = store.generateSeating(isRandom);
    if (newHistory) {
      tempHistory.value = newHistory; // 확정 버튼 활성화
    }
    selectedHistoryDate.value = ''; // 불러오기 선택 해제
  }
  
  // 확정(저장) 함수
  const confirmSeating = () => {
    store.saveCurrentSeating(tempHistory.value);
    tempHistory.value = null; // 확정 버튼 비활성화
  }
  
  // 불러오기 함수
  const loadHistory = () => {
    store.loadSeatingFromHistory(selectedHistoryDate.value);
    tempHistory.value = null; // 확정 버튼 비활성화
  }
  
  const print = () => window.print();
  
  const downloadExampleCSV = () => {
    // 예시 CSV
    const csvContent = "\uFEFF학년,반,번호,성명,학생개인번호,성별,생년월일,비고\n" +
                       "1,1,1,김철수,2025000001,남성,2010.01.01,\n" +
                       "1,1,2,이영희,2025000002,여성,2010.02.02,\n" +
                       "1,1,3,박민수,,,,\n" + 
                       "1,1,4,최지우,,,,\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '예시_학생명렬표.csv';
    link.click();
  };
  
  // [신규] 자리배치 엑셀 내보내기 함수
  const exportSeatingToExcel = () => {
    const fileName = `${store.grade}학년 ${store.classNum}반_자리배치(${new Date().toISOString().slice(5, 10)}).xlsx`;
  
    // --- 시트 1: 자리배치도 (게시용 기준) ---
    const grid = store.seatingGrid;
    const dataForSeatingSheet = grid.map((row, rIdx) => 
      row.map((cell, cIdx) => {
        if (cell) {
          return `${cell.number}. ${cell.name}`; // "1. 고지원"
        }
        // 빈 좌석 번호 표시 (게시용 기준)
        const seatNum = (rIdx * store.columns) + cIdx + 1;
        return `( ${seatNum} )`; // 빈 좌석
      })
    );
    const ws_seating = XLSX.utils.aoa_to_sheet(dataForSeatingSheet);
  
    // --- 시트 2: 학생명렬표 ---
    const studentList = store.sortedStudents;
    const dataForListSheet = [
      ['번호', '이름'], // 헤더
      ...studentList.map(s => [s.number, s.name]) // 데이터
    ];
    const ws_list = XLSX.utils.aoa_to_sheet(dataForListSheet);
  
    // --- 워크북 생성 및 다운로드 ---
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws_seating, '자리배치도 (게시용)');
    XLSX.utils.book_append_sheet(wb, ws_list, '학생명렬표');
    
    XLSX.writeFile(wb, fileName);
  };
  </script>
  
  <style scoped>
  /* 화면용 스타일 */
  .label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
  .example-link { font-size: 0.9em; color: #4dabf7; text-decoration: none; cursor: pointer; }
  .example-link:hover { text-decoration: underline; }
  .upload-desc { font-size: 0.85em; color: #666; margin-bottom: 8px; }
  .controls-panel { background: #f8f9fa; padding: 25px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
  .settings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
  .status-badge { margin-left: 10px; font-weight: bold; color: #2ecc71; }
  .mt-10 { margin-top: 10px; display: block; }
  .action-buttons { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
  .btn-save { background-color: #e03131; color: white; } /* 확정 버튼 */
  
  /* 이력 컨트롤 스타일 */
  .history-controls {
    display: flex;
    gap: 10px;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px dashed #ccc;
    flex-wrap: wrap; 
  }
  .history-controls select {
    flex-grow: 1;
    min-width: 200px;
  }
  .history-controls .btn {
    flex-shrink: 0;
  }
  
  .classroom-preview { background: #fff9db; padding: 30px; border-radius: 15px; border: 3px solid #343a40; min-height: 400px; display: flex; justify-content: center; }
  .screen-marker { background: #343a40; color: white; padding: 10px 30px; border-radius: 5px; margin: 20px 0; font-weight: bold; text-align: center; }
  .view-toggle { display: flex; justify-content: center; gap: 10px; }
  .view-toggle .btn-dark { background: #343a40; color: white; }
  .view-toggle .btn-light { background: #e9ecef; color: #333; }
  
  .upload-options { display: flex; align-items: center; gap: 15px; flex-wrap: wrap; }
  .divider-or { font-weight: bold; color: #888; }
  .temp-upload { 
    flex-grow: 1; 
    display: flex; 
    flex-direction: column; 
    align-items: flex-start;
  }
  .temp-upload small { font-size: 0.8em; color: #666; margin-top: 5px; }
  .btn-dark { background: #343a40; color: white; flex-shrink: 0; }
  
  @media print {
    .list-title { text-align: center; font-size: 14pt; color: #555; margin-bottom: 15px; border-bottom: 1px solid #999; padding-bottom: 5px; }
  }
  </style>