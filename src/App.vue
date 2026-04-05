<script setup>
import { ref, watch, computed } from 'vue'
import { useBraille } from './composables/useBraille.js'

const {
  inputText,
  outputText,
  animatedOutput,
  isEncoding,
  mode,
  isAnimating,
  processInput,
  copyOutput,
} = useBraille()

const copied = ref(false)

// Watch for input changes and process in real-time
watch(inputText, () => {
  processInput()
}, { immediate: true })

// Watch for mode changes
watch(mode, () => {
  inputText.value = ''
  outputText.value = ''
  copied.value = false
})

// Watch for encoding direction changes
watch(isEncoding, () => {
  inputText.value = ''
  outputText.value = ''
  copied.value = false
})

const handleCopy = async () => {
  const success = await copyOutput()
  if (success) {
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

const setMode = (newMode) => {
  mode.value = newMode
}

const getPlaceholder = () => {
  if (mode.value === 'hash') {
    return 'Type or paste content here...'
  }
  return isEncoding.value ? 'Type or paste content here...' : 'Paste Braille characters here...'
}

const getModeLabel = () => {
  if (mode.value === 'hash') return 'SHA-256 FINGERPRINT'
  return isEncoding.value ? 'BYTE ENCODER' : 'BYTE DECODER'
}

// Split hash output into two lines of 16 chars each for mobile
const hashOutputFirstLine = computed(() => {
  const output = animatedOutput.value || outputText.value
  if (!output || mode.value !== 'hash') return ''
  return output.slice(0, 16)
})

const hashOutputSecondLine = computed(() => {
  const output = animatedOutput.value || outputText.value
  if (!output || mode.value !== 'hash') return ''
  return output.slice(16, 32)
})
</script>

<template>
  <div class="min-h-screen bg-black text-white flex flex-col">
    <!-- Header -->
    <header class="border-b border-neutral-800 px-4 sm:px-6 py-3 sm:py-4">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <h1 class="text-base sm:text-lg font-mono tracking-tight">Braille-Matrix</h1>
        <div class="flex items-center gap-2">
          <span class="text-xs sm:text-sm text-white font-mono" title="ᕒ represents 0x00">ᕒ = 0x00</span>
          <span class="text-[10px] sm:text-xs text-neutral-500 font-mono">U+2800 — U+28FF</span>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-8">
      <!-- Mode Switcher -->
      <div class="flex items-center justify-center mb-6 sm:mb-8">
        <div class="flex border border-neutral-800 rounded-sm overflow-hidden">
          <button
            @click="setMode('codec')"
            class="px-4 sm:px-6 py-2 text-xs font-mono transition-colors duration-200"
            :class="mode === 'codec' ? 'bg-white text-black' : 'bg-black text-neutral-500 hover:text-neutral-300'"
          >
            ENCODE
          </button>
          <button
            @click="setMode('hash')"
            class="px-4 sm:px-6 py-2 text-xs font-mono transition-colors duration-200"
            :class="mode === 'hash' ? 'bg-white text-black' : 'bg-black text-neutral-500 hover:text-neutral-300'"
          >
            HASH
          </button>
        </div>
      </div>

      <!-- Mode Label -->
      <div class="text-center mb-4 sm:mb-6">
        <span class="text-[10px] sm:text-xs text-neutral-500 font-mono tracking-wider">{{ getModeLabel() }}</span>
      </div>

      <!-- Input Zone -->
      <div class="mb-4 sm:mb-6">
        <textarea
          v-model="inputText"
          :placeholder="getPlaceholder()"
          class="w-full h-32 sm:h-40 bg-neutral-900 border border-neutral-800 rounded-sm p-3 sm:p-4 text-xs sm:text-sm font-mono text-white placeholder-neutral-600 resize-none focus:outline-none focus:border-neutral-600 transition-colors"
          spellcheck="false"
        ></textarea>
      </div>

      <!-- Direction Toggle (Codec Mode Only) -->
      <div v-if="mode === 'codec'" class="flex items-center justify-center mb-4 sm:mb-6 gap-3 sm:gap-4">
        <button
          @click="isEncoding = true"
          class="text-[10px] sm:text-xs font-mono transition-colors duration-200"
          :class="isEncoding ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'"
        >
          TEXT → BRAILLE
        </button>
        <button
          @click="isEncoding = !isEncoding"
          class="text-neutral-600 hover:text-neutral-400 transition-colors p-1"
          title="Swap direction"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" sm:width="16" sm:height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M7 10h14l-4-4"/>
            <path d="M17 14H3l4 4"/>
          </svg>
        </button>
        <button
          @click="isEncoding = false"
          class="text-[10px] sm:text-xs font-mono transition-colors duration-200"
          :class="!isEncoding ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'"
        >
          BRAILLE → TEXT
        </button>
      </div>

      <!-- Output Zone - Codec Mode (Large) -->
      <div v-if="mode === 'codec'" class="flex-1 flex flex-col">
        <div class="flex items-center justify-between mb-2 sm:mb-3">
          <span class="text-[10px] sm:text-xs text-neutral-500 font-mono">
            {{ outputText ? `${outputText.length} chars` : 'Waiting for input...' }}
          </span>
          <button
            v-if="outputText"
            @click="handleCopy"
            class="text-[10px] sm:text-xs font-mono text-neutral-400 hover:text-white transition-colors flex items-center gap-1 sm:gap-2"
          >
            <span v-if="copied">Copied!</span>
            <span v-else>COPY OUTPUT</span>
          </button>
        </div>

        <!-- Output Display - Full width for Codec -->
        <div class="flex-1 bg-neutral-900 border border-neutral-800 rounded-sm p-3 sm:p-4 min-h-[100px] sm:min-h-[120px] relative overflow-hidden">
          <div 
            v-if="animatedOutput || outputText"
            class="font-mono text-lg sm:text-2xl leading-relaxed break-all whitespace-pre-wrap"
          >
            {{ animatedOutput || outputText }}
          </div>
          <div v-else class="flex items-center justify-center h-full text-neutral-600 text-xs sm:text-sm font-mono">
            Output will appear here...
          </div>
        </div>
      </div>

      <!-- Output Zone - Hash Mode (Fixed 32 chars layout) -->
      <div v-else class="flex flex-col">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] sm:text-xs text-neutral-500 font-mono">
            {{ outputText ? '32 bytes' : 'Waiting for input...' }}
          </span>
          <button
            v-if="outputText"
            @click="handleCopy"
            class="text-[10px] sm:text-xs font-mono text-neutral-400 hover:text-white transition-colors flex items-center gap-1 sm:gap-2"
          >
            <span v-if="copied">Copied!</span>
            <span v-else>COPY OUTPUT</span>
          </button>
        </div>

        <!-- Output Display - Desktop: 32 chars in one line, Mobile: 16+16 in two lines -->
        <div class="bg-neutral-900 border border-neutral-800 rounded-sm p-3 sm:p-4 relative overflow-hidden">
          <!-- Desktop: Single line of 32 chars -->
          <div 
            v-if="animatedOutput || outputText"
            class="hidden sm:block font-mono text-lg md:text-xl leading-relaxed tracking-normal text-center"
          >
            {{ animatedOutput || outputText }}
          </div>
          <div 
            v-else
            class="hidden sm:flex items-center justify-center font-mono text-lg md:text-xl leading-relaxed tracking-normal text-center text-neutral-600"
          >
            Waiting for input...
          </div>
          
          <!-- Mobile: Two lines of 16 chars each -->
          <div 
            v-if="animatedOutput || outputText"
            class="sm:hidden font-mono text-lg leading-relaxed tracking-normal text-center"
          >
            <div>{{ hashOutputFirstLine }}</div>
            <div>{{ hashOutputSecondLine }}</div>
          </div>
          <div 
            v-else
            class="sm:hidden flex flex-col items-center justify-center font-mono text-lg leading-relaxed tracking-normal text-center text-neutral-600"
          >
            <div>Waiting for</div>
            <div>input...</div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-neutral-800 px-4 sm:px-6 py-3 sm:py-4 mt-auto">
      <div class="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
        <span class="text-[10px] sm:text-xs text-neutral-600 font-mono text-center sm:text-left">Base256 Data Encoding & SHA-256 Visualization</span>
        <div class="flex items-center gap-3 sm:gap-4">
          <a 
            href="https://github.com/senzi/Braille-Cast" 
            target="_blank"
            rel="noopener noreferrer"
            class="text-[10px] sm:text-xs text-neutral-500 hover:text-neutral-300 font-mono transition-colors"
          >
            GitHub
          </a>
          <span class="text-[10px] sm:text-xs text-neutral-600 font-mono">| MIT | Vibe Coding</span>
        </div>
      </div>
    </footer>
  </div>
</template>
