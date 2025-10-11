/**
 * Wake Word Detection System for Voice Commands
 * 
 * Two-stage approach:
 * 1. Continuous local audio monitoring (FREE) - detects "Hey Crumbs" or similar wake words
 * 2. Groq API transcription (PAID) - only activates after wake word detected
 * 
 * This minimizes API costs while providing always-on listening capability
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

// Wake words that trigger API transcription (lowercase for comparison)
const WAKE_WORDS = [
    'hey crumbs',
    'hey crumb',
    'ok crumbs',
    'okay crumbs',
    'crumbs',
    'hey app',
    'okay app',
];

// Audio configuration for wake word detection
const WAKE_WORD_RECORDING_OPTIONS = {
    android: {
        extension: '.m4a',
        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 64000, // Lower bitrate for wake word detection
    },
    ios: {
        extension: '.m4a',
        outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
        audioQuality: Audio.IOSAudioQuality.LOW, // Lower quality for wake word
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 64000,
    },
    web: {
        mimeType: 'audio/webm',
        bitsPerSecond: 64000,
    },
};

// Audio configuration for command recognition (higher quality)
const COMMAND_RECORDING_OPTIONS = {
    android: {
        extension: '.m4a',
        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 128000,
    },
    ios: {
        extension: '.m4a',
        outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
        audioQuality: Audio.IOSAudioQuality.HIGH,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 128000,
    },
    web: {
        mimeType: 'audio/webm',
        bitsPerSecond: 128000,
    },
};

export type WakeWordCallback = (audioUri: string) => Promise<void>;

/**
 * Continuous wake word listener
 * Monitors audio in short intervals and uses local processing to detect wake words
 */
export class WakeWordDetector {
    private recording: Audio.Recording | null = null;
    private isActive = false;
    private checkInterval: NodeJS.Timeout | null = null;
    private onWakeWordCallback: WakeWordCallback | null = null;
    private lastProcessTime = 0;
    private readonly PROCESS_INTERVAL = 2000; // Check every 2 seconds
    private readonly RECORDING_DURATION = 2000; // Record 2 second chunks

    constructor(onWakeWord: WakeWordCallback) {
        this.onWakeWordCallback = onWakeWord;
    }

