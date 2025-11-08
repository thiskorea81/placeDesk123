import { defineStore } from 'pinia'
import { ref, watch } from 'vue' // watch를 임포트합니다.

export const useStudentStore = defineStore('students', () => {
  // [수정됨] localStorage에서 데이터를 불러오도록 초기화합니다.
  const masterList = ref(JSON.parse(localStorage.getItem('STUDENT_MASTER_LIST')) || [])
  const grade = ref(localStorage.getItem('STUDENT_GRADE') || '')
  const classNum = ref(localStorage.getItem('STUDENT_CLASSNUM') || '')

  // [추가됨] 데이터가 변경될 때마다 localStorage에 자동으로 저장합니다.
  // deep: true 옵션으로 배열 내부의 객체가 변경(이력 추가 등)되어도 감지합니다.
  watch(masterList, (newList) => {
    localStorage.setItem('STUDENT_MASTER_LIST', JSON.stringify(newList))
  }, { deep: true })

  watch(grade, (newGrade) => {
    localStorage.setItem('STUDENT_GRADE', newGrade)
  })

  watch(classNum, (newClassNum) => {
    localStorage.setItem('STUDENT_CLASSNUM', newClassNum)
  })

  // --- (이하 로직은 대부분 동일) ---

  const getDefaultAttendance = () => ({
    menstrualLog: [],
    expDomesticLog: [],
    expInternationalLog: []
  })

  // [수정됨] CSV 로드 시 ref 값을 업데이트하면, watch가 자동으로 감지하여 저장합니다.
  function loadStudentsFromCSV(csvText) {
    const lines = csvText.trim().split('\n')
    const students = []
    let detectedGrade = '', detectedClass = ''

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      const row = line.split(',')
      // 성별(row[5])까지 있는지 확인
      if (row.length >= 6 && row[3] && row[5]) { 
        if (!detectedGrade) detectedGrade = row[0]?.trim()
        if (!detectedClass) detectedClass = row[1]?.trim()
        students.push({
          number: parseInt(row[2].trim()) || 0,
          name: row[3].trim(),
          gender: row[5].trim(),
          attendance: getDefaultAttendance()
        })
      }
    }
    // ref 값을 업데이트합니다. (localStorage 저장은 watch가 담당)
    masterList.value = students
    grade.value = detectedGrade
    classNum.value = detectedClass
  }

  // --- ID 생성 헬퍼 ---
  const generateId = () => Date.now().toString() + Math.random().toString(16).slice(2)

  // --- 이력 추가 (ID 포함) ---
  function addMenstrual(studentNumber, entry) {
    const student = masterList.value.find(s => s.number === studentNumber)
    if (student && student.gender === '여성') {
      student.attendance.menstrualLog.push({ ...entry, id: generateId() })
    }
  }

  function addExperiential(studentNumber, entry) {
    const student = masterList.value.find(s => s.number === studentNumber)
    if (!student) return

    const logEntry = { ...entry, id: generateId() }
    if (entry.type === 'domestic') {
      student.attendance.expDomesticLog.push(logEntry)
    } else if (entry.type === 'international') {
      student.attendance.expInternationalLog.push(logEntry)
    }
  }

  // --- 이력 삭제 ---
  function deleteMenstrual(studentNumber, logId) {
    const student = masterList.value.find(s => s.number === studentNumber)
    if (student) {
      student.attendance.menstrualLog = student.attendance.menstrualLog.filter(log => log.id !== logId)
    }
  }

  function deleteExperiential(studentNumber, logId, logType) {
    const student = masterList.value.find(s => s.number === studentNumber)
    if (!student) return

    const logArrayName = logType === 'domestic' ? 'expDomesticLog' : 'expInternationalLog'
    student.attendance[logArrayName] = student.attendance[logArrayName].filter(log => log.id !== logId)
  }

  // --- 이력 수정 ---
  function updateMenstrual(studentNumber, updatedLog) {
    const student = masterList.value.find(s => s.number === studentNumber)
    if (!student) return
    
    const index = student.attendance.menstrualLog.findIndex(log => log.id === updatedLog.id)
    if (index !== -1) {
      student.attendance.menstrualLog[index] = updatedLog
    }
  }

  function updateExperiential(studentNumber, updatedLog) {
    const student = masterList.value.find(s => s.number === studentNumber)
    if (!student) return

    const logArrayName = updatedLog.type === 'domestic' ? 'expDomesticLog' : 'expInternationalLog'
    const index = student.attendance[logArrayName].findIndex(log => log.id === updatedLog.id)
    if (index !== -1) {
      student.attendance[logArrayName][index] = updatedLog
    }
  }

  return { 
    masterList, 
    grade, 
    classNum, 
    loadStudentsFromCSV, 
    addMenstrual,
    addExperiential,
    deleteMenstrual,
    deleteExperiential,
    updateMenstrual,
    updateExperiential
  }
})