<template>
  <div>
    <div class="no-print container">
      <header class="mb-20 text-center">
        <h1>🏫 학급 자리 배치 시스템</h1>
      </header>

      <section class="controls-panel">
        <div class="form-group file-upload-group">
          <div class="label-row">
            <label class="form-label">📂 명렬표 업로드 (CSV)</label>
            <a href="#" @click.prevent="downloadExampleCSV" class="example-link">📄 예시 파일 다운로드</a>
          </div>
          <div class="upload-desc">
            필수: 학년, 반, 번호, 성명 / 선택: 학생개인번호, 성별, 생년월일, 비고
          </div>
          <input type="file" @change="handleFileUpload" accept=".csv" class="form-control" />
          <span v-if="store.hasStudents" class="status-badge success">
            ✅ {{ store.grade }}학년 {{ store.classNum }}반 ({{ store.originalStudents.length }}명) 로드됨
          </span>
        </div>

        <div class="settings-grid">
          <div class="form-group">
            <label class="form-label">가로 좌석 수</label>
            <input type="number" v-model.number="store.columns" min="1" max="10" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">시력 우선 (앞 2줄)</label>
            <input type="text" v-model="store.visionInput" placeholder="예: 홍길동, 김철수;이영희" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">붙어 앉기 금지 (8방향)</label>
            <input type="text" v-model="store.incompatibleInput" placeholder="예: 이순신;강감찬" class="form-control" />
          </div>
        </div>

        <div class="action-buttons">
          <button @click="store.generateSeating(false)" :disabled="!store.hasStudents" class="btn btn-primary">🔢 번호순 배치</button>
          <button @click="store.generateSeating(true)" :disabled="!store.hasStudents" class="btn btn-success">🎲 랜덤 배치</button>
          <button @click="print" :disabled="!hasResult" class="btn btn-warning">🖨️ 인쇄</button>
        </div>
      </section>

      <section v-if="hasResult" class="preview-section mt-20">
        <div class="view-toggle text-center mb-20">
          <button @click="viewMode='student'" :class="['btn', viewMode==='student'?'btn-dark':'btn-light']">게시용 (학생 시선)</button>
          <button @click="viewMode='teacher'" :class="['btn', viewMode==='teacher'?'btn-dark':'btn-light']">교탁용 (교사 시선)</button>
        </div>

        <div class="classroom-preview">
          <ClassroomGrid :grid-data="currentViewGrid">
            <template #[screenSlot]>
              <div class="screen-marker">📺 {{ viewMode === 'student' ? '칠판 (앞)' : '교탁 (선생님 시선)' }} 📺</div>
            </template>
          </ClassroomGrid>
        </div>
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
              <ClassroomGrid :grid-data="store.seatingGrid" :is-print="true">
                <template #screen-top><div class="screen-box">📺 칠판 📺</div></template>
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
              <ClassroomGrid :grid-data="teacherGrid" :is-print="true">
                <template #screen-bottom><div class="screen-box">📺 교탁 (앞) 📺</div></template>
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

const store = useSeatingStore();
const viewMode = ref('student');
const currentMonth = new Date().getMonth() + 1;

const hasResult = computed(() => store.seatingGrid.length > 0);
const teacherGrid = computed(() => [...store.seatingGrid].reverse().map(row => [...row].reverse()));
const currentViewGrid = computed(() => viewMode.value === 'student' ? store.seatingGrid : teacherGrid.value);
const screenSlot = computed(() => viewMode.value === 'student' ? 'screen-top' : 'screen-bottom');

const handleFileUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => store.loadStudentsFromCSV(e.target.result);
  reader.readAsText(file, 'UTF-8');
};

const print = () => window.print();

const downloadExampleCSV = () => {
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
.action-buttons { display: flex; gap: 10px; justify-content: center; }

.classroom-preview { background: #fff9db; padding: 30px; border-radius: 15px; border: 3px solid #343a40; min-height: 400px; display: flex; justify-content: center; }
.screen-marker { background: #343a40; color: white; padding: 10px 30px; border-radius: 5px; margin: 20px 0; font-weight: bold; text-align: center; }
.view-toggle .btn-dark { background: #343a40; color: white; }
.view-toggle .btn-light { background: #e9ecef; color: #333; }

@media print {
  .list-title { text-align: center; font-size: 14pt; color: #555; margin-bottom: 15px; border-bottom: 1px solid #999; padding-bottom: 5px; }
}
</style>