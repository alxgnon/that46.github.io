import { PianoRoll } from './PianoRoll.js';
import { ModalManager } from './ModalManager.js';
import { MenuManager } from './MenuManager.js';
import { PanBar } from './PanBar.js';
import { VelocityBar } from './VelocityBar.js';
import { DEFAULT_VOLUME, NOTES_PER_OCTAVE } from './constants.js';

// Initialize managers
const modalManager = new ModalManager();
window.modalManager = modalManager; // Make it globally accessible
const menuManager = new MenuManager(modalManager);
let pianoRoll = null;
let panBar = null;
let velocityBar = null;
let currentFilename = null;

// Update page title based on current file
function updatePageTitle() {
    if (currentFilename) {
        document.title = `${currentFilename} - that46.org`;
    } else {
        document.title = 'that46.org - 46-EDO Composition Tool';
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize piano roll
    const canvas = document.getElementById('pianoRoll');
    pianoRoll = new PianoRoll(canvas);
    
    // Listen for playback state changes
    pianoRoll.addEventListener('playbackStateChange', () => {
        updatePlayButton();
    });
    
    // Initialize pan and velocity bars
    const panCanvas = document.getElementById('panCanvas');
    const velocityCanvas = document.getElementById('velocityCanvas');
    
    if (panCanvas) {
        panBar = new PanBar(panCanvas, pianoRoll);
    }
    
    if (velocityCanvas) {
        velocityBar = new VelocityBar(velocityCanvas, pianoRoll);
        pianoRoll.velocityBar = velocityBar;
    }
    
    
    // Setup UI controls
    setupControls();
    setupModals();
    setupMenus();
    
    // Initialize UI state
    updatePlayButton();
    updatePageTitle();
});

/**
 * Setup control panel interactions
 */
function setupControls() {
    // Play/Pause button
    const playBtn = document.getElementById('playBtn');
    playBtn.addEventListener('click', () => {
        if (pianoRoll.isPlaying && !pianoRoll.isPaused) {
            pianoRoll.pause();
        } else {
            pianoRoll.play();
        }
        updatePlayButton();
    });
    
    // Stop button
    const stopBtn = document.getElementById('stopBtn');
    stopBtn.addEventListener('click', () => {
        pianoRoll.stop();
        updatePlayButton();
    });
    
    // Volume slider
    const volumeSlider = document.getElementById('volumeSlider');
    volumeSlider.value = DEFAULT_VOLUME;
    
    // Create a style for the volume slider fill
    const updateVolumeSliderFill = () => {
        const value = volumeSlider.value;
        const percentage = value;
        volumeSlider.style.background = `linear-gradient(to right, #ff8800 0%, #ff8800 ${percentage}%, #444 ${percentage}%, #444 100%)`;
    };
    
    // Initialize the fill
    updateVolumeSliderFill();
    
    volumeSlider.addEventListener('input', (e) => {
        pianoRoll.audioEngine.setMasterVolume(parseInt(e.target.value));
        updateVolumeSliderFill();
    });
    
    // Instrument selector
    const waveformSelect = document.getElementById('waveformSelect');
    waveformSelect.addEventListener('change', (e) => {
        pianoRoll.currentSample = e.target.value;
        pianoRoll.updateInstrumentColorIndicator();
    });
    
    // Loop button
    const loopBtn = document.getElementById('loopBtn');
    loopBtn.addEventListener('click', () => {
        pianoRoll.loopEnabled = !pianoRoll.loopEnabled;
        loopBtn.classList.toggle('active', pianoRoll.loopEnabled);
    });
    
    // Snap mode button
    const snapModeBtn = document.getElementById('snapModeBtn');
    snapModeBtn.addEventListener('click', () => {
        pianoRoll.toggleSnapMode();
        const isHighRes = pianoRoll.snapMode === 'high-res';
        snapModeBtn.classList.toggle('high-res', isHighRes);
        snapModeBtn.querySelector('span').textContent = isHighRes ? 'Snap: Fine' : 'Snap: Normal';
        modalManager.notify(`Snap mode: ${isHighRes ? 'Fine (64 divisions)' : 'Normal (16 divisions)'}`, 'info');
    });
    
    
    // Loop range inputs
    const loopStartInput = document.getElementById('loopStartInput');
    const loopEndInput = document.getElementById('loopEndInput');
    
    loopStartInput.addEventListener('change', (e) => {
        const value = parseInt(e.target.value) - 1;
        if (value >= 0 && value < pianoRoll.loopEnd) {
            pianoRoll.loopStart = value;
        } else {
            e.target.value = pianoRoll.loopStart + 1;
        }
    });
    
    loopEndInput.addEventListener('change', (e) => {
        const value = parseInt(e.target.value) - 1;
        if (value > pianoRoll.loopStart && value < pianoRoll.totalMeasures) {
            pianoRoll.loopEnd = value;
        } else {
            e.target.value = pianoRoll.loopEnd + 1;
        }
    });
}

