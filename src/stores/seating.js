import { defineStore } from 'pinia';

export const useSeatingStore = defineStore('seating', {
  state: () => ({
    originalStudents: [],
    grade: '',
    classNum: '',
    columns: 6,
    visionInput: '',
    incompatibleInput: '',
    seatingGrid: [],
  }),
  getters: {
    hasStudents: (state) => state.originalStudents.length > 0,
    sortedStudents: (state) => [...state.originalStudents].sort((a, b) => a.number - b.number),
  },
  actions: {
    loadStudentsFromCSV(csvText) {
      const lines = csvText.trim().split('\n');
      const students = [];
      let detectedGrade = '', detectedClass = '';

      // CSV 파싱 (헤더 이후부터)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const row = line.split(',');
        // 최소 데이터 확인 (학년,반,번호,성명)
        if (row.length >= 4 && row[3]) {
          if (!detectedGrade) detectedGrade = row[0]?.trim();
          if (!detectedClass) detectedClass = row[1]?.trim();
          students.push({
            number: parseInt(row[2].trim()) || 0,
            name: row[3].trim(),
            // 성별 등 추가 정보가 필요하면 여기서 확장
          });
        }
      }
      this.originalStudents = students;
      this.grade = detectedGrade;
      this.classNum = detectedClass;
      this.seatingGrid = [];
    },

    generateSeating(isRandom = true) {
      if (!this.hasStudents) return alert("학생 명단을 먼저 업로드해주세요.");
      
      let students = [...this.originalStudents];
      const numCols = this.columns;
      const numRows = Math.ceil(students.length / numCols);
      
      // 빈 그리드 생성
      let grid = Array.from({ length: numRows }, () => Array(numCols).fill(null));
      const placed = new Set();

      // 1. 우선 배정 (시력 등)
      const priorityList = this.parseInput(this.visionInput);
      priorityList.forEach(item => {
        if (Array.isArray(item)) {
          // 짝꿍 우선 배정
          this.placePair(grid, item[0], item[1], students, placed, 2);
        } else {
          // 개인 우선 배정
          this.placeSingle(grid, item, students, placed, 2);
        }
      });

      // 2. 나머지 학생 배정
      let remaining = students.filter(s => !placed.has(s.number));
      remaining = isRandom ? this.shuffle(remaining) : remaining.sort((a, b) => a.number - b.number);

      for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols; c++) {
          if (!grid[r][c] && remaining.length > 0) {
            grid[r][c] = remaining.shift();
          }
        }
      }

      // 3. 충돌 해결 (8방향 검사)
      const incompatiblePairs = this.parseInput(this.incompatibleInput, true);
      if (incompatiblePairs.length > 0) {
        grid = this.resolveConflicts(grid, incompatiblePairs);
      }
      
      this.seatingGrid = grid;
    },

    parseInput(input, forcePair = false) {
      if (!input.trim()) return [];
      return input.split(',').map(chunk => {
        chunk = chunk.trim();
        if (chunk.includes(';') || forcePair) {
          return chunk.split(';').map(s => s.trim());
        }
        return chunk;
      }).filter(i => i.length > 0);
    },

    placePair(grid, n1, n2, all, placed, maxRow) {
       const s1 = all.find(s => s.name === n1 && !placed.has(s.number));
       const s2 = all.find(s => s.name === n2 && !placed.has(s.number));
       if(!s1 || !s2) return;

       for(let r=0; r<Math.min(maxRow, grid.length); r++) {
         for(let c=0; c<grid[0].length-1; c++) {
           // 연속된 두 자리가 비었는지 확인
           if(!grid[r][c] && !grid[r][c+1]) {
             grid[r][c] = s1; 
             grid[r][c+1] = s2;
             placed.add(s1.number); 
             placed.add(s2.number);
             return;
           }
         }
       }
    },

    placeSingle(grid, name, all, placed, maxRow) {
       const s = all.find(stu => stu.name === name && !placed.has(stu.number));
       if(!s) return;

       for(let r=0; r<Math.min(maxRow, grid.length); r++) {
         for(let c=0; c<grid[0].length; c++) {
           if(!grid[r][c]) {
             grid[r][c] = s;
             placed.add(s.number);
             return;
           }
         }
       }
    },

    // 8방향(주변 모든 칸) 충돌 검사 및 해결
    resolveConflicts(grid, pairs) {
      let maxAttempts = 100;
      let conflictFound = true;

      while (conflictFound && maxAttempts > 0) {
        conflictFound = false;
        maxAttempts--;

        for (let r = 0; r < grid.length; r++) {
          for (let c = 0; c < grid[0].length; c++) {
            const currentStudent = grid[r][c];
            if (!currentStudent) continue;

            // 현재 학생과 상극인 학생 목록 찾기
            const enemies = [];
            pairs.forEach(p => {
              if (p[0] === currentStudent.name) enemies.push(p[1]);
              if (p[1] === currentStudent.name) enemies.push(p[0]);
            });

            if (enemies.length === 0) continue;

            // 8방향 검사
            if (this.check8Neighbors(grid, r, c, enemies)) {
              conflictFound = true;
              this.swapRandom(grid, r, c); // 충돌 발생 시 현재 학생을 다른 곳으로 이동
            }
          }
        }
      }
      if (maxAttempts === 0) {
        alert("완벽한 충돌 해결에 실패했습니다. 수동 조정이 필요할 수 있습니다.");
      }
      return grid;
    },

    check8Neighbors(grid, r, c, enemies) {
      const rows = grid.length;
      const cols = grid[0].length;
      // 상, 하, 좌, 우, 대각선 4방향 오프셋
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
            return true; // 충돌 발견
          }
        }
      }
      return false;
    },

    swapRandom(grid, r1, c1) {
      // 임의의 위치와 스왑 (단, 빈자리가 아닐 수도 있음)
      const r2 = Math.floor(Math.random() * grid.length);
      const c2 = Math.floor(Math.random() * grid[0].length);
      const temp = grid[r1][c1];
      grid[r1][c1] = grid[r2][c2];
      grid[r2][c2] = temp;
    },

    shuffle(arr) {
      return arr.sort(() => Math.random() - 0.5);
    }
  }
});