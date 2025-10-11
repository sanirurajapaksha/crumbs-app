import { Audio } from 'expo-av';
import { checkForWakeWordInTranscript, extractCommandFromTranscript } from './wakeWordDetection';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

// Global recording instance to prevent multiple recordings
let globalRecording: Audio.Recording | null = null;
let isRecording = false; // Lock to prevent concurrent recordings

export interface VoiceCommandResult {
    command: 'next' | 'previous' | 'repeat' | 'unknown';
    transcript: string;
    hasWakeWord?: boolean;
}

/**
 * Cleanup any existing recording
 */
async function cleanupGlobalRecording(): Promise<void> {
    if (globalRecording) {
        try {
            const status = await globalRecording.getStatusAsync();
            if (status.isDoneRecording === false) {
                await globalRecording.stopAndUnloadAsync();
            }
            globalRecording = null;
            isRecording = false;
            console.log('🧹 Cleaned up previous recording');
        } catch (e: any) {
            console.log('⚠️ Cleanup warning:', e?.message || 'unknown');
            globalRecording = null;
            isRecording = false;
        }
    }
}

/**
 * Records audio from the microphone and transcribes it using Groq Whisper API
 */
export async function recordAndTranscribeVoiceCommand(): Promise<VoiceCommandResult> {
    // Check if already recording
    if (isRecording) {
        console.log('⚠️ Recording already in progress, ignoring request');
        throw new Error('Recording already in progress');
    }

    // Set lock
    isRecording = true;

    // Clean up any existing recording first
    await cleanupGlobalRecording();
    
    // Set lock again after cleanup
    isRecording = true;

    try {
        console.log('🎤 Requesting microphone permissions...');
        
        // Request permissions
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
            throw new Error('Microphone permission not granted');
        }

        // Configure audio mode - IMPORTANT: must be before creating recording
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
        });

        console.log('🎤 Creating new recording...');
        
        // Create recording using global instance
        globalRecording = new Audio.Recording();
        await globalRecording.prepareToRecordAsync({
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
                linearPCMBitDepth: 16,
                linearPCMIsBigEndian: false,
                linearPCMIsFloat: false,
            },
            web: {
                mimeType: 'audio/webm',
                bitsPerSecond: 128000,
            },
        });

        console.log('🎤 Starting recording...');
        await globalRecording.startAsync();

        // Record for 3 seconds
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('🎤 Stopping recording...');
        await globalRecording.stopAndUnloadAsync();
        
        const uri = globalRecording.getURI();
        if (!uri) {
            throw new Error('Failed to get recording URI');
        }

        console.log('🎤 Recording saved:', uri);

        // Transcribe using Groq Whisper
        const transcript = await transcribeAudioWithGroq(uri);
        console.log('📝 Transcript:', transcript);

        // Parse command from transcript
        const command = parseVoiceCommand(transcript);
        console.log('✅ Command:', command);

        // Cleanup and release lock
        globalRecording = null;
        isRecording = false;

        return { command, transcript };

    } catch (error) {
        console.error('❌ Voice recording error:', error);
        
        // Cleanup on error and release lock
        await cleanupGlobalRecording();
        
        throw error;
    } finally {
        // Always release lock
        isRecording = false;
    }
}

/**
 * Transcribes audio file using Groq Whisper API
 */
async function transcribeAudioWithGroq(audioUri: string): Promise<string> {
    try {
        console.log('🔄 Transcribing audio with Groq Whisper...');
        console.log('Audio URI:', audioUri);

        // Create FormData for React Native
        const formData = new FormData();
        
        // For React Native, we need to structure the file object properly
        const audioFile = {
            uri: audioUri,
            type: 'audio/m4a',
            name: 'audio.m4a',
        };

        formData.append('file', audioFile as any);
        formData.append('model', 'whisper-large-v3');
        formData.append('language', 'en');
        formData.append('response_format', 'json');

        console.log('📤 Sending request to Groq API...');

        // Call Groq API
        const groqResponse = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Accept': 'application/json',
            },
            body: formData,
        });

        console.log('📥 Response status:', groqResponse.status);

        if (!groqResponse.ok) {
            const errorText = await groqResponse.text();
            console.error('Groq API error response:', errorText);
            throw new Error(`Groq API error: ${groqResponse.status} - ${errorText}`);
        }

        const data = await groqResponse.json();
        console.log('✅ Transcription result:', data);
        
        return data.text || '';

    } catch (error) {
        console.error('❌ Transcription error:', error);
        throw error;
    }
}