/**
 * Update play button icon
 */
function updatePlayButton() {
    const playIcon = document.getElementById('playIcon');
    const pauseIcon = document.getElementById('pauseIcon');
    
    if (pianoRoll.isPlaying && !pianoRoll.isPaused) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    } else {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    }
}

/**
 * Setup modal systems
 */
function setupModals() {
    // Register modals
    modalManager.register('songModal');
    modalManager.register('infoModal', {
        onShow: (data) => {
            document.getElementById('infoModalTitle').textContent = data.title || 'Information';
            document.getElementById('infoModalContent').innerHTML = data.content || '';
        }
    });
    modalManager.register('confirmModal');
    modalManager.register('saveAsModal');
    modalManager.register('trackInfoModal');
    modalManager.register('tuningHelpModal');
    modalManager.register('midiImportModal');
}

/**
 * Setup menu system
 */
function setupMenus() {
    // Menu configuration
    const menuConfig = {
        file: [
            {
                id: 'menu-new',
                handler: () => handleNew()
            },
            {
                id: 'menu-open',
                handler: () => handleOpen(),
                shortcut: 'Ctrl+O'
            },
            {
                id: 'menu-save',
                handler: () => handleSave(),
                shortcut: 'Ctrl+S'
            },
            {
                id: 'menu-save-as',
                handler: () => handleSaveAs(),
                shortcut: 'Ctrl+Shift+S'
            },
            {
                id: 'menu-import-org',
                handler: () => handleImportOrg()
            },
            {
                id: 'menu-import-midi',
                handler: () => handleImportMidi()
            },
            {
                id: 'menu-clear-all',
                handler: () => handleClearAll()
            }
        ],
        edit: [
            {
                id: 'menu-cut',
                handler: () => handleCut(),
                shortcut: 'Ctrl+X'
            },
            {
                id: 'menu-copy',
                handler: () => handleCopy(),
                shortcut: 'Ctrl+C'
            },
            {
                id: 'menu-paste',
                handler: () => handlePaste(),
                shortcut: 'Ctrl+V'
            },
            {
                id: 'menu-delete',
                handler: () => handleDelete()
                // Remove shortcut to allow Delete key to work in input fields
            },
            {
                id: 'menu-change-voice',
                handler: () => handleChangeVoice(),
                shortcut: 'Ctrl+Shift+V'
            },
            {
                id: 'menu-select-all',
                handler: () => handleSelectAll(),
                shortcut: 'Ctrl+A'
            }
        ],
        view: [
            {
                id: 'menu-grid-snap',
                type: 'checkbox',
                checked: true,
                handler: (checked) => {
                    pianoRoll.gridSnap = checked;
                }
            },
            {
                id: 'menu-show-fps',
                type: 'checkbox',
                checked: true,
                handler: (checked) => {
                    pianoRoll.showFPS = checked;
                    pianoRoll.dirty = true;
                }
            },
            {
                id: 'menu-follow-mode',
                type: 'checkbox',
                checked: true,
                handler: (checked) => {
                    pianoRoll.followMode = checked;
                }
            },
            {
                id: 'menu-track-info',
                handler: () => {
                    const trackData = pianoRoll.buildTrackData();
                    pianoRoll.showTrackInfoModal(trackData);
                }
            }
        ],
        tools: [
            {
                id: 'menu-clear-all',
                handler: () => handleClearAll()
            }
        ],
        help: [
            {
                id: 'menu-shortcuts',
                handler: () => showShortcuts()
            },
            {
                id: 'menu-about',
                handler: () => showAbout()
            }
        ]
    };
    
    // Register menus
    menuManager.registerMenus(menuConfig);
    
    // Setup song menu items
    setupSongMenuItems();
}

/**
 * Setup sample song menu items
 */
