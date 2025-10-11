import { MaterialIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../theme/colors";
import {
    cleanupAudioFile,
    initializeSpeechRecognition,
    startVoiceRecording,
    stopVoiceRecording,
    transcribeAudio,
    useWebSpeechRecognition,
} from "../utils/speechUtils";

interface VoiceInputModalProps {
    visible: boolean;
    onClose: () => void;
    onTranscript: (text: string) => void;
    title?: string;
    placeholder?: string;
    maxDuration?: number;
}

export const VoiceInputModal: React.FC<VoiceInputModalProps> = ({
    visible,
    onClose,
    onTranscript,
    title = "Voice Input",
    placeholder = "Tap the microphone and speak...",
    maxDuration = 15,
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [transcript, setTranscript] = useState("");
    const [error, setError] = useState("");

    const waveAnim1 = useRef(new Animated.Value(0.3)).current;
    const waveAnim2 = useRef(new Animated.Value(0.3)).current;
    const waveAnim3 = useRef(new Animated.Value(0.3)).current;
    const timerInterval = useRef<any>(null);
    const autoStopTimeout = useRef<any>(null);

    // Cleanup on unmount or when modal closes
    useEffect(() => {
        if (!visible) {
            stopTimer();
            setIsRecording(false);
            setIsProcessing(false);
            setTranscript("");
            setError("");
            setRecordingTime(0);
        }
    }, [visible]);

    // Cleanup timers
    useEffect(() => {
        return () => {
            if (timerInterval.current) clearInterval(timerInterval.current);
            if (autoStopTimeout.current) clearTimeout(autoStopTimeout.current);
        };
    }, []);

    // Wave animation for recording state
    useEffect(() => {
        if (isRecording) {
            const createWaveAnimation = (animValue: Animated.Value, delay: number) => {
                return Animated.loop(
                    Animated.sequence([
                        Animated.timing(animValue, {
                            toValue: 1,
                            duration: 800,
                            delay,
                            useNativeDriver: true,
                        }),
                        Animated.timing(animValue, {
                            toValue: 0.3,
                            duration: 800,
                            useNativeDriver: true,
                        }),
                    ])
                );
            };

            Animated.parallel([createWaveAnimation(waveAnim1, 0), createWaveAnimation(waveAnim2, 200), createWaveAnimation(waveAnim3, 400)]).start();
        } else {
            waveAnim1.setValue(0.3);
            waveAnim2.setValue(0.3);
            waveAnim3.setValue(0.3);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRecording]);

    // Web Speech Recognition
    const webSpeech = useWebSpeechRecognition(
        (text) => {
            setTranscript(text);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Auto-close and send transcript after 1 second
            setTimeout(() => {
                onTranscript(text);
                onClose();
            }, 1000);
        },
        (errorMsg) => {
            setError(errorMsg);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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

    const handleStartRecording = async () => {
        setError("");
        setTranscript("");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Web platform
        if (Platform.OS === "web" && webSpeech.isSupported) {
            setIsRecording(true);
            webSpeech.startListening();

            let time = 0;
            timerInterval.current = setInterval(() => {
                time += 0.1;
                setRecordingTime(time);
            }, 100);

            autoStopTimeout.current = setTimeout(() => {
                handleStopRecording();
            }, maxDuration * 1000);

            return;
        }

        // Mobile platform
        try {
            const hasPermission = await initializeSpeechRecognition();

            if (!hasPermission) {
                setError("Microphone permission required");
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                return;
            }

            const newRecording = await startVoiceRecording();

            if (newRecording) {
                setRecording(newRecording);
                setIsRecording(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                let time = 0;
                timerInterval.current = setInterval(() => {
                    time += 0.1;
                    setRecordingTime(time);
                }, 100);

                autoStopTimeout.current = setTimeout(() => {
                    handleStopRecording();
                }, maxDuration * 1000);
            } else {
                setError("Failed to start recording");
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
        } catch (err) {
            console.error("Recording error:", err);
            setError("Failed to start recording");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const handleStopRecording = async () => {
        stopTimer();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Web platform
        if (Platform.OS === "web" && webSpeech.isSupported) {
            webSpeech.stopListening();
            setIsRecording(false);
            setIsProcessing(true);
            return;
        }

        // Mobile platform
        if (recording) {
            setIsRecording(false);
            setIsProcessing(true);

            try {
                const audioUri = await stopVoiceRecording(recording);
                setRecording(null);

                if (audioUri) {
                    const result = await transcribeAudio(audioUri);

                    if (result.transcript) {
                        setTranscript(result.transcript);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                        // Auto-close and send transcript after 1 second
                        setTimeout(() => {
                            onTranscript(result.transcript);
                            onClose();
                        }, 1000);
                    } else {
                        setError("No speech detected");
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    }

                    await cleanupAudioFile(audioUri);
                } else {
                    setError("Failed to process recording");
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                }
            } catch (err) {
                console.error("Transcription error:", err);
                setError("Transcription failed. Check API key.");
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleToggleRecording = () => {
        if (isRecording) {
            handleStopRecording();
        } else {
            handleStartRecording();
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        {/* Waveform Animation */}
                        {isRecording && (
                            <View style={styles.waveformContainer}>
                                <Animated.View style={[styles.wave, { transform: [{ scaleY: waveAnim1 }] }]} />
                                <Animated.View style={[styles.wave, styles.waveMiddle, { transform: [{ scaleY: waveAnim2 }] }]} />
                                <Animated.View style={[styles.wave, { transform: [{ scaleY: waveAnim3 }] }]} />
                            </View>
                        )}

                        {/* Microphone Button */}
                        <TouchableOpacity
                            style={[styles.micButton, isRecording && styles.micButtonActive, isProcessing && styles.micButtonProcessing]}
                            onPress={handleToggleRecording}
                            disabled={isProcessing}
                            activeOpacity={0.8}
                        >
                            {isProcessing ? (
                                <ActivityIndicator size="large" color={colors.white} />
                            ) : (
                                <MaterialIcons name={isRecording ? "stop" : "mic"} size={48} color={colors.white} />
                            )}
                        </TouchableOpacity>

                        {/* Recording Timer */}
                        {isRecording && (
                            <View style={styles.timerContainer}>
                                <View style={styles.recordingDot} />
                                <Text style={styles.timerText}>
                                    {recordingTime.toFixed(1)}s / {maxDuration}s
                                </Text>
                            </View>
                        )}

                        {/* Status Text */}
                        {!isRecording && !isProcessing && !transcript && !error && <Text style={styles.placeholder}>{placeholder}</Text>}

                        {isProcessing && <Text style={styles.statusText}>Transcribing audio...</Text>}

                        {transcript && (
                            <View style={styles.transcriptContainer}>
                                <MaterialIcons name="check-circle" size={24} color={colors.success} />
                                <Text style={styles.transcriptText}>&ldquo;{transcript}&rdquo;</Text>
                            </View>
                        )}

                        {error && (
                            <View style={styles.errorContainer}>
                                <MaterialIcons name="error" size={24} color={colors.danger} />
                                <Text style={styles.errorText}>{error}</Text>
                                <TouchableOpacity style={styles.retryButton} onPress={handleStartRecording}>
                                    <Text style={styles.retryText}>Try Again</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Instructions */}
                    <View style={styles.footer}>
                        <Text style={styles.instructionText}>
                            {isRecording ? "Speak clearly. Tap to stop." : "Tap the microphone to start recording"}
                        </Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    container: {
        width: "100%",
        maxWidth: 400,
        backgroundColor: colors.white,
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.textPrimary,
    },
    closeButton: {
        padding: 4,
    },
    content: {
        alignItems: "center",
        paddingVertical: 32,
        minHeight: 280,
    },
    waveformContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        height: 80,
        marginBottom: 32,
    },
    wave: {
        width: 6,
        height: 60,
        backgroundColor: colors.accent,
        borderRadius: 3,
    },
    waveMiddle: {
        height: 80,
    },
    micButton: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.accent,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    micButtonActive: {
        backgroundColor: colors.danger,
        shadowColor: colors.danger,
    },
    micButtonProcessing: {
        backgroundColor: colors.textMuted,
    },
    timerContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 16,
        backgroundColor: colors.neutral100,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    recordingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.danger,
    },
    timerText: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.textSecondary,
    },
    placeholder: {
        marginTop: 24,
        fontSize: 14,
        color: colors.textMuted,
        textAlign: "center",
    },
    statusText: {
        marginTop: 24,
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: "center",
    },
    transcriptContainer: {
        marginTop: 24,
        alignItems: "center",
        gap: 12,
        padding: 16,
        backgroundColor: colors.success + "15",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.success + "40",
    },
    transcriptText: {
        fontSize: 16,
        color: colors.textPrimary,
        textAlign: "center",
        fontStyle: "italic",
    },
    errorContainer: {
        marginTop: 24,
        alignItems: "center",
        gap: 12,
        padding: 16,
        backgroundColor: colors.danger + "15",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.danger + "40",
    },
    errorText: {
        fontSize: 14,
        color: colors.danger,
        textAlign: "center",
    },
    retryButton: {
        marginTop: 8,
        paddingHorizontal: 20,
        paddingVertical: 8,
        backgroundColor: colors.accent,
        borderRadius: 20,
    },
    retryText: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.white,
    },
    footer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    instructionText: {
        fontSize: 12,
        color: colors.textMuted,
        textAlign: "center",
    },
});
