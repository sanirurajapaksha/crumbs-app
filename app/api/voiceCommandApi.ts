import { Audio } from 'expo-av';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

export interface VoiceCommandResult {
    command: 'next' | 'previous' | 'repeat' | 'unknown';
    transcript: string;
}

/**
 * Records audio from the microphone and transcribes it using Groq Whisper API
 */
export async function recordAndTranscribeVoiceCommand(): Promise<VoiceCommandResult> {
    let recording: Audio.Recording | null = null;

    try {
        console.log('🎤 Requesting microphone permissions...');
        
        // Request permissions
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
            throw new Error('Microphone permission not granted');
        }

        // Configure audio mode
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
        });

        console.log('🎤 Starting recording...');
        
        // Create and start recording
        recording = new Audio.Recording();
        await recording.prepareToRecordAsync({
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

        await recording.startAsync();

        // Record for 3 seconds
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('🎤 Stopping recording...');
        await recording.stopAndUnloadAsync();
        
        const uri = recording.getURI();
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

        return { command, transcript };

    } catch (error) {
        console.error('❌ Voice recording error:', error);
        throw error;
    } finally {
        // Cleanup - only if recording exists and is still loaded
        if (recording) {
            try {
                const status = await recording.getStatusAsync();
                if (status.canRecord || status.isRecording) {
                    await recording.stopAndUnloadAsync();
                }
            } catch (e) {
                // Already unloaded, ignore
                console.log('Recording already cleaned up');
            }
        }
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
