import { Audio } from "expo-av";

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

// Global recording instance to prevent multiple recordings
let globalRecording: Audio.Recording | null = null;
let isRecording = false; // Lock to prevent concurrent recordings

export interface VoiceCommandResult {
    command: "next" | "previous" | "repeat" | "unknown";
    transcript: string;
}

/**
 * Cleanup any existing recording
 */
async function cleanupGlobalRecording(): Promise<void> {
    if (globalRecording) {
        try {
            const status = await globalRecording.getStatusAsync();

            // Check if recording is in progress
            if (status.isRecording) {
                console.log("🛑 Stopping active recording...");
                await globalRecording.stopAndUnloadAsync();
            }
            // Check if recording is prepared but not done
            else if (status.canRecord && !status.isDoneRecording) {
                console.log("🛑 Unloading prepared recording...");
                await globalRecording.stopAndUnloadAsync();
            }
            // If it's done recording, just unload
            else if (status.isDoneRecording) {
                console.log("🛑 Unloading completed recording...");
                await globalRecording.getURI(); // Get URI before unloading
                globalRecording = null;
            }
            // For any other state, try to reset
            else {
                console.log("🛑 Resetting recording state...");
                globalRecording = null;
            }

            isRecording = false;
            console.log("🧹 Cleaned up previous recording");
        } catch (e: any) {
            console.log("⚠️ Cleanup warning:", e?.message || "unknown");
            // Force cleanup regardless of error
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
        console.log("📤 Sending request to Groq API...");
        console.log("📁 Audio file URI:", audioUri);

        const formData = new FormData();

        // Determine file extension and MIME type from URI
        const fileExtension = audioUri.toLowerCase().includes(".wav") ? ".wav" : ".m4a";
        const mimeType = fileExtension === ".wav" ? "audio/wav" : "audio/m4a";

        console.log("📄 File type:", mimeType);

        // For React Native, we need to structure the file object correctly
        const audioFile = {
            uri: audioUri,
            type: mimeType,
            name: `audio${fileExtension}`,
        };

        formData.append("file", audioFile as any);
        formData.append("model", "whisper-large-v3");
        formData.append("temperature", "0");
        formData.append("response_format", "json");
        formData.append("language", "en");

        console.log("🚀 Sending formData to Groq...");

        const groqResponse = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${GROQ_API_KEY}`,
                // Don't set Content-Type header - let FormData set it automatically
            },
            body: formData,
        });

        console.log("📥 Response status:", groqResponse.status);

        if (!groqResponse.ok) {
            const errorText = await groqResponse.text();
            console.error("❌ Groq API error:", groqResponse.status, errorText);

            // Log more details for debugging
            console.error("📄 Request details:", {
                uri: audioUri,
                fileType: mimeType,
                fileName: `audio${fileExtension}`,
            });

            throw new Error(`Groq API error: ${groqResponse.status} - ${errorText}`);
        }

        const data = await groqResponse.json();
        console.log("✅ Transcription result:", data);

        return data.text || "";
    } catch (error) {
        console.error("❌ Transcription error:", error);
        throw error;
    }
}

/**
 * Parses the transcript to detect voice commands
 */
function parseVoiceCommand(transcript: string): "next" | "previous" | "repeat" | "unknown" {
    const text = transcript.toLowerCase().trim();

    // Check for "next" command
    if (text.includes("next") || text.includes("continue") || text.includes("forward")) {
        return "next";
    }

    // Check for "previous" command
    if (text.includes("previous") || text.includes("back") || text.includes("last") || text.includes("before")) {
        return "previous";
    }

    // Check for "repeat" command
    if (text.includes("repeat") || text.includes("again") || text.includes("replay")) {
        return "repeat";
    }

    return "unknown";
}

/**
 * Records audio continuously and transcribes with Groq - FOR HANDS-FREE MODE
 */
export async function recordAndTranscribeVoiceCommand(recordingDuration: number = 3000): Promise<VoiceCommandResult> {
    // Check if already recording
    if (isRecording) {
        console.log("⚠️ Recording already in progress, ignoring request");
        throw new Error("Recording already in progress");
    }

    // Set lock
    isRecording = true;

    // Clean up any existing recording first
    await cleanupGlobalRecording();

    // Set lock again after cleanup
    isRecording = true;

    try {
        console.log("🎤 Requesting microphone permissions...");

        // Request permissions
        const { granted } = await Audio.requestPermissionsAsync();
        if (!granted) {
            throw new Error("Microphone permission not granted");
        }

        console.log("✅ Microphone permissions granted");

        // Configure audio mode for recording with delay to ensure it's applied
        console.log("🔧 Setting audio mode...");
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
        });

        // Add a small delay to ensure audio mode is set
        await new Promise((resolve) => setTimeout(resolve, 100));
        console.log("✅ Audio mode configured");

        console.log("🎤 Creating new recording...");

        // Create a new recording with simplified options
        globalRecording = new Audio.Recording();

        // Use recording options optimized for Groq Whisper API
        const recordingOptions = {
            android: {
                extension: ".wav",
                outputFormat: Audio.AndroidOutputFormat.DEFAULT,
                audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
                sampleRate: 16000,
                numberOfChannels: 1,
                bitRate: 128000,
            },
            ios: {
                extension: ".wav",
                audioQuality: Audio.IOSAudioQuality.MEDIUM,
                sampleRate: 16000,
                numberOfChannels: 1,
                bitRate: 128000,
                linearPCMBitDepth: 16,
                linearPCMIsBigEndian: false,
                linearPCMIsFloat: false,
            },
            web: {
                mimeType: "audio/wav",
                bitsPerSecond: 128000,
            },
        };

        console.log("🎤 Preparing recording...");

        // Try to prepare recording with retry logic
        let prepareAttempts = 0;
        const maxPrepareAttempts = 3;

        while (prepareAttempts < maxPrepareAttempts) {
            try {
                await globalRecording.prepareToRecordAsync(recordingOptions);
                console.log("✅ Recording prepared successfully");
                break;
            } catch (prepareError: any) {
                prepareAttempts++;
                console.log(`❌ Prepare attempt ${prepareAttempts} failed:`, prepareError?.message || "unknown");

                if (prepareAttempts >= maxPrepareAttempts) {
                    throw new Error(`Failed to prepare recording after ${maxPrepareAttempts} attempts: ${prepareError?.message || "unknown"}`);
                }

                // Wait before retrying and cleanup
                await new Promise((resolve) => setTimeout(resolve, 500));

                // Try to cleanup and recreate recording object
                globalRecording = null;
                globalRecording = new Audio.Recording();
            }
        }

        console.log("🎤 Starting recording...");
        await globalRecording.startAsync();

        // Record for specified duration
        await new Promise((resolve) => setTimeout(resolve, recordingDuration));

        console.log("🎤 Stopping recording...");
        await globalRecording.stopAndUnloadAsync();

        const uri = globalRecording.getURI();
        console.log("🎤 Recording saved:", uri);

        if (!uri) {
            throw new Error("No recording URI");
        }

        console.log("📁 Recording file details:");
        console.log("  - URI:", uri);
        console.log("  - Extension:", uri.split(".").pop());

        // Transcribe the audio with Groq
        const transcript = await transcribeAudioWithGroq(uri);
        console.log("📝 Transcript:", transcript);

        // Parse the command
        const command = parseVoiceCommand(transcript);
        console.log("✅ Command:", command);

        // Clean up and release lock
        globalRecording = null;
        isRecording = false;

        return {
            command,
            transcript,
        };
    } catch (error: any) {
        console.error("❌ Voice recording error:", error);
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
                await new Promise((resolve) => setTimeout(resolve, 500));

                console.log("Inside startContinuousListening Function...");

                if (!shouldContinue) break;

                const result = await recordAndTranscribeVoiceCommand(3000);

                // Only process if a valid command was detected
                if (result.command !== "unknown") {
                    onCommand(result);
                }
            } catch (error: any) {
                if (shouldContinue) {
                    onError(error);
                }
                // Wait before retrying
                await new Promise((resolve) => setTimeout(resolve, 1000));
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
