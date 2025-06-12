// Musical constants
export const NOTES_PER_OCTAVE = 46; // 46 EDO tuning system
export const NUM_OCTAVES = 8;
export const NOTES_PER_SEMITONE = 3.83; // Approximate divisions per semitone in 46 EDO (46/12)
export const TOTAL_KEYS = NUM_OCTAVES * NOTES_PER_OCTAVE;

// 12-tone to 46 EDO mapping
export const TWELVE_TO_46_EDO_MAP = {
    0: 0,   // C
    1: 5,   // C#
    2: 8,   // D
    3: 13,  // D#
    4: 16,  // E
    5: 19,  // F
    6: 24,  // F#
    7: 27,  // G
    8: 32,  // G#
    9: 35,  // A
    10: 40, // A#
    11: 43  // B
};

// Audio constants
export const BASE_FREQUENCY = 440; // A4 in Hz
export const WAVE_SAMPLES = 256; // Samples per wave in wavetable
export const BASE_SAMPLE_RATE = 22050; // Base sample rate for drums
export const MAX_DRUMS = 6; // Maximum number of drum samples
export const MAX_MELODIC_SAMPLES = 100; // M00-M99

// Timing constants
export const DEFAULT_BPM = 120;
export const BEATS_PER_MEASURE = 4; // 4/4 time
export const GRID_SUBDIVISIONS = 4; // Each beat divided into 4 parts (16th notes)

// UI dimensions
export const PIANO_KEY_WIDTH = 60;
export const NOTE_HEIGHT = 6; // Adjusted for 46 EDO
export const GRID_WIDTH = 40;
export const TOTAL_MEASURES = 256;
export const RESIZE_HANDLE_WIDTH = 8; // Pixels from edge to detect resize

// UI constants
export const PAN_BAR_HEIGHT = 60;
export const VELOCITY_BAR_HEIGHT = 60;
export const DEFAULT_VELOCITY = 100;
export const DEFAULT_VOLUME = 30;

// Performance constants
export const VISIBLE_AREA_PADDING = 100; // Extra pixels to render outside visible area
export const PORTAMENTO_TIME = 0.05; // Seconds for pitch glide
export const AUDIO_STOP_DELAY = 0.01; // Brief delay to prevent audio glitches

// Organya format constants
export const ORG_FILE_SIGNATURE = 'Org-02';
export const ORG_VERSION = 2;
export const ORG_MAX_KEY = 95;
export const ORG_VELOCITY_SCALE = 2; // Convert 0-127 to 0-254 range

// Colors
export const COLORS = {
    background: '#222',
    whiteKey: '#3a3a3a',
    whiteKeyHighlight: '#4a4a4a',
    blackKey: '#1a1a1a',
    blackKeyHighlight: '#2a2a2a',
    keyBorder: '#111',
    keyShadow: 'rgba(0, 0, 0, 0.5)',
    grid: '#2a2a2a',
    note: '#4a9eff',
    noteActive: '#6ab7ff',
    noteBorder: '#357abd',
    playhead: '#ff4444',
    text: '#888',
    loopMarker: '#ffaa00',
    loopBackground: 'rgba(255, 170, 0, 0.02)'
};

// Instrument color palette
export const INSTRUMENT_COLOR_PALETTE = [
    { note: '#ff5252', border: '#d32f2f' }, // Bright Red
    { note: '#40e0d0', border: '#00acc1' }, // Bright Turquoise
    { note: '#ffd740', border: '#f9a825' }, // Bright Yellow
    { note: '#69f0ae', border: '#00c853' }, // Bright Mint
    { note: '#ff4081', border: '#f50057' }, // Bright Pink
    { note: '#b388ff', border: '#7c4dff' }, // Bright Lavender
    { note: '#ff6e40', border: '#ff3d00' }, // Bright Coral
    { note: '#64ffda', border: '#1de9b6' }, // Bright Seafoam
    { note: '#ffab40', border: '#ff6f00' }, // Bright Orange
    { note: '#40c4ff', border: '#0091ea' }, // Bright Sky blue
    { note: '#e040fb', border: '#aa00ff' }, // Bright Purple
    { note: '#ff8a80', border: '#ff5252' }, // Bright Peach
    { note: '#448aff', border: '#2962ff' }, // Bright Blue
    { note: '#ff80ab', border: '#ff4081' }, // Bright Rose
    { note: '#7c4dff', border: '#651fff' }, // Bright Violet
    { note: '#00e676', border: '#00c853' }  // Bright Emerald
];