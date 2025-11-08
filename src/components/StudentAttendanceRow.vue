<template>
    <tr>
      <td>{{ student.number }}</td>
      <td>{{ student.name }}</td>
      
      <td :class="{ 'limit-exceeded': isDomesticOver }">
        {{ totalExpDomestic }} / {{ settings.expDomesticLimit }} 일
      </td>
      <td :class="{ 'limit-exceeded': isInternationalOver }">
        {{ totalExpInternational }} / {{ settings.expInternationalLimit }} 일
      </td>
      <td :class="{ 'limit-exceeded': isMenstrualOver }">
        <span v-if="student.gender === '여성'">
          {{ monthlyMenstrualCount }} / {{ settings.menstrualLimit }} 회
        </span>
        <span v-else class="text-muted">-</span>
      </td>
      
      <td>
        <button @click="showModal = true" class="btn btn-dark btn-sm">
          + 추가/관리
        </button>
      </td>
    </tr>
  
    <div v-if="showModal" class="modal-backdrop" @click.self="cancelEdit">
      <div class="modal-content">
        <h4>{{ student.number }}. {{ student.name }} 출결 관리</h4>
        
        <div class="modal-form">
          <div class="form-group">
            <label class="form-label">날짜</label>
            <input type="date" v-model="entryDate" class="form-control" />
          </div>
          
          <fieldset class="action-group" :disabled="editingLog && editingLog.logType !== 'menstrual'">
            <legend>생리결석</legend>
            <select v-model="menstrualType" class="form-control" :disabled="student.gender !== '여성'">
              <option value="결석">결석</option>
              <option value="지각">지각</option>
              <option value="조퇴">조퇴</option>
            </select>
            <button 
              @click="handleSaveMenstrual" 
              :disabled="student.gender !== '여성' && !editingLog"
              :class="editingLog && editingLog.logType === 'menstrual' ? 'btn-success' : 'btn-primary'"
              class="btn"
            >
              {{ editingLog && editingLog.logType === 'menstrual' ? '✓ 수정' : '+ 추가' }}
            </button>
          </fieldset>
  
          <fieldset class="action-group" :disabled="editingLog && editingLog.logType !== 'experiential'">
            <legend>체험학습</legend>
            <div class="exp-inputs">
              <select v-model="expType" class="form-control">
                <option value="domestic">국내</option>
                <option value="international">국외</option>
              </select>
              <input type="number" v-model.number="expDays" min="1" class="form-control-sm" /> 일
            </div>
            <input type="text" v-model="expReason" placeholder="사유 (예: 가족 여행)" class="form-control" />
            <button 
              @click="handleSaveExperiential" 
              class="btn"
              :class="editingLog && editingLog.logType === 'experiential' ? 'btn-success' : 'btn-primary'"
            >
              {{ editingLog && editingLog.logType === 'experiential' ? '✓ 수정' : '+ 추가' }}
            </button>
          </fieldset>
        </div>
        
        <button v-if="editingLog" @click="cancelEdit" class="btn btn-warning mt-10">
          수정 취소
        </button>
  
        <div class="history-log">
          <h5>이력 (클릭하여 수정)</h5>
          <ul>
            <li v-for="log in student.attendance.menstrualLog" :key="log.id">
              <span>[생리] {{ log.date }} ({{ log.type }})</span>
              <div class="log-actions">
                <button @click="startEdit(log, 'menstrual')" class="btn-edit">수정</button>
                <button @click="handleDelete(log.id, 'menstrual')" class="btn-delete">삭제</button>
              </div>
            </li>
            <li v-for="log in student.attendance.expDomesticLog" :key="log.id">
              <span>[국내] {{ log.date }} ({{ log.days }}일: {{ log.reason }})</span>
              <div class="log-actions">
                <button @click="startEdit(log, 'experiential')" class="btn-edit">수정</button>
                <button @click="handleDelete(log.id, 'domestic')" class="btn-delete">삭제</button>
              </div>
            </li>
            <li v-for="log in student.attendance.expInternationalLog" :key="log.id">
              <span>[국외] {{ log.date }} ({{ log.days }}일: {{ log.reason }})</span>
              <div class="log-actions">
                <button @click="startEdit(log, 'experiential')" class="btn-edit">수정</button>
                <button @click="handleDelete(log.id, 'international')" class="btn-delete">삭제</button>
              </div>
            </li>
          </ul>
          <span v-if="!hasHistory" class="text-muted">이력이 없습니다.</span>
        </div>
  
        <button @click="cancelEdit" class="btn btn-light mt-20">닫기</button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue'
  import { useStudentStore } from '@/stores/students'
  
  const props = defineProps({
    student: { type: Object, required: true },
    settings: { type: Object, required: true }
  })
  
  const studentStore = useStudentStore()
  const showModal = ref(false)
  
  // --- [신규] 수정 모드 상태 ---
  const editingLog = ref(null) // null | { id: '...', logType: 'menstrual'|'experiential', ...data }
  
  // --- 모달 입력용 Refs ---
  const defaultDate = new Date().toISOString().slice(0, 10)
  const entryDate = ref(defaultDate)
  const menstrualType = ref('결석')
  const expType = ref('domestic')
  const expDays = ref(1)
  const expReason = ref('')
  
  // --- 동적 계산 (Computed) ---
  const currentMonth = new Date().toISOString().slice(0, 7)
  
  const monthlyMenstrualCount = computed(() => {
    return props.student.attendance.menstrualLog.filter(log => 
      log.date.startsWith(currentMonth)
    ).length
  })
  
  const totalExpDomestic = computed(() => {
    return props.student.attendance.expDomesticLog.reduce((sum, log) => sum + log.days, 0)
  })
  
  const totalExpInternational = computed(() => {
    return props.student.attendance.expInternationalLog.reduce((sum, log) => sum + log.days, 0)
  })
  
  const hasHistory = computed(() => 
    props.student.attendance.menstrualLog.length > 0 ||
    props.student.attendance.expDomesticLog.length > 0 ||
    props.student.attendance.expInternationalLog.length > 0
  )
  
  const isDomesticOver = computed(() => totalExpDomestic.value >= props.settings.expDomesticLimit)
  const isInternationalOver = computed(() => totalExpInternational.value >= props.settings.expInternationalLimit)
  const isMenstrualOver = computed(() => props.student.gender === '여성' && monthlyMenstrualCount.value >= props.settings.menstrualLimit)
  
  // --- [신규] 폼 리셋 및 수정 취소 ---
  const resetForm = () => {
    entryDate.value = defaultDate
    menstrualType.value = '결석'
    expType.value = 'domestic'
    expDays.value = 1
    expReason.value = ''
    editingLog.value = null
  }
  
  const cancelEdit = () => {
    resetForm()
    showModal.value = false // 모달 닫기
  }
  
  // --- [신규] 수정 시작 ---
  const startEdit = (log, logType) => {
    editingLog.value = { ...log, logType }
    
    entryDate.value = log.date
    if (logType === 'menstrual') {
      menstrualType.value = log.type
    } else if (logType === 'experiential') {
      expType.value = log.type
      expDays.value = log.days
      expReason.value = log.reason
    }
  }
  
  // --- [수정됨] 저장 핸들러 (추가/수정 분기) ---
  const handleSaveMenstrual = () => {
    if (!entryDate.value) return alert('날짜를 선택하세요.')
    
    const entry = {
      date: entryDate.value,
      type: menstrualType.value
    }
  
    if (editingLog.value) { // 수정 모드
      studentStore.updateMenstrual(props.student.number, { ...entry, id: editingLog.value.id })
    } else { // 추가 모드
      studentStore.addMenstrual(props.student.number, entry)
    }
    resetForm()
  }
  
  const handleSaveExperiential = () => {
    if (!entryDate.value) return alert('날짜를 선택하세요.')
    if (expDays.value <= 0) return alert('일수는 1 이상이어야 합니다.')
    
    const entry = {
      type: expType.value,
      date: entryDate.value,
      days: expDays.value,
      reason: expReason.value || '사유 미입력'
    }
  
    if (editingLog.value) { // 수정 모드
      // 수정 시 원본 로그의 type이 바뀌었는지 확인 (국내 <-> 국외)
      const originalType = editingLog.value.type
      if (originalType !== entry.type) {
        // 타입이 변경되었으면, 원본 삭제 후 새 타입으로 추가
        studentStore.deleteExperiential(props.student.number, editingLog.value.id, originalType)
        studentStore.addExperiential(props.student.number, entry) // 새 ID로 추가됨
      } else {
        // 타입이 동일하면, 그냥 업데이트
        studentStore.updateExperiential(props.student.number, { ...entry, id: editingLog.value.id })
      }
    } else { // 추가 모드
      studentStore.addExperiential(props.student.number, entry)
    }
    resetForm()
  }
  
  // --- [신규] 삭제 핸들러 ---
  const handleDelete = (logId, logType) => {
    if (!confirm('이 이력을 정말 삭제하시겠습니까?')) return
  
    if (logType === 'menstrual') {
      studentStore.deleteMenstrual(props.student.number, logId)
    } else {
      // 'domestic' 또는 'international'
      studentStore.deleteExperiential(props.student.number, logId, logType)
    }
    // 혹시 삭제한 이력을 수정 중이었다면, 수정 모드 취소
    if (editingLog.value && editingLog.value.id === logId) {
      resetForm()
    }
  }
  </script>
  
  <style scoped>
  .text-muted { color: #aaa; }
  .limit-exceeded { color: #e03131; font-weight: bold; }
  .btn-sm { padding: 5px 10px; font-size: 0.9em; }
  
  /* 모달 */
  .modal-backdrop {
    position: fixed; top: 0; left: 0;
    width: 100%; height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000;
  }
  .modal-content {
    background: white; padding: 25px; border-radius: 12px;
    width: 90%; max-width: 500px;
    max-height: 90vh; display: flex; flex-direction: column;
  }
  .modal-content h4 { margin-bottom: 20px; }
  
  .modal-form { display: flex; flex-direction: column; gap: 20px; }
  .action-group {
    border: 1px solid #eee; padding: 15px; border-radius: 8px;
  }
  .action-group[disabled] {
    background-color: #f8f9fa;
    opacity: 0.6;
  }
  .action-group legend { 
    font-size: 1.1em; font-weight: bold; padding: 0 5px; margin-left: 10px;
  }
  .action-group select, .action-group button, .action-group input {
    margin-top: 10px;
  }
  .exp-inputs { display: flex; align-items: center; gap: 10px; }
  .form-control-sm { width: 70px; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
  .mt-10 { margin-top: 10px; }
  
  /* 이력 */
  .history-log {
    margin-top: 20px;
    border-top: 1px dashed #ccc;
    padding-top: 15px;
    flex-grow: 1;
    overflow-y: auto;
    max-height: 250px; /* 이력 스크롤 */
  }
  .history-log h5 { margin-bottom: 10px; }
  .history-log ul { list-style: none; padding: 0; margin: 0; }
  .history-log li {
    padding: 8px 4px;
    font-size: 0.9em;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .log-actions { display: flex; gap: 5px; }
  .btn-edit, .btn-delete {
    padding: 3px 8px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8em;
  }
  .btn-edit { background-color: #e9ecef; color: #333; }
  .btn-delete { background-color: #ffebee; color: #c62828; }
  </style>