function setupSongMenuItems() {
    // Direct ORG song links (exclude items with submenus)
    const orgLinks = document.querySelectorAll('[data-org]:not(.has-submenu)');
    orgLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.stopPropagation();
            const orgPath = e.target.getAttribute('data-org');
            
            // Check if it's a directory
            if (orgPath.endsWith('/')) {
                await showSongDirectory(orgPath, false);
            } else {
                await loadOrgFromPath(orgPath);
            }
            
            menuManager.closeAll();
        });
    });
    
    // Direct MIDI song links
    const midiLinks = document.querySelectorAll('[data-midi]');
    midiLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.stopPropagation();
            e.preventDefault();
            const midiPath = e.target.getAttribute('data-midi');
            if (midiPath) {
                await loadMidiFromPath(midiPath);
                menuManager.closeAll();
            }
        });
    });
    
    // Direct JSON song links (for tuned songs)
    const jsonLinks = document.querySelectorAll('[data-json]');
    jsonLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.stopPropagation();
            e.preventDefault();
            const jsonPath = e.target.getAttribute('data-json');
            if (jsonPath) {
                // Check if it's a directory
                if (jsonPath.endsWith('/')) {
                    await showSongDirectory(jsonPath, false, 'json');
                } else {
                    await loadJsonFromPath(jsonPath);
                }
                menuManager.closeAll();
            }
        });
    });
    
    // MIDI directory links
    const midiDirLinks = document.querySelectorAll('[data-midi-dir]');
    midiDirLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.stopPropagation();
            e.preventDefault();
            const midiDirPath = e.target.getAttribute('data-midi-dir');
            if (midiDirPath) {
                await showSongDirectory(midiDirPath, true);
                menuManager.closeAll();
            }
        });
    });
    
    // Tuning help link
    const tuningHelpLink = document.getElementById('menu-tuning-help');
    if (tuningHelpLink) {
        tuningHelpLink.addEventListener('click', (e) => {
            e.stopPropagation();
            menuManager.closeAll();
            modalManager.show('tuningHelpModal');
        });
    }
}

/**
 * Menu handlers
 */
async function handleNew() {
    const confirmed = await modalManager.confirm(
        'Are you sure you want to create a new project? All unsaved changes will be lost.'
    );
    
    if (confirmed) {
        pianoRoll.noteManager.clearAll();
        pianoRoll.stop();
        pianoRoll.dirty = true;
        pianoRoll.emit('notesChanged');
        currentFilename = null;
        updatePageTitle();
        modalManager.notify('New project created', 'info');
    }
}

async function handleImportOrg() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.org';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const buffer = await file.arrayBuffer();
                await pianoRoll.loadOrgFile(buffer);
                // Convert to .o46.json extension for saving
                currentFilename = file.name.replace(/\.org$/i, '.o46.json');
                updatePageTitle();
                modalManager.notify(`Loaded: ${file.name}`, 'info');
            } catch (error) {
                modalManager.notify(`Failed to load file: ${error.message}`, 'error');
            }
        }
    };
    
    input.click();
}