/**
 * Parses the transcript to detect voice commands
 */
function parseVoiceCommand(transcript: string): 'next' | 'previous' | 'repeat' | 'unknown' {
    const text = transcript.toLowerCase().trim();

    // Check for "next" command
    if (text.includes('next') || text.includes('continue') || text.includes('forward')) {
        return 'next';
    }

    // Check for "previous" command
    if (text.includes('previous') || text.includes('back') || text.includes('last')) {
        return 'previous';
    }

    // Check for "repeat" command
    if (text.includes('repeat') || text.includes('again') || text.includes('replay')) {
        return 'repeat';
    }

    return 'unknown';
}

/**
 * Records audio with wake word detection, then transcribes with Groq
 * This is more cost-effective as it only calls the API when wake word is detected
 */
export async function recordWithWakeWordAndTranscribe(
    recordingDuration: number = 5000,
    onProgress?: (secondsRemaining: number) => void
): Promise<VoiceCommandResult> {
    // Check if already recording
    if (isRecording) {
        console.log('⚠️ Recording already in progress, ignoring request');
        throw new Error('Recording already in progress');
    }

    // Set lock
    isRecording = true;

    // Clean up any existing recording first
    await cleanupGlobalRecording();
    
    // Set lock again after cleanup
    isRecording = true;

    try {
        console.log('🎤 Requesting microphone permissions...');
        
        // Request permissions
        const permission = await Audio.requestPermissionsAsync();
        if (!permission.granted) {
            throw new Error('Microphone permission is required');
        }

        // Set audio mode - IMPORTANT: must be set before creating recording
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
        });

        console.log('🎤 Creating new recording...');
        
        // Create recording with high quality settings
        const recordingOptions = {
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

        const { recording: rec } = await Audio.Recording.createAsync(recordingOptions);
        globalRecording = rec;

        console.log('🎤 Starting recording...');
        await globalRecording.startAsync();

        // Progress updates
        const startTime = Date.now();
        const progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.ceil((recordingDuration - elapsed) / 1000);
            if (onProgress && remaining > 0) {
                onProgress(remaining);
            }
        }, 1000);

        // Record for specified duration
        await new Promise(resolve => setTimeout(resolve, recordingDuration));

        // Stop recording
        clearInterval(progressInterval);
        console.log('🎤 Stopping recording...');
        await globalRecording.stopAndUnloadAsync();
        
        const uri = globalRecording.getURI();
        if (!uri) {
            throw new Error('Failed to get recording URI');
        }

        console.log('🎤 Recording saved:', uri);

        // Transcribe using Groq Whisper
        const transcript = await transcribeAudioWithGroq(uri);
        console.log('📝 Full transcript:', transcript);

        // Check for wake word
        const hasWakeWord = await checkForWakeWordInTranscript(transcript);
        
        if (!hasWakeWord) {
            console.log('⚠️ No wake word detected. Ignoring command.');
            
            // Cleanup and release lock
            globalRecording = null;
            isRecording = false;
            
            return { 
                command: 'unknown', 
                transcript,
                hasWakeWord: false
            };
        }

        // Extract command after wake word
        const commandText = extractCommandFromTranscript(transcript);
        console.log('📝 Command text:', commandText);

        // Parse command
        const command = parseVoiceCommand(commandText);
        console.log('✅ Command:', command);

        // Cleanup and release lock
        globalRecording = null;
        isRecording = false;

        return { command, transcript, hasWakeWord: true };

    } catch (error) {
        console.error('❌ Voice recording error:', error);
        
        // Cleanup on error and release lock
        await cleanupGlobalRecording();
        
        throw error;
    } finally {
        // Always release lock
        isRecording = false;
    }
}

