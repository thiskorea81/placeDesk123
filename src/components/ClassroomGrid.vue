<template>
  <div class="classroom-grid">
    <slot name="screen-top"></slot>
    
    <div class="grid-container" :class="{ 'print-mode': isPrint }">
      <div v-for="(row, rIdx) in gridData" :key="rIdx" class="grid-row">
        <template v-for="(student, cIdx) in row" :key="cIdx">
          <div 
            class="grid-seat"
            :class="{ 
              'is-empty': !student,
              'aisle-gap': needsAisle(cIdx, row.length) 
            }"
          >
            <div v-if="student" class="seat-content">
              <span class="seat-num">{{ student.number }}</span>
              <span class="seat-name">{{ student.name }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <slot name="screen-bottom"></slot>
  </div>
</template>

<script setup>
const props = defineProps({
  gridData: { type: Array, required: true },
  isPrint: { type: Boolean, default: false }
});

// 복도(Aisle)가 필요한지 판단하는 함수
const needsAisle = (colIdx, totalCols) => {
  // 마지막 열 뒤에는 복도 없음
  if (colIdx === totalCols - 1) return false;

  // 전체 열이 홀수면: 모든 좌석 사이에 복도
  if (totalCols % 2 !== 0) return true;

  // 전체 열이 짝수면: 2자리마다 복도 (인덱스 1, 3, 5... 뒤에)
  return (colIdx + 1) % 2 === 0;
};
</script>

<style scoped>
.grid-container { display: flex; flex-direction: column; gap: 15px; align-items: center; }
.grid-row { display: flex; gap: 5px; /* 기본 좌석 간격은 좁게 */ }

.grid-seat { 
  width: 80px; height: 60px; 
  border: 2px solid #bbb; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  background: white; 
  transition: all 0.3s;
}
.grid-seat.is-empty { border: 2px dashed #eee; background: transparent; }

/* 복도 스타일: 오른쪽 마진을 넓게 줌 */
.aisle-gap { margin-right: 30px; }

.seat-content { text-align: center; line-height: 1.1; }
.seat-num { font-size: 0.75em; color: #666; display: block; margin-bottom: 2px; }
.seat-name { font-weight: 700; color: #333; font-size: 1.1em; }

/* 인쇄 모드 스타일 재정의 */
.print-mode .grid-container { gap: 10px; height: 100%; justify-content: space-evenly; }
.print-mode .grid-seat { 
  width: 60px; height: 45px; 
  border: 1px solid #333; border-radius: 4px;
  font-size: 10pt;
}
.print-mode .aisle-gap { margin-right: 20px; /* 인쇄 시 복도 너비 조정 */ }
.print-mode .seat-num { display: inline; margin-right: 4px; font-weight: normal; color: #000; }
.print-mode .seat-name { font-size: 1em; }
</style>