async function handleImportMidi() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.mid,.midi';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const buffer = await file.arrayBuffer();
                
                // Parse MIDI file to get track information
                const { MidiParser } = await import('./MidiParser.js');
                const midiData = MidiParser.parse(buffer);
                
                // Count notes per track
                const trackInfo = new Map();
                let trackCount = 0;
                
                // Analyze tracks to find which have notes
                midiData.tracks.forEach((track, trackIndex) => {
                    const noteEvents = track.events.filter(e => e.type === 'noteOn');
                    if (noteEvents.length > 0) {
                        trackInfo.set(trackIndex, {
                            noteCount: noteEvents.length,
                            channels: [...new Set(noteEvents.map(e => e.channel))]
                        });
                        trackCount++;
                    }
                });
                
                // Show options modal
                const modal = document.getElementById('midiImportModal');
                const confirmBtn = modal.querySelector('.midi-import-confirm');
                const cancelBtn = modal.querySelector('.midi-import-cancel');
                const closeBtn = modal.querySelector('.modal-close');
                const fineResCheckbox = document.getElementById('midiImportFineResolution');
                
                // Reset checkbox
                fineResCheckbox.checked = false;
                
                // Add track voice selection UI
                const modalBody = modal.querySelector('.modal-body');
                let trackSelectionDiv = modal.querySelector('.track-selection');
                if (!trackSelectionDiv) {
                    trackSelectionDiv = document.createElement('div');
                    trackSelectionDiv.className = 'track-selection';
                    trackSelectionDiv.style.cssText = 'margin-top: 20px; border-top: 1px solid #444; padding-top: 20px;';
                    modalBody.insertBefore(trackSelectionDiv, modalBody.lastElementChild);
                }
                
                // Build track selection UI
                if (trackCount > 0) {
                    trackSelectionDiv.innerHTML = '<h3 style="margin: 0 0 15px 0; font-size: 16px;">Track Voice Assignment</h3>';
                    const trackList = document.createElement('div');
                    trackList.style.cssText = 'display: flex; flex-direction: column; gap: 10px; max-height: 200px; overflow-y: auto;';
                    
                    const instrumentOptions = `
                        <option value="default">Auto-assign</option>
                        <optgroup label="Common Instruments">
                            <option value="ORG_M00">00 - Sine Wave / Ocarina</option>
                            <option value="ORG_M15">15 - Piano</option>
                            <option value="ORG_M49">49 - Finger Bass (Versatile)</option>
                            <option value="ORG_M29">29 - Nylon String Guitar</option>
                            <option value="ORG_M43">43 - Violin</option>
                            <option value="ORG_M42">42 - Viola</option>
                            <option value="ORG_M45">45 - Cello / String Ensemble</option>
                            <option value="ORG_M47">47 - Trumpet / Tuba</option>
                            <option value="ORG_M58">58 - Trumpet / French Horn</option>
                            <option value="ORG_M57">57 - Trombone / Brass Section</option>
                            <option value="ORG_M30">30 - Clarinet</option>
                            <option value="ORG_M86">86 - Saxophone</option>
                        </optgroup>
                        <optgroup label="Keyboards">
                            <option value="ORG_M08">08 - Electric Piano</option>
                            <option value="ORG_M09">09 - Electric Piano</option>
                            <option value="ORG_M28">28 - Electric Piano / Harpsichord</option>
                            <option value="ORG_M56">56 - Harpsichord</option>
                            <option value="ORG_M68">68 - Organ</option>
                            <option value="ORG_M04">04 - Honky-tonk</option>
                        </optgroup>
                        <optgroup label="Bass">
                            <option value="ORG_M06">06 - Acoustic Bass / Choir</option>
                            <option value="ORG_M07">07 - Fretless Bass</option>
                            <option value="ORG_M26">26 - Slap Bass</option>
                            <option value="ORG_M72">72 - Acoustic Bass</option>
                            <option value="ORG_M91">91 - Acoustic Bass</option>
                            <option value="ORG_M92">92 - Slap Bass</option>
                            <option value="ORG_M67">67 - Sawtooth Bass</option>
                        </optgroup>
                        <optgroup label="Waveforms">
                            <option value="ORG_M10">10 - Triangle Wave (NES-like)</option>
                            <option value="ORG_M20">20 - Square Wave (50% duty)</option>
                            <option value="ORG_M25">25 - Square Wave (25% duty)</option>
                            <option value="ORG_M26">26 - Square Wave (12.5% duty)</option>
                            <option value="ORG_M32">32 - Square Wave (50% duty)</option>
                            <option value="ORG_M66">66 - Sawtooth Wave</option>
                            <option value="ORG_M94">94 - Sawtooth</option>
                            <option value="ORG_M95">95 - Sawtooth</option>
                        </optgroup>
                        <optgroup label="Special">
                            <option value="ORG_M33">33 - Bell (Sharp)</option>
                            <option value="ORG_M60">60 - Bell</option>
                            <option value="ORG_M85">85 - Distortion Guitar</option>
                            <option value="ORG_M34">34 - Electric Jazz Guitar</option>
                            <option value="ORG_M50">50 - Versatile Lead</option>
                            <option value="ORG_M99">99 - NES Static Percussion</option>
                        </optgroup>
                    `;
                    
                    trackInfo.forEach((info, trackIndex) => {
                        const trackItem = document.createElement('div');
                        trackItem.style.cssText = 'display: flex; align-items: center; gap: 10px;';
                        trackItem.innerHTML = `
                            <label style="flex: 1; color: #ccc;">Track ${trackIndex + 1} (${info.noteCount} notes)</label>
                            <select class="track-voice-select" data-track="${trackIndex}" style="padding: 4px 8px; background: #2a2a2a; color: #ccc; border: 1px solid #444;">
                                ${instrumentOptions}
                            </select>
                        `;
                        trackList.appendChild(trackItem);
                    });
                    
                    trackSelectionDiv.appendChild(trackList);
                } else {
                    trackSelectionDiv.innerHTML = '';
                }
                
                const cleanup = () => {
                    confirmBtn.removeEventListener('click', handleConfirm);
                    cancelBtn.removeEventListener('click', handleCancel);
                    closeBtn.removeEventListener('click', handleCancel);
                };
                
                const handleConfirm = async () => {
                    const useFineResolution = fineResCheckbox.checked;
                    
                    // Collect track voice assignments
                    const trackVoices = new Map();
                    modal.querySelectorAll('.track-voice-select').forEach(select => {
                        const trackIndex = parseInt(select.dataset.track);
                        const voice = select.value;
                        if (voice !== 'default') {
                            trackVoices.set(trackIndex, voice);
                        }
                    });
                    
                    cleanup();
                    modalManager.close('midiImportModal');
                    
                    try {
                        await pianoRoll.loadMidiFile(buffer, useFineResolution, trackVoices);
                        // Convert to .o46.json extension for saving
                        currentFilename = file.name.replace(/\.(mid|midi)$/i, '.o46.json');
                        updatePageTitle();
                        modalManager.notify(`Loaded: ${file.name}${useFineResolution ? ' (Fine resolution)' : ''}`, 'info');
                    } catch (error) {
                        modalManager.notify(`Failed to load MIDI file: ${error.message}`, 'error');
                    }
                };
                
                const handleCancel = () => {
                    cleanup();
                    modalManager.close('midiImportModal');
                };
                
                confirmBtn.addEventListener('click', handleConfirm);
                cancelBtn.addEventListener('click', handleCancel);
                closeBtn.addEventListener('click', handleCancel);
                
                modalManager.show('midiImportModal');
            } catch (error) {
                modalManager.notify(`Failed to read MIDI file: ${error.message}`, 'error');
            }
        }
    };
    
    input.click();
}

