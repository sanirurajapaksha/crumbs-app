import { MaterialIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../theme/colors";
import {
    cleanupAudioFile,
    initializeSpeechRecognition,
    startVoiceRecording,
    stopVoiceRecording,
    transcribeAudio,
    useWebSpeechRecognition,
} from "../utils/speechUtils";

interface VoiceInputButtonProps {
    onTranscript: (text: string) => void;
    onError?: (error: string) => void;
    disabled?: boolean;
    size?: number;
    color?: string;
    showTimer?: boolean;
    maxDuration?: number; // in seconds
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
    onTranscript,
    onError,
    disabled = false,
    size = 24,
    color = colors.accent,
    showTimer = true,
    maxDuration = 10,
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [statusMessage, setStatusMessage] = useState("");

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const timerInterval = useRef<any>(null);
    const autoStopTimeout = useRef<any>(null);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (timerInterval.current) clearInterval(timerInterval.current);
            if (autoStopTimeout.current) clearTimeout(autoStopTimeout.current);
        };
    }, []);

    // Pulse animation for recording state
    useEffect(() => {
        if (isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.3,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRecording]);

    // Web Speech Recognition (for web platform only)
    const webSpeech = useWebSpeechRecognition(
        (transcript) => {
            setStatusMessage(`✓ Recognized: "${transcript}"`);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onTranscript(transcript);

            // Clear status after 2 seconds
            setTimeout(() => setStatusMessage(""), 2000);
        },
        (error) => {
            console.error("Web speech error:", error);
            const errorMsg = "Speech recognition failed. Please try again.";
            setStatusMessage(`✗ ${errorMsg}`);
            onError?.(errorMsg);

            setTimeout(() => setStatusMessage(""), 3000);
        }
    );

    const stopTimer = () => {
        if (timerInterval.current) {
            clearInterval(timerInterval.current);
            timerInterval.current = null;
        }
        if (autoStopTimeout.current) {
            clearTimeout(autoStopTimeout.current);
            autoStopTimeout.current = null;
        }
        setRecordingTime(0);
    };

    const handleVoiceInput = async () => {
        if (disabled) return;

        // Haptic feedback on press
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Use Web Speech API on web platform
        if (Platform.OS === "web" && webSpeech.isSupported) {
            if (isRecording) {
                stopTimer();
                webSpeech.stopListening();
                setIsRecording(false);
                setStatusMessage("Processing...");
            } else {
                setIsRecording(true);
                setStatusMessage("🎤 Listening... Speak now!");
                webSpeech.startListening();

                // Start timer
                let time = 0;
                timerInterval.current = setInterval(() => {
                    time += 0.1;
                    setRecordingTime(time);
                }, 100);

                // Auto-stop after maxDuration
                autoStopTimeout.current = setTimeout(() => {
                    stopTimer();
                    webSpeech.stopListening();
                    setIsRecording(false);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                }, maxDuration * 1000);
            }
            return;
        }

        // Use audio recording + transcription for mobile
        if (isRecording) {
            // Stop recording
            if (recording) {
                stopTimer();
                setIsRecording(false);
                setIsProcessing(true);
                setStatusMessage("✨ Transcribing audio...");

                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

                try {
                    const audioUri = await stopVoiceRecording(recording);
                    setRecording(null);

                    if (audioUri) {
                        // Transcribe the audio
                        const result = await transcribeAudio(audioUri);

                        if (result.transcript) {
                            setStatusMessage(`✓ Recognized: "${result.transcript}"`);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            onTranscript(result.transcript);

                            // Clear status after 2 seconds
                            setTimeout(() => setStatusMessage(""), 2000);
                        } else {
                            const errorMsg = "No speech detected. Please try again.";
                            setStatusMessage(`✗ ${errorMsg}`);
                            onError?.(errorMsg);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

                            setTimeout(() => setStatusMessage(""), 3000);
                        }

                        // Clean up audio file
                        await cleanupAudioFile(audioUri);
                    } else {
                        const errorMsg = "Failed to save recording.";
                        setStatusMessage(`✗ ${errorMsg}`);
                        onError?.(errorMsg);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

                        setTimeout(() => setStatusMessage(""), 3000);
                    }
                } catch (error) {
                    console.error("Transcription error:", error);
                    const errorMsg = "Transcription failed. Check API key.";
                    setStatusMessage(`✗ ${errorMsg}`);
                    onError?.(errorMsg);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

                    setTimeout(() => setStatusMessage(""), 3000);
                } finally {
                    setIsProcessing(false);
                }
            }
        } else {
            // Start recording
            try {
                setStatusMessage("Checking permissions...");
                const hasPermission = await initializeSpeechRecognition();

                if (!hasPermission) {
                    const errorMsg = "Microphone permission required.";
                    setStatusMessage(`✗ ${errorMsg}`);
                    onError?.(errorMsg);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

                    setTimeout(() => setStatusMessage(""), 3000);
                    return;
                }

                const newRecording = await startVoiceRecording();

                if (newRecording) {
                    setRecording(newRecording);
                    setIsRecording(true);
                    setStatusMessage("🎤 Recording... Speak now!");
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                    // Start timer
                    let time = 0;
                    timerInterval.current = setInterval(() => {
                        time += 0.1;
                        setRecordingTime(time);
                    }, 100);

                    // Auto-stop after maxDuration
                    autoStopTimeout.current = setTimeout(() => {
                        if (newRecording) {
                            handleVoiceInput(); // Stop recording
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        }
                    }, maxDuration * 1000);
                } else {
                    const errorMsg = "Failed to start recording.";
                    setStatusMessage(`✗ ${errorMsg}`);
                    onError?.(errorMsg);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

                    setTimeout(() => setStatusMessage(""), 3000);
                }
            } catch (error) {
                console.error("Recording start error:", error);
                const errorMsg = "Failed to start voice input.";
                setStatusMessage(`✗ ${errorMsg}`);
                onError?.(errorMsg);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

                setTimeout(() => setStatusMessage(""), 3000);
            }
        }
    };

    const isActive = isRecording || isProcessing;

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.button, isActive && styles.buttonActive, disabled && styles.buttonDisabled, isRecording && styles.buttonRecording]}
                onPress={handleVoiceInput}
                disabled={disabled || isProcessing}
                activeOpacity={0.7}
            >
                <Animated.View style={[styles.iconContainer, isRecording && { transform: [{ scale: pulseAnim }] }]}>
                    {isProcessing ? (
                        <View style={styles.processingContainer}>
                            <ActivityIndicator size="small" color={color} />
                            <Text style={styles.processingText}>...</Text>
                        </View>
                    ) : (
                        <MaterialIcons
                            name={isRecording ? "mic" : "mic-none"}
                            size={size}
                            color={disabled ? colors.textMuted : isRecording ? colors.white : color}
                        />
                    )}
                </Animated.View>

                {/* Recording Timer */}
                {showTimer && isRecording && (
                    <View style={styles.timerContainer}>
                        <View style={styles.recordingDot} />
                        <Text style={styles.timerText}>{recordingTime.toFixed(1)}s</Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* Status Message */}
            {statusMessage && (
                <View style={styles.statusContainer}>
                    <Text
                        style={[
                            styles.statusText,
                            statusMessage.startsWith("✓") && styles.statusSuccess,
                            statusMessage.startsWith("✗") && styles.statusError,
                        ]}
                    >
                        {statusMessage}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
    },
    button: {
        padding: 12,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
        minWidth: 48,
        minHeight: 48,
        backgroundColor: colors.white,
        borderWidth: 2,
        borderColor: colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonActive: {
        backgroundColor: colors.accent + "15",
        borderColor: colors.accent,
    },
    buttonRecording: {
        backgroundColor: colors.accent,
        borderColor: colors.accent,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    iconContainer: {
        justifyContent: "center",
        alignItems: "center",
    },
    processingContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    processingText: {
        fontSize: 12,
        color: colors.textMuted,
        fontWeight: "600",
    },
    timerContainer: {
        position: "absolute",
        bottom: -20,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: colors.white,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.accent + "40",
    },
    recordingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.danger,
    },
    timerText: {
        fontSize: 10,
        color: colors.textSecondary,
        fontWeight: "600",
    },
    statusContainer: {
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: colors.white,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        maxWidth: 250,
    },
    statusText: {
        fontSize: 11,
        color: colors.textSecondary,
        textAlign: "center",
    },
    statusSuccess: {
        color: colors.success || "#10B981",
    },
    statusError: {
        color: colors.danger,
    },
});
