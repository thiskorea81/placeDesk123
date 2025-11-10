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
  columns: { type: Number, required: true } 
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

/* [수정] 화면(screen) 모드일 때 통로 간격 살짝 줄임 */
.aisle-gap { margin-right: 20px; }
.seat-content { text-align: center; line-height: 1.1; }
.seat-num { font-size: 0.75em; color: #666; display: block; margin-bottom: 2px; }
.seat-name { font-weight: 700; color: #333; font-size: 1.1em; }


/* --- [수정된 인쇄 모드 스타일] --- */

/* [수정] 인쇄 시 grid-container와 row가 부모 너비를 100% 사용하도록 */
.print-mode .grid-container { 
  width: 100%;
  gap: 8px; /* 10px -> 8px (간격 축소) */
  justify-content: center; 
}
.print-mode .grid-row {
  width: 100%;
  gap: 4px; /* 5px -> 4px (간격 축소) */
}

/* [수정] 인쇄 시 통로 간격(aisle-gap) 축소 */
.print-mode .aisle-gap { 
  margin-right: 15px; /* 30px -> 15px */
}

.print-mode .grid-seat { 
  /* width: 90px; */ /* [제거] 고정 너비 90px 제거 */
  flex: 1 1 0;     /* [추가] 책상이 패널 너비에 맞춰 유연하게 조절되도록 */
  min-width: 0;      /* [추가] 8열일 때 0px까지 줄어들 수 있도록 허용 */

  height: 45px; /* 50px -> 45px (높이 축소) */
  border: 1px solid #333; border-radius: 4px;
  font-size: 11pt; 

  /* [추가] 8열일 때 이름이 잘리는 것을 방지 */
  overflow: hidden; 
  line-height: 1.1;
}
.print-mode .seat-empty-number {
  font-size: 1em;
  color: #bbb;
}

/* [수정] 8열일 때 폰트가 잘리지 않도록 크기 조정 */
.print-mode .seat-content {
  line-height: 1.1;
}
.print-mode .seat-name {
  font-size: 0.85em; /* 1.1em -> 0.85em (폰트 축소) */
  font-weight: 600;
  white-space: nowrap; /* 이름이 두 줄로 나뉘지 않게 */
  overflow: hidden;
  text-overflow: ellipsis; /* 이름이 너무 길면 ... 처리 */
}
.print-mode .seat-num {
  font-size: 0.7em; 
}

.print-mode.teacher-mode { justify-content: space-between; }
.print-mode.teacher-mode .grid-container { justify-content: center; flex-grow: 1; }
.print-mode.teacher-mode .screen-slot.bottom { margin-top: auto; }
/* --- [수정 완료] --- */

.screen-slot { width: 100%; display: flex; justify-content: center; padding: 10px 0; }
</style>