    /**
     * Start continuous listening for wake word
     */
    async start(): Promise<void> {
        if (this.isActive) {
            console.log('⚠️ Wake word detector already active');
            return;
        }

        console.log('👂 Starting wake word detection...');
        
        // Request microphone permissions
        const permission = await Audio.requestPermissionsAsync();
        if (!permission.granted) {
            throw new Error('Microphone permission denied');
        }

        // Configure audio mode for recording
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
        });

        this.isActive = true;
        this.startListeningCycle();
    }

    /**
     * Stop listening for wake word
     */
    async stop(): Promise<void> {
        console.log('🛑 Stopping wake word detection...');
        this.isActive = false;

        if (this.checkInterval) {
            clearTimeout(this.checkInterval);
            this.checkInterval = null;
        }

        if (this.recording) {
            try {
                const status = await this.recording.getStatusAsync();
                if (status.canRecord || status.isRecording) {
                    await this.recording.stopAndUnloadAsync();
                }
            } catch (e) {
                console.log('Recording cleanup:', e);
            }
            this.recording = null;
        }
    }

    /**
     * Continuous listening cycle
     */
    private async startListeningCycle(): Promise<void> {
        while (this.isActive) {
            try {
                await this.recordAndCheckForWakeWord();
                
                // Wait before next check
                await new Promise(resolve => setTimeout(resolve, this.PROCESS_INTERVAL));
            } catch (error) {
                console.error('❌ Wake word detection error:', error);
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
    }

    /**
     * Record a short audio chunk and check for wake word
     */
    private async recordAndCheckForWakeWord(): Promise<void> {
        if (!this.isActive) return;

        try {
            // Create new recording
            const { recording } = await Audio.Recording.createAsync(
                WAKE_WORD_RECORDING_OPTIONS
            );
            this.recording = recording;

            // Record for short duration
            await new Promise(resolve => setTimeout(resolve, this.RECORDING_DURATION));

            // Stop recording
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();

            if (!uri) {
                console.log('⚠️ No recording URI');
                return;
            }

            // Simple wake word detection using audio file size and basic heuristics
            // In a production app, you'd use a proper wake word detection library
            const detected = await this.simpleWakeWordCheck(uri);

            if (detected && this.onWakeWordCallback) {
                console.log('🎤 Wake word detected! Activating command recognition...');
                await this.onWakeWordCallback(uri);
            }

            // Cleanup recording file
            await FileSystem.deleteAsync(uri, { idempotent: true });

        } catch (error) {
            console.error('Recording error:', error);
        } finally {
            this.recording = null;
        }
    }

    /**
     * Simple wake word detection
     * This is a placeholder - in production, use a proper wake word detection library
     * like Porcupine, Snowboy, or similar
     */
    private async simpleWakeWordCheck(audioUri: string): Promise<boolean> {
        try {
            // Get file info to check if there's audio data
            const fileInfo = await FileSystem.getInfoAsync(audioUri);
            
            if (!fileInfo.exists || fileInfo.size < 1000) {
                return false; // Too small, likely silence
            }

            // For now, return false - this prevents accidental triggers
            // In production, implement proper wake word detection here
            // Options:
            // 1. Use @react-native-voice/voice with offline recognition
            // 2. Use TensorFlow Lite with wake word model
            // 3. Use Porcupine Wake Word engine (picovoice.ai)
            return false;

        } catch (error) {
            console.error('Wake word check error:', error);
            return false;
        }
    }

    /**
     * Check if detector is currently active
     */
    isListening(): boolean {
        return this.isActive;
    }
}

/**
 * Simplified button-activated wake word system
 * User taps button, then has time to say wake word + command
 */
export async function recordWithWakeWord(
    duration: number = 5000,
    onProgress?: (secondsRemaining: number) => void
): Promise<string> {
    console.log('🎤 Starting wake word recording...');

    // Request permissions
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
        throw new Error('Microphone permission denied');
    }

    // Configure audio mode
    await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
    });

    // Create recording with high quality for command recognition
    const { recording } = await Audio.Recording.createAsync(
        COMMAND_RECORDING_OPTIONS
    );

    // Start recording
    await recording.startAsync();

    // Progress updates
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.ceil((duration - elapsed) / 1000);
        if (onProgress && remaining > 0) {
            onProgress(remaining);
        }
    }, 1000);

    // Record for specified duration
    await new Promise(resolve => setTimeout(resolve, duration));

    // Stop recording
    clearInterval(progressInterval);
    await recording.stopAndUnloadAsync();
    
    const uri = recording.getURI();
    if (!uri) {
        throw new Error('Failed to get recording URI');
    }

    console.log('✅ Recording complete:', uri);
    return uri;
}

/**
 * Check if audio contains wake word using Groq API
 * Only call this after button press or when wake word is locally detected
 */
export async function checkForWakeWordInTranscript(transcript: string): Promise<boolean> {
    const lowerTranscript = transcript.toLowerCase().trim();
    
    // Check if any wake word is present
    for (const wakeWord of WAKE_WORDS) {
        if (lowerTranscript.includes(wakeWord)) {
            console.log(`✅ Wake word detected: "${wakeWord}"`);
            return true;
        }
    }

    console.log('❌ No wake word detected in:', transcript);
    return false;
}

/**
 * Extract command after wake word
 * Example: "Hey Crumbs next step" -> "next step"
 */
export function extractCommandFromTranscript(transcript: string): string {
    const lowerTranscript = transcript.toLowerCase().trim();
    
    // Find wake word position
    for (const wakeWord of WAKE_WORDS) {
        const index = lowerTranscript.indexOf(wakeWord);
        if (index !== -1) {
            // Extract text after wake word
            const afterWakeWord = transcript.slice(index + wakeWord.length).trim();
            console.log(`📝 Command extracted: "${afterWakeWord}"`);
            return afterWakeWord;
        }
    }

    // No wake word found, return full transcript
    return transcript;
}
