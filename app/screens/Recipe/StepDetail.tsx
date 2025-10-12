import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, ScrollView, Alert, ActivityIndicator, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useStore, StoreState } from "../../store/useStore";
import { colors } from "../../theme/colors";
import * as Speech from "expo-speech";
import { recordAndTranscribeVoiceCommand, startContinuousListening, VoiceCommandResult } from "../../api/handsFreeCookingApi";

const { width } = Dimensions.get("window");

type CookingMode = "interactive" | "manual";

export default function StepDetail() {
    const { id, step, mode } = useLocalSearchParams<{ id: string; step: string; mode?: string }>();
    const favorites = useStore((s: StoreState) => s.favorites);
    const myRecipes = useStore((s: StoreState) => s.myRecipes);
    const user = useStore((s: StoreState) => s.user);
    const router = useRouter();

    const cookingMode: CookingMode = (mode as CookingMode) || "manual";

    const [showProgress, setShowProgress] = useState(false);
    const [stepImageUrl, setStepImageUrl] = useState<string | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [recognizedText, setRecognizedText] = useState("");
    const [micPermissionGranted, setMicPermissionGranted] = useState(false);
    const [micPermissionDenied, setMicPermissionDenied] = useState(false);

    const stopListeningRef = useRef<(() => void) | null>(null);
    const isFirstStepRef = useRef(true);

    // Check both favorites and myRecipes
    let recipe = favorites.find((r: any) => r.id === id);
    if (!recipe) {
        recipe = myRecipes.find((r: any) => r.id === id);
    }

    const current = recipe?.steps?.find((s: any) => String(s.stepNumber) === step) || recipe?.steps?.[0];
    const idx = current && recipe?.steps ? recipe.steps.indexOf(current) : 0;

    // Define callbacks before any conditional returns
    const handleVoiceCommand = useCallback(
        async (command: "next" | "previous" | "repeat" | "unknown") => {
            console.log(`🎯 Processing voice command: ${command}`);

            if (!recipe) return;

            if (command === "next") {
                const nextStep = recipe.steps[idx + 1];
                if (nextStep) {
                    router.replace({
                        pathname: "./StepDetail",
                        params: { id: recipe.id, step: nextStep.stepNumber, mode: cookingMode },
                    });
                } else {
                    Speech.speak("You have completed all steps! Great job!", {
                        language: "en-US",
                        pitch: 1.0,
                        rate: 0.85,
                        volume: 1.0,
                    });
                }
            } else if (command === "previous") {
                const prevStep = recipe.steps[idx - 1];
                if (prevStep) {
                    router.replace({
                        pathname: "./StepDetail",
                        params: { id: recipe.id, step: prevStep.stepNumber, mode: cookingMode },
                    });
                } else {
                    Speech.speak("You are already at the first step.", {
                        language: "en-US",
                        pitch: 1.0,
                        rate: 0.85,
                        volume: 1.0,
                    });
                }
            } else if (command === "repeat") {
                if (current) {
                    // Configure audio for iOS earpiece fix
                    if (Platform.OS === "ios") {
                        try {
                            const { Audio } = await import("expo-av");
                            await Audio.setAudioModeAsync({
                                allowsRecordingIOS: false,
                                playsInSilentModeIOS: true,
                                staysActiveInBackground: false,
                                shouldDuckAndroid: false,
                                playThroughEarpieceAndroid: false,
                            });
                        } catch (error) {
                            console.log("Audio setup warning for repeat:", error);
                        }
                    }

                    const textToSpeak = `Step ${current.stepNumber}. ${current.text}`;
                    Speech.speak(textToSpeak, {
                        language: "en-US",
                        pitch: 1.0,
                        rate: 0.85,
                        volume: 1.0,
                    });
                }
            }
        },
        [recipe, idx, cookingMode, router, current]
    );

    const startVoiceListening = useCallback(async () => {
        if (isListening) return;
        setIsListening(true);
        setRecognizedText("🎤 Listening for your command...");

        try {
            // Configure audio session for voice listening
            const { Audio } = await import("expo-av");
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: false,
                playThroughEarpieceAndroid: false,
            });

            const stopFn = await startContinuousListening(
                (result: VoiceCommandResult) => {
                    console.log("🎯 Command received:", result.command);
                    setRecognizedText(`Heard: "${result.transcript}"`);
                    handleVoiceCommand(result.command);
                },
                (error: Error) => {
                    console.error("❌ Listening error:", error);
                }
            );
            stopListeningRef.current = stopFn;
        } catch (error: any) {
            console.error("❌ Failed to start listening:", error);
            setIsListening(false);
            setRecognizedText("");
        }
    }, [isListening, handleVoiceCommand]);

    const speakCurrentStep = useCallback(async () => {
        if (!current) return;

        console.log("🗣️ Starting TTS for step:", current.stepNumber);
        setIsSpeaking(true);

        // Stop any ongoing speech before starting new one
        await Speech.stop();

        // Configure audio session for speech - specifically avoid earpiece on iOS
        try {
            const { Audio } = await import("expo-av");

            if (Platform.OS === "ios") {
                // iOS-specific configuration to force speaker output
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: false,
                    shouldDuckAndroid: false,
                    playThroughEarpieceAndroid: false,
                    interruptionModeIOS: 1, // MIX_WITH_OTHERS
                });

                // Additional iOS setup to ensure speaker output
                try {
                    await Audio.requestPermissionsAsync();
                } catch (permError) {
                    console.log("Audio permission warning:", permError);
                }
            } else {
                // Android configuration
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: false,
                    shouldDuckAndroid: true,
                    playThroughEarpieceAndroid: false,
                    interruptionModeAndroid: 1,
                });
            }
        } catch (error) {
            console.log("Audio mode setup warning:", error);
        }

        const textToSpeak = `Step ${current.stepNumber}. ${current.text}`;

        // iOS workaround: Add a small delay to ensure audio session is properly configured
        if (Platform.OS === "ios") {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        Speech.speak(textToSpeak, {
            language: "en-US",
            pitch: 1.0,
            rate: 0.85,
            volume: 1.0, // Explicitly set volume to maximum
            // iOS-specific option to avoid earpiece
            voice: undefined, // Let system choose best voice for speaker output
            onDone: () => {
                console.log("🗣️ TTS completed for step:", current.stepNumber);
                setIsSpeaking(false);
                if (cookingMode === "interactive") {
                    console.log("🎤 Starting voice listening after TTS...");
                    // Small delay before starting listening to ensure speech has fully finished
                    setTimeout(() => {
                        startVoiceListening();
                    }, 300);
                }
            },
            onStopped: () => {
                console.log("🗣️ TTS stopped for step:", current.stepNumber);
                setIsSpeaking(false);
            },
            onError: (error) => {
                console.error("❌ Speech error:", error);
                setIsSpeaking(false);
            },
        });
    }, [current, cookingMode, startVoiceListening]);

    // Generate image for current step
    useEffect(() => {
        if (!current || !recipe) return;

        const generateStepImage = async () => {
            if (current.image) {
                setStepImageUrl(current.image);
                return;
            }

            try {
                // Simplify the prompt for faster generation
                const stepNumber = current.stepNumber;
                const seed = stepNumber * 1000 + recipe.title.length;

                // Use a simpler, more reliable prompt
                const simplePrompt = encodeURIComponent(`${recipe.title} cooking step ${stepNumber}, professional food photography`);

                const pollinationsUrl = `https://image.pollinations.ai/prompt/${simplePrompt}?width=800&height=600&nologo=true&seed=${seed}&enhance=true`;

                setStepImageUrl(pollinationsUrl);
            } catch (error) {
                console.error("Error generating step image:", error);
            }
        };

        generateStepImage();
    }, [step, current?.text, current?.stepNumber, recipe?.title, current?.image]);

    // Initialize hands-free mode on first step only
    useEffect(() => {
        if (!current || !recipe) return;

        if (cookingMode === "interactive" && current.stepNumber === 1 && isFirstStepRef.current) {
            isFirstStepRef.current = false;
            initializeHandsFreeCooking();
        }

        // If interactive mode but not first step, request permissions immediately
        if (cookingMode === "interactive" && current.stepNumber !== 1 && !micPermissionGranted) {
            requestMicPermission();
        }

        // Cleanup on unmount
        return () => {
            if (stopListeningRef.current) {
                stopListeningRef.current();
            }
            Speech.stop();

            // Reset audio mode when component unmounts
            (async () => {
                try {
                    const { Audio } = await import("expo-av");
                    if (Platform.OS === "ios") {
                        await Audio.setAudioModeAsync({
                            allowsRecordingIOS: false,
                            playsInSilentModeIOS: true,
                            staysActiveInBackground: false,
                            shouldDuckAndroid: false,
                            playThroughEarpieceAndroid: false,
                        });
                    } else {
                        await Audio.setAudioModeAsync({
                            allowsRecordingIOS: false,
                            playsInSilentModeIOS: true,
                            staysActiveInBackground: false,
                            shouldDuckAndroid: true,
                            playThroughEarpieceAndroid: false,
                        });
                    }
                } catch (error) {
                    console.log("Audio cleanup warning:", error);
                }
            })();
        };
    }, [cookingMode, current?.stepNumber, micPermissionGranted]);

    // Auto-speak when step changes in interactive mode (skip first step as it's handled above)
    useEffect(() => {
        if (!current || !recipe) return;

        console.log("🔄 Step change effect triggered:", {
            cookingMode,
            stepNumber: current?.stepNumber,
            micPermissionGranted,
            shouldSpeak: cookingMode === "interactive" && current?.stepNumber !== 1 && micPermissionGranted,
        });

        if (cookingMode === "interactive" && current?.stepNumber !== 1 && micPermissionGranted) {
            console.log("✅ Auto-speaking for step change...");
            // Add a small delay to ensure navigation is complete
            const timer = setTimeout(() => {
                speakCurrentStep();
            }, 500); // Increased delay to ensure everything is ready

            return () => clearTimeout(timer);
        }
    }, [step, micPermissionGranted, cookingMode, current?.stepNumber, speakCurrentStep]);

    if (!recipe) {
        return (
            <View style={styles.center}>
                <Text>No recipe</Text>
            </View>
        );
    }

    if (!current) {
        return (
            <View style={styles.center}>
                <Text>Step not found</Text>
            </View>
        );
    }

    const requestMicPermission = async () => {
        try {
            console.log("Requesting microphone permission...");
            const { Audio } = await import("expo-av");
            const { granted } = await Audio.requestPermissionsAsync();

            if (granted) {
                setMicPermissionGranted(true);
            } else {
                setMicPermissionDenied(true);
            }
        } catch (error) {
            console.error("Error requesting mic permission:", error);
            setMicPermissionDenied(true);
        }
    };

    const initializeHandsFreeCooking = async () => {
        try {
            // Request microphone permissions
            const { Audio } = await import("expo-av");
            const { granted } = await Audio.requestPermissionsAsync();

            if (!granted) {
                setMicPermissionDenied(true);
                Alert.alert(
                    "Microphone Permission Required",
                    "Hands-free cooking requires microphone access to listen to your voice commands. Please enable microphone permission in your device settings.",
                    [{ text: "Use Manual Mode", onPress: () => router.back() }, { text: "OK" }]
                );
                return;
            }

            setMicPermissionGranted(true);

            // Configure audio session for iOS before welcome message
            if (Platform.OS === "ios") {
                try {
                    await Audio.setAudioModeAsync({
                        allowsRecordingIOS: false,
                        playsInSilentModeIOS: true,
                        staysActiveInBackground: false,
                        shouldDuckAndroid: false,
                        playThroughEarpieceAndroid: false,
                    });
                } catch (error) {
                    console.log("Audio setup warning for welcome:", error);
                }
            }

            // Welcome message
            const userName = user?.name || "Chef";
            const welcomeMessage = `Hello ${userName}, let's start cooking ${recipe.title}`;

            Speech.speak(welcomeMessage, {
                language: "en-US",
                pitch: 1.0,
                rate: 0.85,
                volume: 1.0,
                onDone: () => {
                    // After welcome, speak first step
                    speakCurrentStep();
                },
            });
        } catch (error) {
            console.error("Error initializing hands-free cooking:", error);
            Alert.alert("Initialization Error", "Failed to start hands-free cooking mode. Would you like to continue in manual mode?", [
                { text: "Manual Mode", onPress: () => router.back() },
                { text: "Retry", onPress: () => initializeHandsFreeCooking() },
            ]);
        }
    };

    // Manual mode: button to toggle TTS
    const handleManualSpeak = async () => {
        if (isSpeaking) {
            await Speech.stop();
            setIsSpeaking(false);
        } else {
            speakCurrentStep();
        }
    };

    const go = (n: number) => {
        const next = recipe.steps[idx + n];
        if (next) {
            router.replace({
                pathname: "./StepDetail",
                params: { id: recipe.id, step: next.stepNumber, mode: cookingMode },
            });
        }
    };

    const isLastStep = idx === recipe.steps.length - 1;
    const progressPercent = ((idx + 1) / recipe.steps.length) * 100;

    return (
        <View style={styles.container}>
            {/* Compact Header */}
            <View style={styles.compactHeader}>
                <View style={styles.headerLeft}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                    </View>
                    <Text style={styles.progressText}>
                        {idx + 1}/{recipe.steps.length}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => setShowProgress(!showProgress)} style={styles.menuButton}>
                    <MaterialIcons name="more-vert" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Step Content */}
                <View style={styles.stepContainer}>
                    {/* Step Image */}
                    <View style={styles.stepImageContainer}>
                        {stepImageUrl ? (
                            <Image
                                source={{ uri: stepImageUrl }}
                                style={styles.stepImage}
                                resizeMode="cover"
                                onError={(error) => {
                                    console.log("Image load error:", error.nativeEvent.error);
                                    // Fallback to a simpler Unsplash URL
                                    setStepImageUrl("https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=600&fit=crop");
                                }}
                            />
                        ) : (
                            <View style={styles.stepImagePlaceholder}>
                                <MaterialIcons name="image" size={48} color="#ccc" />
                            </View>
                        )}
                    </View>

                    {/* Step Number Badge */}
                    <View style={styles.stepBadge}>
                        <Text style={styles.stepBadgeText}>Step {current.stepNumber}</Text>
                    </View>

                    {/* Instruction text */}
                    <Text style={styles.stepInstruction}>{current.text}</Text>

                    {/* Interactive Mode Status */}
                    {cookingMode === "interactive" && (
                        <View style={styles.interactiveStatus}>
                            {micPermissionDenied ? (
                                <View style={styles.permissionDenied}>
                                    <MaterialIcons name="mic-off" size={20} color="#E74C3C" />
                                    <Text style={styles.permissionDeniedText}>Microphone access denied</Text>
                                </View>
                            ) : (
                                <>
                                    {isSpeaking && (
                                        <View style={styles.statusIndicator}>
                                            <View style={styles.statusIconContainer}>
                                                <MaterialIcons name="volume-up" size={18} color={colors.accent} />
                                            </View>
                                            <Text style={styles.statusText}>Reading...</Text>
                                        </View>
                                    )}

                                    {isListening && !isSpeaking && (
                                        <View style={styles.statusIndicator}>
                                            <View style={[styles.statusIconContainer, styles.pulseAnimation]}>
                                                <MaterialIcons name="mic" size={18} color={colors.accent} />
                                            </View>
                                            <Text style={styles.statusText}>Listening</Text>
                                        </View>
                                    )}
                                </>
                            )}
                        </View>
                    )}

                    {/* Manual Mode: Listen Button */}
                    {cookingMode === "manual" && (
                        <TouchableOpacity style={[styles.listenButton, isSpeaking && styles.listenButtonActive]} onPress={handleManualSpeak}>
                            <MaterialIcons name={isSpeaking ? "volume-off" : "volume-up"} size={20} color={isSpeaking ? "#fff" : colors.accent} />
                            <Text style={[styles.listenText, isSpeaking && styles.listenTextActive]}>
                                {isSpeaking ? "Stop Reading" : "Listen to Instructions"}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            {/* Navigation Buttons (Always visible for fallback) */}
            <View style={styles.navigationContainer}>
                <TouchableOpacity
                    style={[styles.navButton, styles.backButton, idx === 0 && styles.navButtonDisabled]}
                    onPress={() => go(-1)}
                    disabled={idx === 0}
                >
                    <MaterialIcons name="arrow-back" size={20} color={idx === 0 ? "#ccc" : colors.textPrimary} />
                    <Text style={[styles.navButtonText, idx === 0 && styles.navButtonTextDisabled]}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.navButton, styles.repeatButton]} onPress={() => speakCurrentStep()}>
                    <MaterialIcons name="replay" size={20} color={colors.textPrimary} />
                    <Text style={styles.navButtonText}>Repeat</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.navButton, styles.nextButton]}
                    onPress={() => {
                        if (isLastStep) {
                            router.push({
                                pathname: "/screens/Recipe/RecipeCompletionScreen",
                                params: { id: recipe.id },
                            });
                        } else {
                            go(1);
                        }
                    }}
                >
                    <Text style={styles.nextButtonText}>{isLastStep ? "Finish" : "Next"}</Text>
                    <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Progress Modal Overlay */}
            {showProgress && (
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowProgress(false)}>
                    <View style={styles.progressModal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Your Progress</Text>
                            <TouchableOpacity onPress={() => setShowProgress(false)}>
                                <MaterialIcons name="close" size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.completedText}>
                            You have completed {idx + 1} of {recipe.steps.length} steps!
                        </Text>

                        <ScrollView style={styles.stepsList}>
                            {recipe.steps.map((s: any, index: number) => (
                                <TouchableOpacity
                                    key={s.stepNumber}
                                    style={styles.progressStepItem}
                                    onPress={() => {
                                        setShowProgress(false);
                                        router.replace({
                                            pathname: "./StepDetail",
                                            params: { id: recipe.id, step: s.stepNumber, mode: cookingMode },
                                        });
                                    }}
                                >
                                    <View
                                        style={[
                                            styles.progressStepCircle,
                                            index < idx && styles.progressStepCircleCompleted,
                                            index === idx && styles.progressStepCircleActive,
                                        ]}
                                    >
                                        {index < idx ? (
                                            <MaterialIcons name="check" size={16} color="#fff" />
                                        ) : (
                                            <Text style={[styles.progressStepNumber, index === idx && styles.progressStepNumberActive]}>
                                                {index + 1}
                                            </Text>
                                        )}
                                    </View>
                                    <Text
                                        style={[
                                            styles.progressStepText,
                                            index < idx && styles.progressStepTextCompleted,
                                            index === idx && styles.progressStepTextActive,
                                        ]}
                                    >
                                        Step {index + 1}: {s.text.substring(0, 30)}...
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <TouchableOpacity style={styles.resumeButton} onPress={() => setShowProgress(false)}>
                            <Text style={styles.resumeButtonText}>Resume Cooking</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFF5F0",
    },
    container: {
        flex: 1,
        backgroundColor: "#FFF5F0",
    },
    compactHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 12,
        backgroundColor: "#FFF5F0",
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    headerLeft: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    progressBar: {
        flex: 1,
        height: 4,
        backgroundColor: "#E8E8E8",
        borderRadius: 2,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: colors.accent,
        borderRadius: 2,
    },
    progressText: {
        fontSize: 13,
        fontWeight: "700",
        color: colors.textPrimary,
        minWidth: 40,
    },
    menuButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#F8F8F8",
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 100,
    },
    stepContainer: {
        gap: 16,
    },
    stepImageContainer: {
        width: "100%",
        height: 220,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#F5F5F5",
    },
    stepImage: {
        width: "100%",
        height: "100%",
    },
    stepImagePlaceholder: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F5F5F5",
    },
    stepBadge: {
        backgroundColor: colors.accent,
        alignSelf: "flex-start",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    stepBadgeText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#fff",
    },
    stepInstruction: {
        fontSize: 17,
        lineHeight: 26,
        color: colors.textPrimary,
        fontWeight: "500",
    },
    interactiveStatus: {
        marginTop: 4,
    },
    permissionDenied: {
        backgroundColor: "#FFF0F0",
        padding: 12,
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    permissionDeniedText: {
        flex: 1,
        fontSize: 13,
        color: "#E74C3C",
        fontWeight: "600",
    },
    statusIndicator: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F8F8F8",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        alignSelf: "flex-start",
        gap: 8,
    },
    statusIconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#FFF",
        justifyContent: "center",
        alignItems: "center",
    },
    pulseAnimation: {
        backgroundColor: "#FFE5DC",
    },
    statusText: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    listeningSubtext: {
        fontSize: 13,
        color: colors.textMuted,
        textAlign: "center",
    },
    listenButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginTop: 16,
        gap: 8,
        borderWidth: 2,
        borderColor: colors.accent,
    },
    listenButtonActive: {
        backgroundColor: colors.accent,
    },
    listenText: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.accent,
    },
    listenTextActive: {
        color: "#fff",
    },
    navigationContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingBottom: 24,
        backgroundColor: "#FFF5F0",
        borderTopWidth: 1,
        borderTopColor: "#E0E0E0",
        gap: 12,
    },
    navButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        borderRadius: 12,
        gap: 6,
    },
    backButton: {
        backgroundColor: "#fff",
        borderWidth: 1.5,
        borderColor: "#E0E0E0",
    },
    repeatButton: {
        backgroundColor: "#fff",
        borderWidth: 1.5,
        borderColor: "#E0E0E0",
    },
    nextButton: {
        backgroundColor: colors.accent,
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    navButtonDisabled: {
        backgroundColor: "#F5F5F5",
        borderColor: "#E0E0E0",
    },
    navButtonText: {
        fontSize: 15,
        fontWeight: "700",
        color: colors.textPrimary,
    },
    navButtonTextDisabled: {
        color: "#ccc",
    },
    nextButtonText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#fff",
    },
    modalOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    progressModal: {
        width: width * 0.9,
        maxHeight: "80%",
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 24,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: colors.textPrimary,
    },
    completedText: {
        fontSize: 15,
        color: colors.textMuted,
        marginBottom: 20,
    },
    stepsList: {
        maxHeight: 300,
    },
    progressStepItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: "#F8F8F8",
        borderRadius: 12,
        marginBottom: 8,
    },
    progressStepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#E0E0E0",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    progressStepCircleCompleted: {
        backgroundColor: colors.accent,
    },
    progressStepCircleActive: {
        backgroundColor: colors.accent,
        borderWidth: 3,
        borderColor: "#FFE5DC",
    },
    progressStepNumber: {
        fontSize: 14,
        fontWeight: "700",
        color: "#666",
    },
    progressStepNumberActive: {
        color: "#fff",
    },
    progressStepText: {
        flex: 1,
        fontSize: 14,
        color: colors.textMuted,
    },
    progressStepTextCompleted: {
        textDecorationLine: "line-through",
    },
    progressStepTextActive: {
        color: colors.textPrimary,
        fontWeight: "600",
    },
    resumeButton: {
        backgroundColor: colors.accent,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 16,
    },
    resumeButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#fff",
    },
});
