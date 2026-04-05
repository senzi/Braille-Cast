import { ref } from 'vue'

const BRAILLE_OFFSET = 0x2800
const ZERO_CHAR = 0x1552 // ᕒ represents 0x00

// Encode byte to character
function byteToChar(byte) {
  if (byte === 0) {
    return String.fromCharCode(ZERO_CHAR) // ᕒ for 0x00
  }
  return String.fromCharCode(BRAILLE_OFFSET + byte)
}

// Decode character to byte
function charToByte(char) {
  const code = char.charCodeAt(0)
  if (code === ZERO_CHAR) {
    return 0 // ᕒ represents 0x00
  }
  if (code >= BRAILLE_OFFSET && code <= BRAILLE_OFFSET + 255) {
    return code - BRAILLE_OFFSET
  }
  return null // Invalid character
}

// Generate random Braille character (including ᕒ)
export function getRandomBraille() {
  const bytes = Array.from({ length: 256 }, (_, i) => i)
  const randomByte = bytes[Math.floor(Math.random() * bytes.length)]
  return byteToChar(randomByte)
}

// Encode text to Braille (Base256)
export function textToBraille(text) {
  if (!text) return ''
  const encoder = new TextEncoder()
  const bytes = encoder.encode(text)
  return Array.from(bytes)
    .map(byte => byteToChar(byte))
    .join('')
}

// Decode Braille to text
export function brailleToText(braille) {
  if (!braille) return ''
  const bytes = []
  for (const char of braille) {
    const byte = charToByte(char)
    if (byte !== null) {
      bytes.push(byte)
    }
  }
  const decoder = new TextDecoder()
  return decoder.decode(new Uint8Array(bytes))
}

// Calculate SHA-256 hash and convert to Braille
export async function sha256ToBraille(text) {
  if (!text) return ''
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray
    .map(byte => byteToChar(byte))
    .join('')
}

// Composable for Braille operations
export function useBraille() {
  const inputText = ref('')
  const outputText = ref('')
  const isEncoding = ref(true) // true = encode, false = decode in codec mode
  const mode = ref('codec') // 'codec' or 'hash'
  const isAnimating = ref(false)
  
  // Animation state
  const animatedOutput = ref('')
  const settledIndices = ref(new Set())
  let animationFrame = null
  let timeoutIds = []
  
  const clearAnimations = () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
      animationFrame = null
    }
    timeoutIds.forEach(id => clearTimeout(id))
    timeoutIds = []
    settledIndices.value.clear()
  }
  
  const animateLockIn = (finalString, duration = 800) => {
    clearAnimations()
    
    if (!finalString) {
      animatedOutput.value = ''
      return
    }
    
    isAnimating.value = true
    const length = finalString.length
    const chars = Array(length).fill('').map(() => getRandomBraille())
    animatedOutput.value = chars.join('')
    
    // Calculate delay per character
    const delayPerChar = duration / length
    
    // Settle characters one by one
    for (let i = 0; i < length; i++) {
      const timeoutId = setTimeout(() => {
        chars[i] = finalString[i]
        settledIndices.value.add(i)
        animatedOutput.value = chars.join('')
        
        if (i === length - 1) {
          isAnimating.value = false
        }
      }, i * delayPerChar)
      timeoutIds.push(timeoutId)
    }
  }
  
  // Process input based on current mode
  const processInput = async () => {
    if (!inputText.value) {
      outputText.value = ''
      animatedOutput.value = ''
      return
    }
    
    if (mode.value === 'hash') {
      const result = await sha256ToBraille(inputText.value)
      outputText.value = result
      animateLockIn(result, 1000)
    } else {
      // Codec mode
      if (isEncoding.value) {
        const result = textToBraille(inputText.value)
        outputText.value = result
        animateLockIn(result, 600)
      } else {
        // Decode mode - no animation for decoding, direct conversion
        const result = brailleToText(inputText.value)
        outputText.value = result
        animatedOutput.value = result
      }
    }
  }
  
  const copyOutput = async () => {
    const textToCopy = isAnimating.value ? animatedOutput.value : outputText.value
    if (textToCopy) {
      await navigator.clipboard.writeText(textToCopy)
      return true
    }
    return false
  }
  
  return {
    inputText,
    outputText,
    animatedOutput,
    isEncoding,
    mode,
    isAnimating,
    settledIndices,
    processInput,
    copyOutput,
  }
}
