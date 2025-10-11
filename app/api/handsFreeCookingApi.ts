import { Audio } from 'expo-av';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

// Global recording instance to prevent multiple recordings
let globalRecording: Audio.Recording | null = null;
let isRecording = false; // Lock to prevent concurrent recordings

export interface VoiceCommandResult {
    command: 'next' | 'previous' | 'repeat' | 'unknown';
    transcript: string;
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
 * Transcribes audio with Groq Whisper API
 */
async function transcribeAudioWithGroq(audioUri: string): Promise<string> {
    try {
        console.log('📤 Sending request to Groq API...');

        const formData = new FormData();
        
        // For React Native, we need to structure the file object differently
        const audioFile = {
            uri: audioUri,
            type: 'audio/m4a',
            name: 'audio.m4a'
        };
        
        formData.append('file', audioFile as any);
        formData.append('model', 'whisper-large-v3');
        formData.append('temperature', '0');
        formData.append('response_format', 'json');
        formData.append('language', 'en');

        const groqResponse = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
            },
            body: formData,
        });

        if (!groqResponse.ok) {
            const errorText = await groqResponse.text();
            console.error('❌ Groq API error:', groqResponse.status, errorText);
            throw new Error(`Groq API error: ${groqResponse.status}`);
        }

        console.log('📥 Response status:', groqResponse.status);

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
    if (text.includes('previous') || text.includes('back') || text.includes('last') || text.includes('before')) {
        return 'previous';
    }

    // Check for "repeat" command
    if (text.includes('repeat') || text.includes('again') || text.includes('replay')) {
        return 'repeat';
    }

    return 'unknown';
}

/**
 * Records audio continuously and transcribes with Groq - FOR HANDS-FREE MODE
 */
export async function recordAndTranscribeVoiceCommand(
    recordingDuration: number = 3000
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
        const { granted } = await Audio.requestPermissionsAsync();
        if (!granted) {
            throw new Error('Microphone permission not granted');
        }

        // Configure audio mode for recording
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
        });

        console.log('🎤 Creating new recording...');

        // Create a new recording
        globalRecording = new Audio.Recording();
        await globalRecording.prepareToRecordAsync({
            ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
            android: {
                extension: '.m4a',
                outputFormat: 2, // MPEG_4
                audioEncoder: 3, // AAC
                sampleRate: 16000,
                numberOfChannels: 1,
                bitRate: 128000,
            },
            ios: {
                extension: '.m4a',
                outputFormat: 'mpeg4aac',
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

        // Record for specified duration
        await new Promise(resolve => setTimeout(resolve, recordingDuration));

        console.log('🎤 Stopping recording...');
        await globalRecording.stopAndUnloadAsync();
        
        const uri = globalRecording.getURI();
        console.log('🎤 Recording saved:', uri);

        if (!uri) {
            throw new Error('No recording URI');
        }

        // Transcribe the audio with Groq
        const transcript = await transcribeAudioWithGroq(uri);
        console.log('📝 Transcript:', transcript);

        // Parse the command
        const command = parseVoiceCommand(transcript);
        console.log('✅ Command:', command);

        // Clean up and release lock
        globalRecording = null;
        isRecording = false;

        return {
            command,
            transcript,
        };

    } catch (error: any) {
        console.error('❌ Voice recording error:', error);
        await cleanupGlobalRecording();
        throw error;
    } finally {
        isRecording = false;
    }
}

/**
 * Start continuous voice listening for hands-free mode
 * This will continuously listen and process commands
 */
export async function startContinuousListening(
    onCommand: (result: VoiceCommandResult) => void,
    onError: (error: Error) => void
): Promise<() => void> {
    let shouldContinue = true;

    const listen = async () => {
        while (shouldContinue) {
            try {
                // Wait a bit before next recording to avoid overlap
                await new Promise(resolve => setTimeout(resolve, 500));
                
                if (!shouldContinue) break;

                const result = await recordAndTranscribeVoiceCommand(3000);
                
                // Only process if a valid command was detected
                if (result.command !== 'unknown') {
                    onCommand(result);
                }
            } catch (error: any) {
                if (shouldContinue) {
                    onError(error);
                }
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    };

    // Start listening loop
    listen();

    // Return stop function
    return () => {
        shouldContinue = false;
        cleanupGlobalRecording();
    };
}
