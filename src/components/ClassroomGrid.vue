<template>
  <div class="classroom-grid" :class="{ 'print-mode': isPrint, 'teacher-mode': isTeacherMode }">
    <div v-if="$slots['screen-top']" class="screen-slot top">
      <slot name="screen-top"></slot>
    </div>
    
    <div class="grid-container">
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

    <div v-if="$slots['screen-bottom']" class="screen-slot bottom">
      <slot name="screen-bottom"></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  gridData: { type: Array, required: true },
  isPrint: { type: Boolean, default: false }
});

// 교사 모드인지 확인 (하단 슬롯이 있는지 여부로 판단)
// useSlots()를 사용하면 더 정확하지만, 간단히 slot 존재 여부로 판단
import { useSlots } from 'vue';
const slots = useSlots();
const isTeacherMode = computed(() => !!slots['screen-bottom']);

const needsAisle = (colIdx, totalCols) => {
  if (colIdx === totalCols - 1) return false;
  if (totalCols % 2 !== 0) return true;
  return (colIdx + 1) % 2 === 0;
};
</script>

<style scoped>
.classroom-grid { 
  display: flex; 
  flex-direction: column; 
  height: 100%; 
}

.grid-container { 
  display: flex; 
  flex-direction: column; 
  gap: 15px; 
  align-items: center; 
  flex-grow: 1; 
  justify-content: center; /* 화면에서는 항상 중앙 정렬 */
}
.grid-row { display: flex; gap: 5px; }

.grid-seat { 
  width: 80px; height: 60px; 
  border: 2px solid #bbb; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  background: white; 
  transition: all 0.3s;
}
.grid-seat.is-empty { border: 2px dashed #eee; background: transparent; }
.aisle-gap { margin-right: 30px; }
.seat-content { text-align: center; line-height: 1.1; }
.seat-num { font-size: 0.75em; color: #666; display: block; margin-bottom: 2px; }
.seat-name { font-weight: 700; color: #333; font-size: 1.1em; }

/* 인쇄 모드 스타일 */
.print-mode .grid-container { 
  gap: 10px; 
  justify-content: center; /* 인쇄 시에도 중앙 정렬 기본 */
}
.print-mode .grid-seat { 
  width: 90px; height: 50px; /* 크기 약간 키움 */
  border: 1px solid #333; border-radius: 4px;
  font-size: 11pt; 
}
.print-mode .aisle-gap { margin-right: 20px; }
.print-mode .seat-num { 
  display: inline; 
  margin-right: 4px; 
  font-weight: normal; 
  color: #000; 
  font-size: 0.9em;
}

/* 교사 모드(칠판이 아래)일 때 특별 처리 */
.print-mode.teacher-mode {
  justify-content: space-between; /* 상하 요소 분산 */
}
.print-mode.teacher-mode .grid-container {
  justify-content: center; /* 그리드는 중앙에 */
  flex-grow: 1;
}
.print-mode.teacher-mode .screen-slot.bottom {
  margin-top: auto; /* 하단 고정 */
}

.screen-slot {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 10px 0;
}
</style>