async function handleClearAll() {
    const confirmed = await modalManager.confirm(
        'Are you sure you want to clear all notes? This cannot be undone.'
    );
    
    if (confirmed) {
        pianoRoll.noteManager.clearAll();
        pianoRoll.stop();
        
        // Reset loop settings
        pianoRoll.loopEnabled = false;
        pianoRoll.loopStart = 0;
        pianoRoll.loopEnd = 4;
        document.getElementById('loopBtn').classList.remove('active');
        document.getElementById('loopStartInput').value = 1;
        document.getElementById('loopEndInput').value = 5;
        
        // Reset tempo to default
        pianoRoll.setTempo(120);
        
        // Clear filename
        pianoRoll.currentFilename = null;
        updatePageTitle();
        pianoRoll.orgTrackInfo = null;
        
        pianoRoll.dirty = true;
        modalManager.notify('New project created', 'info');
    }
}

function handleCut() {
    pianoRoll.noteManager.cutSelectedNotes();
    pianoRoll.emit('notesChanged');
    pianoRoll.dirty = true;
}

function handleCopy() {
    pianoRoll.noteManager.copySelectedNotes();
    modalManager.notify('Notes copied to clipboard', 'info');
}

function handlePaste() {
    // Paste at current mouse position or playhead
    const pasteX = pianoRoll.inputHandler.mouseX || pianoRoll.playheadPos;
    const pasteY = pianoRoll.inputHandler.mouseY || 0;
    
    pianoRoll.noteManager.pasteNotes(pasteX, pasteY);
    pianoRoll.emit('notesChanged');
    pianoRoll.dirty = true;
}

function handleDelete() {
    pianoRoll.noteManager.deleteSelectedNotes();
    pianoRoll.emit('notesChanged');
    pianoRoll.dirty = true;
}

function handleChangeVoice() {
    const selectedNotes = Array.from(pianoRoll.noteManager.selectedNotes);
    if (selectedNotes.length === 0) {
        modalManager.notify('No notes selected. Select notes first to change their voice.', 'info');
        return;
    }
    
    // Get current instrument from the voice selector
    const currentInstrument = pianoRoll.currentSample;
    
    // Change instrument for all selected notes
    let count = 0;
    for (const note of selectedNotes) {
        if (note.instrument !== currentInstrument) {
            note.instrument = currentInstrument;
            count++;
        }
    }
    
    if (count > 0) {
        pianoRoll.emit('notesChanged');
        pianoRoll.dirty = true;
        modalManager.notify(`Changed voice to ${currentInstrument} for ${count} note${count > 1 ? 's' : ''}`, 'info');
    } else {
        modalManager.notify('Selected notes already have this voice', 'info');
    }
}

/**
 * Select all notes of the same pitch class
 */
