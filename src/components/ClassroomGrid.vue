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
            
            <div v-else class="seat-empty-number">
              {{ (rIdx * columns) + cIdx + 1 }}
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
import { computed, useSlots } from 'vue';

const props = defineProps({
  gridData: { type: Array, required: true },
  isPrint: { type: Boolean, default: false },
  columns: { type: Number, required: true } // 이 prop이 누락되면 번호가 NaN으로 표시될 수 있습니다.
});

const slots = useSlots();
const isTeacherMode = computed(() => !!slots['screen-bottom']);

const needsAisle = (colIdx, totalCols) => {
  if (colIdx === totalCols - 1) return false;
  if (totalCols % 2 !== 0) return true;
  return (colIdx + 1) % 2 === 0;
};
</script>

<style scoped>
.classroom-grid { display: flex; flex-direction: column; height: 100%; }
.grid-container { display: flex; flex-direction: column; gap: 15px; align-items: center; flex-grow: 1; justify-content: center; }
.grid-row { display: flex; gap: 5px; }

.grid-seat { 
  width: 80px; height: 60px; 
  border: 2px solid #bbb; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  background: white; 
  transition: all 0.3s;
}

/* 빈 좌석 스타일 */
.grid-seat.is-empty { 
  border: 2px dashed #eee; 
  background: #fdfdfd; 
}
.seat-empty-number {
  font-size: 1.2em;
  font-weight: bold;
  color: #ccc;
}

.aisle-gap { margin-right: 30px; }
.seat-content { text-align: center; line-height: 1.1; }
.seat-num { font-size: 0.75em; color: #666; display: block; margin-bottom: 2px; }
.seat-name { font-weight: 700; color: #333; font-size: 1.1em; }

/* 인쇄 모드 스타일 */
.print-mode .grid-container { gap: 10px; justify-content: center; }
.print-mode .grid-seat { 
  width: 90px; height: 50px; 
  border: 1px solid #333; border-radius: 4px;
  font-size: 11pt; 
}
.print-mode .seat-empty-number {
  font-size: 1em;
  color: #bbb;
}
.print-mode.teacher-mode { justify-content: space-between; }
.print-mode.teacher-mode .grid-container { justify-content: center; flex-grow: 1; }
.print-mode.teacher-mode .screen-slot.bottom { margin-top: auto; }

.screen-slot { width: 100%; display: flex; justify-content: center; padding: 10px 0; }
</style>