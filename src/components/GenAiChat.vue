<template>
    <section class="controls-panel">
      <div class="form-group">
        <label class="form-label">GenAI에 질문하기:</label>
        <textarea v-model="prompt" rows="5" class="form-control" placeholder="예: Explain how AI works in a few words"></textarea>
      </div>
  
      <div class="action-buttons">
        <button @click="runGenAI" :disabled="loading" class="btn btn-success">
          {{ loading ? '생성 중...' : '전송' }}
        </button>
      </div>
    </section>
  
    <section v-if="result || error" class="preview-section mt-20">
      <div v-if="error" class="error-box">
        <strong>오류:</strong> {{ error }}
      </div>
      <div v-if="result" class="result-box">
        <strong>응답:</strong>
        <pre>{{ result }}</pre>
      </div>
    </section>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { GoogleGenAI } from '@google/genai'
  
  // 이 컴포넌트는 API 키를 props로 받습니다.
  const props = defineProps({
    apiKey: {
      type: String,
      required: true
    }
  })
  
  const prompt = ref('Explain how AI works in a few words')
  const result = ref('')
  const error = ref('')
  const loading = ref(false)
  
  async function runGenAI() {
    loading.value = true
    result.value = ''
    error.value = ''
  
    // props로 받은 apiKey 사용
    const GEMINI_API_KEY = props.apiKey.trim()
  
    if (!GEMINI_API_KEY) {
      error.value = 'API 키가 없습니다. [설정 (관리)] 탭에서 유효한 키를 입력해주세요.'
      loading.value = false
      return
    }
    
    try {
      const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});
          
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt.value
      });
      result.value = await response.text;
  
    } catch (e) {
      console.error(e);
      error.value = `[GenAI 오류] ${e.message || '알 수 없는 오류가 발생했습니다.'} (API 키를 확인하거나 모델명을 확인하세요.)`
    } finally {
      loading.value = false
    }
  }
  </script>
  
  <style scoped>
  .controls-panel { background: #f8f9fa; padding: 25px; border-radius: 12px; }
  .action-buttons { text-align: center; margin-top: 20px; }
  .result-box { background: #e6f7ff; border: 1px solid #b3e0ff; padding: 15px; border-radius: 8px; margin-top: 20px; }
  .error-box { background: #ffebee; border: 1px solid #ffcdd2; color: #c62828; padding: 15px; border-radius: 8px; }
  pre { white-space: pre-wrap; word-wrap: break-word; font-family: inherit; margin-top: 10px; }
  </style>