function selectAllPitchClass(event) {
    // Get the first selected note to determine the pitch class
    const selectedNotes = Array.from(pianoRoll.noteManager.selectedNotes);
    if (selectedNotes.length === 0) {
        modalManager.notify('Select a note first to select all notes of that pitch class', 'info');
        return;
    }
    
    // Get the pitch class of the first selected note
    const firstNote = selectedNotes[0];
    const pitchClass = firstNote.key % NOTES_PER_OCTAVE;
    
    // Clear current selection if not holding shift
    if (!event.shiftKey) {
        pianoRoll.noteManager.selectedNotes.clear();
    }
    
    // Select all notes with the same pitch class
    let count = 0;
    for (const note of pianoRoll.noteManager.notes) {
        if (note.key % NOTES_PER_OCTAVE === pitchClass) {
            pianoRoll.noteManager.selectedNotes.add(note);
            count++;
        }
    }
    
    // Emit selection changed event to trigger proper updates
    pianoRoll.emit('selectionChanged');
    
    // Force immediate redraw
    pianoRoll.dirty = true;
    pianoRoll.renderer.needsRedraw = true;
    velocityBar.draw();
    panBar.draw();
    
    modalManager.notify(`Selected ${count} notes of the same pitch class`, 'info');
}

function handleSelectAll() {
    pianoRoll.noteManager.selectAll();
    pianoRoll.dirty = true;
}


/**
 * Show keyboard shortcuts
 */
function showShortcuts() {
    const shortcuts = `
<div class="shortcuts-container">
    <div class="shortcut-section">
        <h3>Playback</h3>
        <div class="shortcut-item">
            <span class="shortcut-key">Space</span>
            <span class="shortcut-desc">Play/Pause</span>
        </div>
        <div class="shortcut-item">
            <span class="shortcut-key">Shift+Space</span>
            <span class="shortcut-desc">Play from current position</span>
        </div>
        <div class="shortcut-item">
            <span class="shortcut-key">Enter</span>
            <span class="shortcut-desc">Stop and return to start</span>
        </div>
    </div>

    <div class="shortcut-section">
        <h3>File Operations</h3>
        <div class="shortcut-item">
            <span class="shortcut-key">Ctrl+S</span>
            <span class="shortcut-desc">Save project</span>
        </div>
        <div class="shortcut-item">
            <span class="shortcut-key">Ctrl+O</span>
            <span class="shortcut-desc">Open file</span>
        </div>
    </div>

    <div class="shortcut-section">
        <h3>Selection & Editing</h3>
        <div class="shortcut-item">
            <span class="shortcut-key">Ctrl+A</span>
            <span class="shortcut-desc">Select all notes</span>
        </div>
        <div class="shortcut-item">
            <span class="shortcut-key">Ctrl+C</span>
            <span class="shortcut-desc">Copy selected notes</span>
        </div>
        <div class="shortcut-item">
            <span class="shortcut-key">Ctrl+X</span>
            <span class="shortcut-desc">Cut selected notes</span>
        </div>
        <div class="shortcut-item">
            <span class="shortcut-key">Ctrl+V</span>
            <span class="shortcut-desc">Paste notes at cursor</span>
        </div>
        <div class="shortcut-item">
            <span class="shortcut-key">Delete</span>
            <span class="shortcut-desc">Delete selected notes</span>
        </div>
        <div class="shortcut-item">
            <span class="shortcut-key">Ctrl+Shift+V</span>
            <span class="shortcut-desc">Change voice of selected notes</span>
        </div>
        <div class="shortcut-item">
            <span class="shortcut-key">P</span>
            <span class="shortcut-desc">Select all notes of same pitch class</span>
        </div>
        <div class="shortcut-item">
            <span class="shortcut-key">Shift+P</span>
            <span class="shortcut-desc">Add pitch class to selection</span>
        </div>
    </div>

    <div class="shortcut-section">
        <h3>Mouse Controls</h3>
        <div class="shortcut-item">
            <span class="shortcut-key">Left Click</span>
            <span class="shortcut-desc">Create/select note</span>
        </div>
        <div class="shortcut-item">
            <span class="shortcut-key">Right Click</span>
            <span class="shortcut-desc">Delete note</span>
        </div>
        <div class="shortcut-item">
            <span class="shortcut-key">Ctrl+Click</span>
            <span class="shortcut-desc">Start box selection</span>
        </div>
        <div class="shortcut-item">
            <span class="shortcut-key">Shift+Click</span>
            <span class="shortcut-desc">Add to selection</span>
        </div>
    </div>

    <div class="shortcut-section">
        <h3>Navigation</h3>
        <div class="shortcut-item">
            <span class="shortcut-key">Mouse Wheel</span>
            <span class="shortcut-desc">Scroll vertically</span>
        </div>
        <div class="shortcut-item">
            <span class="shortcut-key">Shift+Wheel</span>
            <span class="shortcut-desc">Scroll horizontally</span>
        </div>
        <div class="shortcut-item">
            <span class="shortcut-key">Home</span>
            <span class="shortcut-desc">Go to beginning</span>
        </div>
        <div class="shortcut-item">
            <span class="shortcut-key">End</span>
            <span class="shortcut-desc">Go to end</span>
        </div>
    </div>

    <div class="shortcut-section">
        <h3>Touch Controls</h3>
        <div class="shortcut-item">
            <span class="shortcut-key">Single Tap</span>
            <span class="shortcut-desc">Create/select note</span>
        </div>
        <div class="shortcut-item">
            <span class="shortcut-key">Two Finger Drag</span>
            <span class="shortcut-desc">Scroll view</span>
        </div>
    </div>
</div>`;
    
    modalManager.show('infoModal', {
        title: 'Keyboard Shortcuts',
        content: shortcuts
    });
}

