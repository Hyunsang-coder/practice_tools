# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Korean-English interpreter training web application built with React and Vite. The app provides two main practice modes:
- **Sight Translation**: Reading Korean text with rolling highlights while interpreting to English
- **Simultaneous Interpretation**: Listening to audio/video files while providing real-time interpretation

The application runs entirely in the browser with client-side audio processing and speech-to-text conversion.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview
```

## Architecture Overview

### Core Application Flow
1. **HomePage** → Mode selection (sight translation or simultaneous interpretation)
2. **SightTranslationPage/SimultaneousPage** → Practice setup and configuration
3. **PracticePage** → Active practice session with recording
4. **ResultsPage** → Side-by-side comparison of original and interpreted text

### Key Components Structure

**Route Architecture** (`src/App.jsx`):
- `/` - HomePage (mode selection)
- `/sight-translation` - Setup for sight translation mode
- `/simultaneous` - Setup for simultaneous interpretation mode  
- `/practice` - Unified practice interface for both modes
- `/results` - Results comparison and export

**Data Flow Between Pages**:
- Navigation uses `react-router-dom`'s `navigate()` with `state` parameter
- Practice configuration flows: Setup → Practice → Results
- State includes: mode, text/file, speed settings, and results data

### Custom Hooks Architecture

**`useRecorder` Hook** (`src/hooks/useRecorder.js`):
- Manages Web Audio API for microphone recording
- Optimized for Whisper with 16kHz sample rate
- Returns: recording state, audio blob, timing, and control functions
- Handles cleanup and error states

**`useWhisper` Hook** (`src/hooks/useWhisper.js`):
- Currently uses Web Speech API as fallback (placeholder for Whisper.wasm)
- Designed for future Whisper.wasm integration
- Mock implementation with simulated loading and transcription
- Returns: loading states, transcription results, and error handling

### Sight Translation Implementation

**Rolling Text System** (`PracticePage.jsx` - `RollingText` component):
- Splits text into word arrays for progressive highlighting
- Uses `setInterval` with configurable WPM (Words Per Minute) timing
- Highlights current word + 2-3 surrounding words for context
- Speed control: 0.8x to 1.2x multiplier (40-60 WPM range)

**Real-time Speed Control**:
- Slider component allows live speed adjustment during practice
- Base speed: 50 WPM (1.0x multiplier)
- Speed changes immediately affect rolling text timing

### UI Theme System

**Modern White Theme**:
- Background: Light gradients (`#f8fafc` to `#e2e8f0`)
- Text: Dark colors for high contrast (`#1e293b`, `#475569`)
- Cards: White backgrounds with subtle shadows
- Interactive elements: Blue accent colors (`#1d4ed8`, `#3b82f6`)

**Full Viewport Layout**:
- All pages use `height: 100vh` and `width: 100vw`
- Responsive design with mobile-optimized breakpoints
- Consistent spacing and typography across all pages

### File Processing Architecture

**Media Handling** (SimultaneousPage):
- Supports video formats: `.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`
- Supports audio formats: `.mp3`, `.wav`, `.m4a`, `.ogg`, `.flac`
- File validation and size checking
- Drag-and-drop interface with visual feedback

**Future Integration Points**:
- `FFmpeg.wasm` integration planned for video audio extraction
- `Whisper.wasm` integration planned for accurate speech-to-text
- Current implementation uses mock/fallback APIs

### Results and Export System

**Results Data Structure**:
```javascript
{
  mode: 'sight-translation' | 'simultaneous',
  originalText: string,
  userTranscript: string,
  audioUrl: string | null,
  practiceSettings: {
    speed: number,
    duration: string
  }
}
```

**Export Functionality**:
- Generates formatted `.txt` file with original text, translation, and metadata
- Includes statistics: word counts, completion percentage, timing
- Uses browser's native download API

## Key Configuration Details

**Speed System**:
- Base WPM: 50 (1.0x multiplier)
- Range: 0.8x - 1.2x (40-60 WPM)
- Real-time adjustment available during practice

**Browser APIs Used**:
- `navigator.mediaDevices.getUserMedia()` for microphone access
- `MediaRecorder` API for audio capture
- Web Speech API as STT fallback
- `URL.createObjectURL()` for file handling

**Error Handling Patterns**:
- Graceful degradation for unsupported browsers
- User-friendly error messages for permissions
- Fallback mechanisms for failed API calls

## Future Development Notes

**Planned WebAssembly Integration**:
- Whisper.wasm for accurate multilingual speech recognition
- FFmpeg.wasm for client-side video processing
- Significant bundle size implications (39MB+ for Whisper base model)

**Performance Considerations**:
- Large model loading requires progress indicators
- Memory management crucial for WASM implementations
- Service worker caching recommended for model files

## Development Strategies

- 직접 개발 서버 실행하지 않고 사용자에게 테스트 권유.