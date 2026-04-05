# Braille-Matrix

A unified Braille-based toolkit for Base256 data encoding and SHA-256 visual hashing.

## Features

### Dual-Mode Interface

- **Codec Mode**: Bidirectional Base256 encoding
  - Text → Braille encoding
  - Braille → Text decoding
  - Real-time conversion with visual "Jitter & Lock" animation

- **Hash Mode**: SHA-256 fingerprint visualization
  - Generate 32-character Braille representation of SHA-256 hash
  - Sequential animation showing hash calculation

### Real-Time Processing

- Instant response to every keystroke
- No submit buttons required
- Smooth character-by-character animation

### Character Set

| Byte | Character | Unicode |
|------|-----------|---------|
| 0x00 | ᕒ | U+1552 (Canadian Syllabics Naskapi Oo) |
| 0x01-0xFF | ⠀-⣿ | U+2800-U+28FF (Braille Patterns) |

The character ᕒ (U+1552) is used exclusively to represent the null byte (0x00), while all other byte values map to their corresponding Braille Unicode characters.

## Tech Stack

- [Vue 3](https://vuejs.org/) - Progressive JavaScript Framework
- [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling
- [Tailwind CSS v4](https://tailwindcss.com/) - Utility-first CSS Framework
- Native Web Crypto API for SHA-256 hashing

## Design

Minimalist monochrome aesthetic:
- Background: #000000 (Pitch Black)
- Surface: #1A1A1A
- Text: #FFFFFF / #888888

Responsive layout optimized for both desktop and mobile devices.

### SHA-256 Display Layout

| Device | Layout |
|--------|--------|
| Desktop | 32 characters in a single line |
| Mobile | Split into 2 lines (16 characters each) |

## Development

```bash
# Install dependencies
bun install

# Build for production
bun run build

# Preview production build
bun run preview
```

## How It Works

### Base256 Encoding

```javascript
// Encoding: byte → character
if (byte === 0) return '\u1552'  // ᕒ
return String.fromCharCode(0x2800 + byte)

// Decoding: character → byte
if (char === '\u1552') return 0
return char.charCodeAt(0) - 0x2800
```

### SHA-256 Visualization

1. Calculate SHA-256 hash using `crypto.subtle.digest()`
2. Convert each byte (0-255) to corresponding Braille character
3. Display 32-character Braille string representing the 256-bit hash

## License

MIT | Vibe Coding

## Credits

Created with vibe coding.