/**
 * Show about dialog
 */
function showAbout() {
    // Get the about content from the HTML (for SEO purposes)
    const aboutElement = document.getElementById('aboutContent');
    const about = aboutElement ? aboutElement.innerHTML : '<p>that46.org - 46-EDO Microtonal Sequencer</p>';
    
    modalManager.show('infoModal', {
        title: 'About',
        content: about
    });
}

/**
 * Save song as JSON file
 */
function handleSave() {
    if (currentFilename) {
        downloadSong(currentFilename);
    } else {
        handleSaveAs();
    }
}

/**
 * Save song with custom filename
 */
function handleSaveAs() {
    const input = document.getElementById('saveAsFilename');
    input.value = currentFilename || 'song.o46.json';
    
    // Set up event handlers
    const modal = document.getElementById('saveAsModal');
    const confirmBtn = modal.querySelector('.save-as-confirm');
    const cancelBtn = modal.querySelector('.save-as-cancel');
    const closeBtn = modal.querySelector('.modal-close');
    
    const cleanup = () => {
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        closeBtn.removeEventListener('click', handleCancel);
    };
    
    const handleConfirm = () => {
        let filename = input.value.trim();
        if (filename) {
            if (!filename.endsWith('.o46.json')) {
                filename += '.o46.json';
            }
            currentFilename = filename;
            updatePageTitle();
            downloadSong(filename);
            cleanup();
            modalManager.close('saveAsModal');
        }
    };
    
    const handleCancel = () => {
        cleanup();
        modalManager.close('saveAsModal');
    };
    
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    closeBtn.addEventListener('click', handleCancel);
    
    // Handle Enter key in input
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleConfirm();
        }
    });
    
    modalManager.show('saveAsModal');
    input.focus();
    input.select();
}

/**
 * Download song with given filename
 */
function downloadSong(filename) {
    const jsonData = pianoRoll.exportToJSON();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    modalManager.notify('Song saved', 'info');
}

/**
 * Open file dialog to load song
 */
function handleOpen() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.o46.json,.json';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            pianoRoll.importFromJSON(text);
            currentFilename = file.name;
            updatePageTitle();
            modalManager.notify('Song loaded successfully', 'info');
        } catch (error) {
            modalManager.notify('Failed to load song: ' + error.message, 'error');
        }
    };
    
    input.click();
}

/**
 * Load ORG file from path
 */
async function loadOrgFromPath(path) {
    try {
        // Ensure audio context is running (browser autoplay policy)
        await pianoRoll.audioEngine.ensureAudioContextRunning();
        
        // Add cache-busting query parameter
        const cacheBuster = `?t=${Date.now()}`;
        const response = await fetch(path + cacheBuster, {
            cache: 'no-cache'
        });
        if (!response.ok) throw new Error('File not found');
        
        const buffer = await response.arrayBuffer();
        await pianoRoll.loadOrgFile(buffer);
        
        const filename = path.split('/').pop();
        // Convert to .o46.json extension for saving
        currentFilename = filename.replace(/\.org$/i, '.o46.json');
        updatePageTitle();
        modalManager.notify(`Loaded: ${filename}`, 'info');
    } catch (error) {
        modalManager.notify(`Failed to load file: ${error.message}`, 'error');
    }
}

/**
 * Load MIDI file from path
 */
