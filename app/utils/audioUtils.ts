import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export interface AudioRecording {
    recording: Audio.Recording | null;
    duration: number;
    uri?: string;
}

export interface RecordingState {
    isRecording: boolean;
    isProcessing: boolean;
    duration: number;
    permissionGranted: boolean;
}

// Configure audio recording settings
const RECORDING_OPTIONS_PRESET_HIGH_QUALITY: Audio.RecordingOptions = {
    android: {
        extension: '.wav',
        outputFormat: Audio.AndroidOutputFormat.DEFAULT,
        audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 128000,
    },
    ios: {
        extension: '.wav',
        audioQuality: Audio.IOSAudioQuality.HIGH,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
    },
    web: {
        mimeType: 'audio/wav',
        bitsPerSecond: 128000,
    },
};

/**
 * Initialize audio permissions and settings
 */
export async function initializeAudio(): Promise<boolean> {
    try {
        // Request permissions
        const { granted } = await Audio.requestPermissionsAsync();
        
        if (!granted) {
            return false;
        }

        // Set audio mode for recording
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
        });

        return true;
    } catch (error) {
        console.error('Error initializing audio:', error);
        return false;
    }
}

/**
 * Start audio recording
 */
export async function startRecording(): Promise<Audio.Recording | null> {
    try {
        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync(RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
        await recording.startAsync();
        return recording;
    } catch (error) {
        console.error('Error starting recording:', error);
        return null;
    }
}

/**
 * Stop audio recording and return the URI
 */
export async function stopRecording(recording: Audio.Recording): Promise<string | null> {
    try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        return uri;
    } catch (error) {
        console.error('Error stopping recording:', error);
        return null;
    }
}

/**
 * Get recording duration
 */
export async function getRecordingDuration(recording: Audio.Recording): Promise<number> {
    try {
        const status = await recording.getStatusAsync();
        if (status.canRecord || status.isDoneRecording) {
            return status.durationMillis || 0;
        }
        return 0;
    } catch (error) {
        console.error('Error getting recording duration:', error);
        return 0;
    }
}

/**
 * Clean up recording resources
 */
export async function cleanupRecording(recording: Audio.Recording): Promise<void> {
    try {
        const status = await recording.getStatusAsync();
        if (status.canRecord || status.isDoneRecording) {
            // Recording will be automatically cleaned up when the object is disposed
            // No explicit cleanup needed for expo-av recordings
        }
    } catch (error) {
        console.error('Error cleaning up recording:', error);
    }
}

/**
 * Delete audio file from device
 */
export async function deleteAudioFile(uri: string): Promise<void> {
    try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (fileInfo.exists) {
            await FileSystem.deleteAsync(uri);
        }
    } catch (error) {
        console.error('Error deleting audio file:', error);
    }
}