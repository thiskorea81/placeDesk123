<template>
    <div class="container">
      <header class="mb-20 text-center">
        <h1>설정 (관리) 페이지</h1>
      </header>
  
      <section class="controls-panel mb-20">
        <h2>Google GenAI API 키 관리</h2>
        <div class="form-group">
          <label class="form-label">API 키:</label>
          <input type="password" v-model="localApiKey" class="form-control" />
        </div>
        <button @click="saveApiKey" class="btn btn-primary">API 키 저장</button>
        <small v-if="apiKeyStatus" class="status-badge success">✅ 저장됨</small>
      </section>
  
      <section class="controls-panel mb-20">
        <h2>관리자 정보</h2>
        <div class="settings-grid">
          <div class="form-group">
            <label class="form-label">관리자 이름:</label>
            <input type="text" v-model="localAdminInfo.name" class="form-control" placeholder="예: 홍길동" />
          </div>
          <div class="form-group">
            <label class="form-label">맡은 업무:</label>
            <input type="text" v-model="localAdminInfo.role" class="form-control" placeholder="예: 1학년 부장" />
          </div>
          <div class="form-group">
            <label class="form-label">담당 학급:</label>
            <input type="text" v-model="localAdminInfo.homeroom" class="form-control" placeholder="예: 1학년 1반" />
          </div>
        </div>
        <button @click="saveAdminInfo" class="btn btn-primary">정보 저장</button>
        <small v-if="adminInfoStatus" class="status-badge success">✅ 저장됨</small>
      </section>
  
      <section class="controls-panel mb-20">
        <h2>출결 한도 설정</h2>
        <div class="settings-grid">
          <div class="form-group">
            <label class="form-label">월간 생리결석 (기본: 1회)</label>
            <input type="number" v-model.number="localSettings.menstrualLimit" min="0" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">체험학습 (국내) (기본: 7일)</label>
            <input type="number" v-model.number="localSettings.expDomesticLimit" min="0" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">체험학습 (국외) (기본: 30일)</label>
            <input type="number" v-model.number="localSettings.expInternationalLimit" min="0" class="form-control" />
          </div>
        </div>
        <button @click="saveSettings" class="btn btn-primary">출결 설정 저장</button>
        <small v-if="settingsStatus" class="status-badge success">✅ 저장됨</small>
      </section>
  
      <section class="controls-panel">
        <h2>중앙 학생 명단 관리</h2>
        <div class="form-group file-upload-group">
          <div class="label-row">
            <label class="form-label">📂 명렬표 업로드 (CSV)</label>
            <a href="#" @click.prevent="downloadExampleCSV" class="example-link">📄 예시 파일 다운로드</a>
          </div>
          <div class="upload-desc">
            필수: 학년, 반, 번호, 성명, 성별 / 선택: 학생개인번호, 생년월일, 비고
          </div>
          
          <input 
            type="file" 
            id="adminFileUpload" 
            @change="handleFileUpload" 
            accept=".csv" 
            class="file-input-hidden" 
          />
          <label for="adminFileUpload" class="btn btn-primary">
            📂 파일 선택
          </label>
          
          <span v-if="studentStore.masterList.length > 0" class="status-badge success mt-10">
            ✅ {{ studentStore.grade }}학년 {{ studentStore.classNum }}반 ({{ studentStore.masterList.length }}명) 중앙 명단에 로드됨
          </span>
        </div>
      </section>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { useAppStore } from '@/stores/app'
  import { useStudentStore } from '@/stores/students'
  
  // App 스토어 (API 키, 관리자 정보, 출결 설정)
  const appStore = useAppStore()
  const localApiKey = ref(appStore.apiKey)
  
  // localAdminInfo를 스토어 객체의 복사본으로 초기화
  const localAdminInfo = ref({ ...appStore.adminInfo })
  
  const apiKeyStatus = ref(false)
  const adminInfoStatus = ref(false) // 관리자 정보 저장 상태
  
  // 출결 설정을 스토어에서 복사해옴
  const localSettings = ref({ ...appStore.attendanceSettings })
  const settingsStatus = ref(false)
  
  const saveApiKey = () => {
    appStore.setApiKey(localApiKey.value)
    apiKeyStatus.value = true
    setTimeout(() => apiKeyStatus.value = false, 2000)
  }
  
  // saveAdminInfo가 localAdminInfo 객체 자체를 저장하도록
  const saveAdminInfo = () => {
    appStore.setAdminInfo(localAdminInfo.value) // 객체를 스토어에 전달
    adminInfoStatus.value = true
    setTimeout(() => adminInfoStatus.value = false, 2000)
  }
  
  // 출결 설정 저장
  const saveSettings = () => {
    appStore.saveAttendanceSettings(localSettings.value)
    settingsStatus.value = true
    setTimeout(() => settingsStatus.value = false, 2000)
  }
  
  // Student 스토어 (중앙 명단)
  const studentStore = useStudentStore()
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        studentStore.loadStudentsFromCSV(e.target.result)
        alert('중앙 학생 명단이 업데이트되었습니다.')
      } catch (err) {
        alert('파일 파싱 오류: ' + err.message)
      }
    }
    reader.readAsText(file, 'UTF-8');
  };
  
  const downloadExampleCSV = () => {
    // 출결 관리를 위해 '성별'이 필수로 포함된 예시 파일 제공
    const csvContent = "\uFEFF학년,반,번호,성명,학생개인번호,성별,생년월일,비고\n" +
                       "1,1,1,김철수,2025000001,남성,2010.01.01,\n" +
                       "1,1,2,이영희,2025000002,여성,2010.02.02,\n" +
                       "1,1,3,박민수,2025000003,남성,2010.03.03,\n" + 
                       "1,1,4,최지우,2025000004,여성,2010.04.04,\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '예시_학생명렬표(성별포함).csv';
    link.click();
  };
  </script>
  
  <style scoped>
  .controls-panel { background: #f8f9fa; padding: 25px; border-radius: 12px; margin-bottom: 20px; }
  .status-badge { margin-left: 10px; font-weight: bold; color: #2ecc71; }
  .mt-10 { margin-top: 10px; display: block; }
  .label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
  .example-link { font-size: 0.9em; color: #4dabf7; text-decoration: none; cursor: pointer; }
  .upload-desc { font-size: 0.85em; color: #666; margin-bottom: 10px; }
  .settings-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
    gap: 15px; 
    margin-bottom: 20px;
  }
  /* 파일 업로드 버튼(label)에 마진 추가 */
  .file-upload-group label.btn {
    margin-top: 5px;
  }
  </style>