async function loadMidiFromPath(path) {
    try {
        // Ensure audio context is running (browser autoplay policy)
        await pianoRoll.audioEngine.ensureAudioContextRunning();
        
        // Add cache-busting query parameter
        const cacheBuster = `?t=${Date.now()}`;
        const response = await fetch(path + cacheBuster, {
            cache: 'no-cache'
        });
        if (!response.ok) throw new Error('File not found');
        
        const buffer = await response.arrayBuffer();
        await pianoRoll.loadMidiFile(buffer);
        
        const filename = path.split('/').pop();
        // Convert to .o46.json extension for saving
        currentFilename = filename.replace(/\.(mid|midi)$/i, '.o46.json');
        updatePageTitle();
        modalManager.notify(`Loaded: ${filename}`, 'info');
    } catch (error) {
        modalManager.notify(`Failed to load MIDI file: ${error.message}`, 'error');
    }
}

/**
 * Load JSON file from path
 */
async function loadJsonFromPath(path) {
    try {
        // Ensure audio context is running (browser autoplay policy)
        await pianoRoll.audioEngine.ensureAudioContextRunning();
        
        // Add cache-busting query parameter
        const cacheBuster = `?t=${Date.now()}`;
        const response = await fetch(path + cacheBuster, {
            cache: 'no-cache'
        });
        if (!response.ok) throw new Error('File not found');
        
        const text = await response.text();
        pianoRoll.importFromJSON(text);
        
        const filename = path.split('/').pop();
        currentFilename = filename;
        updatePageTitle();
        modalManager.notify(`Loaded: ${filename}`, 'info');
    } catch (error) {
        modalManager.notify(`Failed to load file: ${error.message}`, 'error');
    }
}

/**
 * Show song directory
 */
async function showSongDirectory(basePath, isMidi = false, fileType = 'org') {
    try {
        // Add cache-busting query parameter
        const cacheBuster = `?t=${Date.now()}`;
        const response = await fetch(basePath + 'index.json' + cacheBuster, {
            cache: 'no-cache'
        });
        const songs = await response.json();
        
        // Create song list
        const songList = document.getElementById('songList');
        songList.innerHTML = '';
        
        songs.forEach(song => {
            const li = document.createElement('li');
            li.className = 'song-item';
            
            // Format display name
            let displayName = song;
            if (isMidi) {
                // Format MIDI filenames for better display
                if (song === 'scarborough1.mid') {
                    displayName = 'Scarborough Fair';
                } else if (song === 'jesu-joy.mid') {
                    displayName = 'Jesu, Joy of Man\'s Desiring';
                } else {
                    displayName = song.replace('.mid', '')
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, l => l.toUpperCase());
                }
            } else if (fileType === 'json') {
                // Remove .o46.json extension
                displayName = song.replace('.o46.json', '');
            } else {
                displayName = song.replace('.org', '');
            }
            
            li.textContent = displayName;
            li.onclick = () => {
                if (isMidi) {
                    loadMidiFromPath(basePath + song);
                } else if (fileType === 'json') {
                    loadJsonFromPath(basePath + song);
                } else {
                    loadOrgFromPath(basePath + song);
                }
                modalManager.close('songModal');
            };
            songList.appendChild(li);
        });
        
        // Update modal title based on directory
        const modalTitle = document.querySelector('#songModal h2');
        if (modalTitle) {
                modalTitle.textContent = 'Songs';
        }
        
        // Show modal
        modalManager.show('songModal');
    } catch (error) {
        modalManager.notify('Failed to load song list', 'error');
    }
}

// Register keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Skip if typing in an input field or textarea
    if (e.target.matches('input, textarea')) {
        return;
    }
    
    // Skip if a modal is open
    if (modalManager.activeModal) {
        return;
    }
    
    // Playback shortcuts
    if (e.code === 'Space') {
        e.preventDefault();
        if (e.shiftKey) {
            // Shift+Space: Play from current position
            pianoRoll.playFromCurrentPosition();
        } else {
            // Space: Play/Pause
            if (pianoRoll.isPlaying && !pianoRoll.isPaused) {
                pianoRoll.pause();
            } else {
                pianoRoll.play();
            }
        }
        updatePlayButton();
    }
    
    if (e.code === 'Enter') {
        e.preventDefault();
        pianoRoll.stop();
        updatePlayButton();
    }
    
    // Edit shortcuts are handled by MenuManager's registerShortcut
    // Only handle Space, Enter, and Delete here since Delete needs special handling
    if (e.key === 'Delete') {
        e.preventDefault();
        handleDelete();
    }
    
    // Select all notes of the same pitch class
    if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        selectAllPitchClass(e);
    }
});

