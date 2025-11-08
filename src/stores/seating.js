import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useStudentStore } from './students'

export const useSeatingStore = defineStore('seating', () => {
  // --- 상태 (State) ---
  const originalStudents = ref([])
  const grade = ref('')
  const classNum = ref('')
  
  const columns = ref(6) // 기본 6열
  const visionInput = ref('')
  const incompatibleInput = ref('')
  const fixedSeatingInput = ref('') // 고정석 입력 (예: "1:고지원")

  const seatingGrid = ref([]) // 빈 그리드([]) 또는 학생으로 채워진 그리드

  const seatingHistoryList = ref(JSON.parse(localStorage.getItem('SEATING_HISTORY_LIST')) || [])

  // 이력 배열이 변경되면 LocalStorage에 자동 저장
  watch(seatingHistoryList, (newList) => {
    localStorage.setItem('SEATING_HISTORY_LIST', JSON.stringify(newList))
  }, { deep: true })

  // [신규] '가로 좌석 수'가 변경되면, 빈 그리드를 다시 생성하여 번호판을 갱신함
  watch(columns, (newCols) => {
    if (newCols > 0 && hasStudents.value) {
      createInitialGrid(); // 빈 그리드 재생성
      resetInputs(); // 관련 입력값 초기화
    }
  })

  // --- 게터 (Getters) ---
  const hasStudents = computed(() => originalStudents.value.length > 0)
  const sortedStudents = computed(() =>
    [...originalStudents.value].sort((a, b) => a.number - b.number)
  )

  // --- 내부 헬퍼 함수 (전체 포함) ---

  const parseInput = (input, forcePair = false) => {
    if (!input.trim()) return [];
    return input.split(',').map(chunk => {
      chunk = chunk.trim();
      if (chunk.includes(';') || forcePair) {
        return chunk.split(';').map(s => s.trim());
      }
      return chunk;
    }).filter(i => i.length > 0 && i[0]);
  };

  const placePair = (grid, n1, n2, all, placed, maxRow) => {
    const s1 = all.find(s => s.name === n1 && !placed.has(s.number));
    const s2 = all.find(s => s.name === n2 && !placed.has(s.number));
    if (!s1 || !s2) return;
    for (let r = 0; r < Math.min(maxRow, grid.length); r++) {
      for (let c = 0; c < grid[0].length - 1; c++) {
        if (!grid[r][c] && !grid[r][c + 1]) {
          grid[r][c] = s1;
          grid[r][c + 1] = s2;
          placed.add(s1.number);
          placed.add(s2.number);
          return;
        }
      }
    }
  };

  const placeSingle = (grid, name, all, placed, maxRow) => {
    const s = all.find(stu => stu.name === name && !placed.has(stu.number));
    if (!s) return;
    for (let r = 0; r < Math.min(maxRow, grid.length); r++) {
      for (let c = 0; c < grid[0].length; c++) {
        if (!grid[r][c]) {
          grid[r][c] = s;
          placed.add(s.number);
          return;
        }
      }
    }
  };

  const check8Neighbors = (grid, r, c, enemies) => {
    const rows = grid.length;
    const cols = grid[0].length;
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        const neighbor = grid[nr][nc];
        if (neighbor && enemies.includes(neighbor.name)) {
          return true;
        }
      }
    }
    return false;
  };

  const swapRandom = (grid, r1, c1) => {
    const r2 = Math.floor(Math.random() * grid.length);
    const c2 = Math.floor(Math.random() * grid[0].length);
    const temp = grid[r1][c1];
    grid[r1][c1] = grid[r2][c2];
    grid[r2][c2] = temp;
  };

  const resolveConflicts = (grid, pairs) => {
    let maxAttempts = 100;
    let conflictFound = true;
    while (conflictFound && maxAttempts > 0) {
      conflictFound = false;
      maxAttempts--;
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[0].length; c++) {
          const currentStudent = grid[r][c];
          if (!currentStudent) continue;
          const enemies = [];
          pairs.forEach(p => {
            if (p.length < 2) return;
            if (p[0] === currentStudent.name) enemies.push(p[1]);
            if (p[1] === currentStudent.name) enemies.push(p[0]);
          });
          if (enemies.length === 0) continue;
          if (check8Neighbors(grid, r, c, enemies)) {
            conflictFound = true;
            swapRandom(grid, r, c);
          }
        }
      }
    }
    return grid;
  };

  const shuffle = (arr) => {
    return arr.sort(() => Math.random() - 0.5);
  };

  // --- 액션 (Actions) ---

  // 헬퍼: 빈 그리드 생성 (좌석 번호 표시용)
  function createInitialGrid() {
    const numCols = columns.value;
    if (numCols <= 0 || originalStudents.value.length === 0) {
      seatingGrid.value = [];
      return;
    }
    const numRows = Math.ceil(originalStudents.value.length / numCols);
    seatingGrid.value = Array.from({ length: numRows }, () => Array(numCols).fill(null));
  }

  // 헬퍼: 입력 필드만 리셋
  function resetInputs() {
    visionInput.value = ''
    incompatibleInput.value = ''
    fixedSeatingInput.value = ''
  }
  
  function loadFromMasterList() {
    const studentStore = useStudentStore();
    if (studentStore.masterList.length === 0) {
      alert('먼저 [설정 (관리)] 페이지에서 학생 명단을 업로드해주세요.');
      return;
    }
    originalStudents.value = JSON.parse(JSON.stringify(studentStore.masterList));
    grade.value = studentStore.grade;
    classNum.value = studentStore.classNum;
    resetInputs();
    createInitialGrid(); // 빈 그리드 생성
  }

  function loadStudentsFromCSV(csvText) {
    const lines = csvText.trim().split('\n')
    const students = []
    let detectedGrade = '', detectedClass = ''
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim(); if (!line) continue;
      const row = line.split(',');
      if (row.length >= 4 && row[3]) { 
        if (!detectedGrade) detectedGrade = row[0]?.trim();
        if (!detectedClass) detectedClass = row[1]?.trim();
        students.push({ number: parseInt(row[2].trim()) || 0, name: row[3].trim() });
      }
    }
    originalStudents.value = students;
    grade.value = detectedGrade;
    classNum.value = detectedClass;
    resetInputs();
    createInitialGrid(); // 빈 그리드 생성
  }

  /**
   * 메인 자리 배치 로직 (이력 반환)
   */
  function generateSeating(isRandom = true) {
    if (!hasStudents.value) {
      alert("학생 명단을 먼저 로드해주세요.");
      return null;
    }

    let students = [...originalStudents.value];
    const numCols = columns.value; 
    if (numCols <= 0) {
      alert("가로 좌석 수는 1 이상이어야 합니다.");
      return null;
    }
    
    const numRows = Math.ceil(students.length / numCols);
    let grid = Array.from({ length: numRows }, () => Array(numCols).fill(null));
    const placed = new Set();
    const newHistory = {}; // 이번 배정 결과를 저장할 객체

    // --- 1. 고정석 배정 ---
    const fixedInput = fixedSeatingInput.value.trim();
    if (fixedInput) {
      fixedInput.split(',').forEach(pairStr => {
        const parts = pairStr.split(':');
        if (parts.length === 2) {
          const seatNum = parseInt(parts[0].trim());
          const name = parts[1].trim();
          if (seatNum > 0 && name) {
            const seatIndex = seatNum - 1; 
            const r = Math.floor(seatIndex / numCols);
            const c = seatIndex % numCols;
            if (r < numRows && c < numCols) {
              const student = students.find(s => s.name === name && !placed.has(s.number));
              if (student) {
                grid[r][c] = student;
                placed.add(student.number);
                newHistory[student.name] = seatNum;
              }
            }
          }
        }
      });
    }

    // --- 2. 우선 배정 (시력 등) ---
    const priorityList = parseInput(visionInput.value);
    priorityList.forEach(item => {
      Array.isArray(item)
        ? placePair(grid, item[0], item[1], students, placed, 2)
        : placeSingle(grid, item, students, placed, 2);
    });

    // --- 3. 나머지 학생 배정 ---
    let remaining = students.filter(s => !placed.has(s.number));
    remaining = isRandom ? shuffle(remaining) : remaining.sort((a, b) => a.number - b.number);
    
    const lastHistory = seatingHistoryList.value[0]?.history || {};

    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        if (grid[r][c] !== null) continue;

        if (remaining.length > 0) {
          const currentSeatNumber = (r * numCols) + c + 1;
          let studentToPlace = null;
          let studentIndex = -1;

          if (isRandom) {
            studentIndex = remaining.findIndex(s => 
              lastHistory[s.name] !== currentSeatNumber
            );
            if (studentIndex === -1) { studentIndex = 0; }
          } else {
            studentIndex = 0; // 번호순
          }

          studentToPlace = remaining.splice(studentIndex, 1)[0];
          grid[r][c] = studentToPlace;
          newHistory[studentToPlace.name] = currentSeatNumber;
        }
      }
    }

    // --- 4. 충돌 해결 ---
    const incompatiblePairs = parseInput(incompatibleInput.value, true);
    if (incompatiblePairs.length > 0) {
      grid = resolveConflicts(grid, incompatiblePairs);
    }

    // --- 5. 그리드 업데이트 및 이력 반환 ---
    seatingGrid.value = grid;
    return newHistory; // View가 이 값을 받아서 확정 버튼을 활성화
  }

  /**
   * 확정된 배치를 이력 목록에 저장
   */
  function saveCurrentSeating(historyToSave) {
    if (!historyToSave) return;
    
    const today = new Date().toISOString().slice(0, 10);
    const entry = { date: today, history: historyToSave };

    const existingIndex = seatingHistoryList.value.findIndex(h => h.date === today);
    if (existingIndex !== -1) {
      seatingHistoryList.value[existingIndex] = entry;
      alert('오늘 날짜의 좌석 배치를 덮어썼습니다.');
    } else {
      seatingHistoryList.value.unshift(entry);
      alert('현재 좌석 배치가 저장되었습니다.');
    }
    
    if (seatingHistoryList.value.length > 10) {
      seatingHistoryList.value.pop();
    }
  }

  /**
   * 선택한 이력을 불러와 그리드에 적용
   */
  function loadSeatingFromHistory(date) {
    if (!date) {
      alert('불러올 날짜를 선택하세요.');
      return;
    }
    
    const found = seatingHistoryList.value.find(h => h.date === date);
    if (!found) {
      alert('해당 날짜의 이력을 찾을 수 없습니다.');
      return;
    }

    const historyToLoad = found.history;
    const numCols = columns.value;
    const numRows = Math.ceil(originalStudents.value.length / numCols);
    let grid = Array.from({ length: numRows }, () => Array(numCols).fill(null));

    for (const studentName in historyToLoad) {
      const seatNum = historyToLoad[studentName];
      const student = originalStudents.value.find(s => s.name === studentName);
      
      if (student) {
        const seatIndex = seatNum - 1;
        const r = Math.floor(seatIndex / numCols);
        const c = seatIndex % numCols;
        if (r < numRows && c < numCols) {
          grid[r][c] = student;
        }
      }
    }
    
    seatingGrid.value = grid;
    resetInputs();
    alert(`${date}일자 좌석을 불러왔습니다.`);
  }

  return {
    // State
    originalStudents, grade, classNum, columns, visionInput, incompatibleInput, 
    fixedSeatingInput, seatingGrid, seatingHistoryList,
    
    // Getters
    hasStudents, sortedStudents,
    
    // Actions
    loadFromMasterList,
    loadStudentsFromCSV,
    generateSeating,
    saveCurrentSeating,
    loadSeatingFromHistory
  };
});