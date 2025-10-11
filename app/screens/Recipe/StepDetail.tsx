import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useStore, StoreState } from "../../store/useStore";
import { colors } from "../../theme/colors";
import * as Speech from 'expo-speech';
import { recordAndTranscribeVoiceCommand, VoiceCommandResult } from '../../api/voiceCommandApi';

const { width } = Dimensions.get("window");

export default function StepDetail() {
    const { id, step } = useLocalSearchParams<{ id: string; step: string }>();
    const favorites = useStore((s: StoreState) => s.favorites);
    const myRecipes = useStore((s: StoreState) => s.myRecipes);
    const router = useRouter();
    const [showProgress, setShowProgress] = useState(false);
    const [stepImageUrl, setStepImageUrl] = useState<string | null>(null);
    const [imageLoading, setImageLoading] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [showVoiceCommands, setShowVoiceCommands] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [recognizedText, setRecognizedText] = useState('');

    // Check both favorites and myRecipes
    let recipe = favorites.find((r: any) => r.id === id);
    if (!recipe) {
        recipe = myRecipes.find((r: any) => r.id === id);
    }

    if (!recipe) {
        return (
            <View style={styles.center}>
                <Text>No recipe</Text>
            </View>
        );
    }

    const current = recipe.steps.find((s: any) => String(s.stepNumber) === step) || recipe.steps[0];
    const idx = recipe.steps.indexOf(current);
    
    // Generate image for current step
    useEffect(() => {
        const generateStepImage = async () => {
            if (current.image) {
                setStepImageUrl(current.image);
                setImageLoading(false);
                return;
            }

            // Generate image based on step text
            try {
                setImageLoading(true);
                
                // Extract key actions/verbs from step text for better image matching
                const stepText = current.text.toLowerCase();
                const stepWords = stepText.split(' ');
                
                // Common cooking actions that make good image search terms
                const cookingActions = ['chop', 'slice', 'dice', 'mince', 'mix', 'stir', 'whisk', 'beat', 
                                       'fold', 'knead', 'roll', 'cut', 'peel', 'grate', 'blend', 'pour',
                                       'heat', 'boil', 'simmer', 'fry', 'sauté', 'bake', 'roast', 'grill',
                                       'season', 'marinate', 'coat', 'garnish', 'serve', 'arrange'];
                
                // Find cooking action in step
                const action = stepWords.find(word => cookingActions.includes(word)) || 'cooking';
                
                // Extract main ingredient (usually nouns after the action)
                const ingredientIndex = stepWords.findIndex(word => cookingActions.includes(word)) + 1;
                const ingredient = stepWords[ingredientIndex] || '';
                
                // Create specific search term for this step
                const recipeName = recipe.title.split(' ')[0]; // Use first word of recipe name
                const stepNumber = current.stepNumber;
                
                // Build search query with step-specific details and unique seed
                const searchQuery = `${action} ${ingredient} ${recipeName} food cooking`.replace(/\s+/g, '+');
                
                // Use Pollinations AI with step-specific prompt for unique images
                const pollinationsPrompt = encodeURIComponent(
                    `${action} ${ingredient} for ${recipe.title}, step ${stepNumber}, professional food photography, close-up cooking action`
                );
                const seed = stepNumber * 1000 + recipe.title.length; // Unique seed per step
                const pollinationsUrl = `https://image.pollinations.ai/prompt/${pollinationsPrompt}?width=800&height=600&nologo=true&seed=${seed}`;
                
                // Use Unsplash as fallback with step-specific query
                const unsplashUrl = `https://source.unsplash.com/800x600/?${searchQuery}&sig=${stepNumber}`;
                
                console.log(`🎨 Step ${stepNumber} image:`, { action, ingredient, pollinationsUrl, unsplashUrl });
                
                // Try Pollinations first for AI-generated step-specific images
                setStepImageUrl(pollinationsUrl);
                setImageLoading(false);
            } catch (error) {
                console.error('Error generating step image:', error);
                setImageLoading(false);
            }
        };

        generateStepImage();
    }, [step, current.text, current.stepNumber, recipe.title]);
    
    // Text-to-Speech functionality
    const handleSpeak = async () => {
        if (isSpeaking) {
            // Stop speaking
            await Speech.stop();
            setIsSpeaking(false);
            setShowVoiceCommands(false);
            setIsListening(false);
        } else {
            // Start speaking
            setIsSpeaking(true);
            setRecognizedText('');
            const textToSpeak = `Step ${current.stepNumber}. ${current.text}`;
            
            Speech.speak(textToSpeak, {
                language: 'en-US',
                pitch: 1.0,
                rate: 0.85,
                onDone: () => {
                    setIsSpeaking(false);
                    // Show voice command prompt and start listening
                    setShowVoiceCommands(true);
                    startVoiceRecognition();
                },
                onStopped: () => {
                    setIsSpeaking(false);
                    setShowVoiceCommands(false);
                },
                onError: (error) => {
                    console.error('Speech error:', error);
                    setIsSpeaking(false);
                    setShowVoiceCommands(false);
                    Alert.alert('Speech Error', 'Failed to read instructions');
                }
            });
        }
    };

    // Voice Recognition with Groq Whisper
    const startVoiceRecognition = async () => {
        try {
            setIsListening(true);
            setRecognizedText('Listening...');
            
            console.log('🎤 Starting voice recognition...');
            
            // Record and transcribe audio
            const result: VoiceCommandResult = await recordAndTranscribeVoiceCommand();
            
            setRecognizedText(`You said: "${result.transcript}"`);
            setIsListening(false);
            
            // Execute the command
            if (result.command !== 'unknown') {
                setTimeout(() => {
                    handleVoiceCommand(result.command as 'next' | 'previous' | 'repeat');
                }, 500);
            } else {
                Alert.alert(
                    'Command not recognized', 
                    `I heard: "${result.transcript}"\n\nPlease say "Next", "Previous", or "Repeat"`,
                    [
                        { text: 'Try Again', onPress: () => startVoiceRecognition() },
                        { text: 'Cancel', style: 'cancel', onPress: () => setShowVoiceCommands(false) }
                    ]
                );
            }
            
        } catch (error: any) {
            console.error('❌ Voice recognition error:', error);
            setIsListening(false);
            setRecognizedText('');
            
            Alert.alert(
                'Voice Recognition Error', 
                error.message || 'Failed to recognize voice command. Please use the buttons below.',
                [{ text: 'OK', onPress: () => setShowVoiceCommands(true) }]
            );
        }
    };

    // Voice command handlers
    const handleVoiceCommand = (command: 'next' | 'previous' | 'repeat') => {
        setShowVoiceCommands(false);
        setRecognizedText('');
        
        if (command === 'next') {
            go(1);
        } else if (command === 'previous') {
            go(-1);
        } else if (command === 'repeat') {
            handleSpeak();
        }
    };
    
    const go = (n: number) => {
        const next = recipe.steps[idx + n];
        if (next) {
            router.replace({ 
                pathname: "./StepDetail", 
                params: { id: recipe.id, step: next.stepNumber } 
            });
        }
    };

    const isLastStep = idx === recipe.steps.length - 1;
    const progressPercent = ((idx + 1) / recipe.steps.length) * 100;

    return (
        <View style={styles.container}>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                </View>
                <Text style={styles.progressText}>Step {idx + 1} of {recipe.steps.length}</Text>
                <TouchableOpacity onPress={() => setShowProgress(!showProgress)}>
                    <MaterialIcons name="list" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Step Content */}
                <View style={styles.stepContainer}>
                    {/* Step Image - Now at the top */}
                    <View style={styles.stepImageContainer}>
                        {imageLoading ? (
                            <View style={styles.stepImagePlaceholder}>
                                <ActivityIndicator size="large" color={colors.accent} />
                                <Text style={styles.loadingImageText}>Loading image...</Text>
                            </View>
                        ) : stepImageUrl ? (
                            <Image 
                                source={{ uri: stepImageUrl }} 
                                style={styles.stepImage}
                                resizeMode="cover"
                                onError={() => {
                                    console.log('Image load error, using fallback');
                                    setStepImageUrl('https://source.unsplash.com/800x600/?cooking,food');
                                }}
                            />
                        ) : (
                            <View style={styles.stepImagePlaceholder}>
                                <MaterialIcons name="image" size={64} color="#ccc" />
                                <Text style={styles.noImageText}>No image available</Text>
                            </View>
                        )}
                    </View>

                    {/* Step Title */}
                    <Text style={styles.stepTitle}>Step {current.stepNumber}</Text>
                    
                    {/* Step Description - Short version */}
                    <Text style={styles.stepDescription}>
                        {current.text.length > 60 
                            ? current.text.substring(0, 60) + '...' 
                            : current.text
                        }
                    </Text>

                    {/* Listen Button */}
                    <TouchableOpacity 
                        style={[styles.listenButton, isSpeaking && styles.listenButtonActive]} 
                        onPress={handleSpeak}
                    >
                        <MaterialIcons 
                            name={isSpeaking ? "volume-off" : "volume-up"} 
                            size={20} 
                            color={isSpeaking ? "#fff" : colors.accent} 
                        />
                        <Text style={[styles.listenText, isSpeaking && styles.listenTextActive]}>
                            {isSpeaking ? "Stop Reading" : "Listen to Instructions"}
                        </Text>
                    </TouchableOpacity>

                    {/* Voice Command Buttons */}
                    {showVoiceCommands && (
                        <View style={styles.voiceCommandsContainer}>
                            {isListening ? (
                                <View style={styles.listeningContainer}>
                                    <ActivityIndicator size="large" color={colors.accent} />
                                    <MaterialIcons name="mic" size={40} color={colors.accent} style={{ marginTop: 12 }} />
                                    <Text style={styles.listeningText}>{recognizedText || 'Listening...'}</Text>
                                    <Text style={styles.listeningSubtext}>
                                        Say "Next", "Previous", or "Repeat"
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    <Text style={styles.voiceCommandsTitle}>
                                        {recognizedText || "Say a command or tap a button"}
                                    </Text>
                                    <View style={styles.voiceCommandButtons}>
                                        <TouchableOpacity 
                                            style={[styles.voiceCommandButton, idx === 0 && styles.voiceCommandButtonDisabled]} 
                                            onPress={() => handleVoiceCommand('previous')}
                                            disabled={idx === 0}
                                        >
                                            <MaterialIcons name="arrow-back" size={20} color={idx === 0 ? "#ccc" : colors.accent} />
                                            <Text style={[styles.voiceCommandButtonText, idx === 0 && styles.voiceCommandButtonTextDisabled]}>
                                                Previous
                                            </Text>
                                        </TouchableOpacity>
                                        
                                        <TouchableOpacity 
                                            style={styles.voiceCommandButton} 
                                            onPress={() => handleVoiceCommand('repeat')}
                                        >
                                            <MaterialIcons name="replay" size={20} color={colors.accent} />
                                            <Text style={styles.voiceCommandButtonText}>Repeat</Text>
                                        </TouchableOpacity>
                                        
                                        <TouchableOpacity 
                                            style={[styles.voiceCommandButton, styles.voiceCommandButtonPrimary]} 
                                            onPress={() => handleVoiceCommand('next')}
                                        >
                                            <Text style={styles.voiceCommandButtonTextPrimary}>Next</Text>
                                            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                    <TouchableOpacity 
                                        style={styles.tryAgainButton}
                                        onPress={startVoiceRecognition}
                                    >
                                        <MaterialIcons name="mic" size={18} color={colors.accent} />
                                        <Text style={styles.tryAgainButtonText}>Use Voice Command</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    )}

                    {/* Detailed instruction text */}
                    <View style={styles.instructionBox}>
                        <Text style={styles.instructionLabel}>Instructions:</Text>
                        <Text style={styles.stepInstruction}>{current.text}</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Navigation Buttons */}
            <View style={styles.navigationContainer}>
                <TouchableOpacity 
                    style={[styles.navButton, styles.backButton, idx === 0 && styles.navButtonDisabled]} 
                    onPress={() => go(-1)} 
                    disabled={idx === 0}
                >
                    <Text style={[styles.navButtonText, idx === 0 && styles.navButtonTextDisabled]}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.navButton, styles.repeatButton]} onPress={() => go(0)}>
                    <Text style={styles.navButtonText}>Repeat</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.navButton, styles.nextButton]} 
                    onPress={() => {
                        if (isLastStep) {
                            // Navigate to completion screen
                            router.push({
                                pathname: "/screens/Recipe/RecipeCompletionScreen",
                                params: { id: recipe.id }
                            });
                        } else {
                            go(1);
                        }
                    }}
                >
                    <Text style={styles.nextButtonText}>{isLastStep ? "Finish" : "Next"}</Text>
                </TouchableOpacity>
            </View>

            {/* Progress Modal Overlay */}
            {showProgress && (
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setShowProgress(false)}
                >
                    <View style={styles.progressModal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Your Progress</Text>
                            <TouchableOpacity onPress={() => setShowProgress(false)}>
                                <MaterialIcons name="close" size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.completedText}>You've completed {idx + 1} of {recipe.steps.length} steps!</Text>
                        
                        {/* Steps List */}
                        <ScrollView style={styles.stepsList}>
                            {recipe.steps.map((s: any, index: number) => (
                                <TouchableOpacity
                                    key={s.stepNumber}
                                    style={styles.progressStepItem}
                                    onPress={() => {
                                        setShowProgress(false);
                                        router.replace({
                                            pathname: "./StepDetail",
                                            params: { id: recipe.id, step: s.stepNumber }
                                        });
                                    }}
                                >
                                    <View style={[
                                        styles.progressStepCircle,
                                        index < idx && styles.progressStepCircleCompleted,
                                        index === idx && styles.progressStepCircleActive
                                    ]}>
                                        {index < idx ? (
                                            <MaterialIcons name="check" size={16} color="#fff" />
                                        ) : (
                                            <Text style={[
                                                styles.progressStepNumber,
                                                index === idx && styles.progressStepNumberActive
                                            ]}>{index + 1}</Text>
                                        )}
                                    </View>
                                    <Text style={[
                                        styles.progressStepText,
                                        index < idx && styles.progressStepTextCompleted,
                                        index === idx && styles.progressStepTextActive
                                    ]}>
                                        Step {index + 1}: {s.text.substring(0, 30)}...
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <TouchableOpacity 
                            style={styles.resumeButton}
                            onPress={() => setShowProgress(false)}
                        >
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
    progressContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        gap: 12,
    },
    progressBar: {
        flex: 1,
        height: 6,
        backgroundColor: "#E0E0E0",
        borderRadius: 3,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: colors.accent,
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        fontWeight: "600",
        color: colors.textSecondary,
    },
    content: {
        padding: 16,
        paddingBottom: 120,
    },
    stepContainer: {
        backgroundColor: "#fff",
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    stepTitle: { 
        fontSize: 28, 
        fontWeight: "700",
        color: colors.textPrimary,
        textAlign: "center",
        marginBottom: 12,
        lineHeight: 36,
    },
    stepDescription: {
        fontSize: 16,
        fontWeight: "400",
        color: colors.textSecondary,
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 24,
        fontStyle: "italic",
    },
    listenButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFE5DC",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        alignSelf: "center",
        marginBottom: 24,
        gap: 8,
    },
    listenButtonActive: {
        backgroundColor: colors.accent,
    },
    listenText: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.accent,
    },
    listenTextActive: {
        color: "#fff",
    },
    voiceCommandsContainer: {
        backgroundColor: "#F8F8F8",
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
    },
    voiceCommandsTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.textPrimary,
        marginBottom: 16,
        textAlign: "center",
    },
    voiceCommandButtons: {
        flexDirection: "row",
        gap: 10,
        justifyContent: "space-between",
    },
    voiceCommandButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        gap: 6,
        borderWidth: 1.5,
        borderColor: "#E0E0E0",
    },
    voiceCommandButtonPrimary: {
        backgroundColor: colors.accent,
        borderColor: colors.accent,
    },
    voiceCommandButtonDisabled: {
        opacity: 0.4,
    },
    voiceCommandButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    voiceCommandButtonTextPrimary: {
        fontSize: 14,
        fontWeight: "600",
        color: "#fff",
    },
    voiceCommandButtonTextDisabled: {
        color: "#ccc",
    },
    listeningContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 30,
    },
    listeningText: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.textPrimary,
        marginTop: 16,
        textAlign: "center",
    },
    listeningSubtext: {
        fontSize: 14,
        color: colors.textMuted,
        marginTop: 8,
        textAlign: "center",
    },
    tryAgainButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFF5F0",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginTop: 12,
        gap: 8,
        borderWidth: 1.5,
        borderColor: colors.accent,
    },
    tryAgainButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.accent,
    },
    stepImage: {
        width: "100%",
        height: 280,
        borderRadius: 16,
        marginBottom: 24,
    },
    stepImageContainer: {
        width: "100%",
        marginBottom: 0,
    },
    stepImagePlaceholder: {
        width: "100%",
        height: 240,
        borderRadius: 16,
        backgroundColor: "#F5F5F5",
        alignItems: "center",
        justifyContent: "center",
    },
    loadingImageText: {
        marginTop: 12,
        fontSize: 14,
        color: colors.textSecondary,
    },
    noImageText: {
        marginTop: 12,
        fontSize: 14,
        color: colors.textMuted,
    },
    instructionBox: {
        marginTop: 20,
        padding: 16,
        backgroundColor: "#FFF5F0",
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: colors.accent,
    },
    instructionLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: colors.accent,
        marginBottom: 8,
    },
    stepInstruction: {
        fontSize: 16,
        lineHeight: 24,
        color: colors.textSecondary,
    },
    navigationContainer: { 
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 16,
        backgroundColor: "#FFF5F0",
        borderTopWidth: 1,
        borderTopColor: "#E0E0E0",
        gap: 12,
    },
    navButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    backButton: {
        backgroundColor: "#FFE5DC",
    },
    repeatButton: {
        backgroundColor: "#FFE5DC",
    },
    nextButton: {
        backgroundColor: colors.accent,
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    navButtonDisabled: {
        opacity: 0.4,
    },
    navButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.accent,
    },
    navButtonTextDisabled: {
        color: colors.textMuted,
    },
    nextButtonText: {
        fontSize: 16,
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
        padding: 16,
    },
    progressModal: {
        backgroundColor: "#fff",
        borderRadius: 24,
        padding: 24,
        width: "100%",
        maxHeight: "80%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: colors.textPrimary,
    },
    completedText: {
        fontSize: 16,
        color: colors.textSecondary,
        marginBottom: 24,
    },
    stepsList: {
        maxHeight: 300,
        marginBottom: 20,
    },
    progressStepItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    progressStepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#E0E0E0",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    progressStepCircleCompleted: {
        backgroundColor: "#4CAF50",
    },
    progressStepCircleActive: {
        backgroundColor: colors.accent,
    },
    progressStepNumber: {
        fontSize: 14,
        fontWeight: "700",
        color: colors.textSecondary,
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
        color: colors.textMuted,
        textDecorationLine: "line-through",
    },
    progressStepTextActive: {
        color: colors.textPrimary,
        fontWeight: "600",
    },
    resumeButton: {
        backgroundColor: colors.accent,
        paddingVertical: 16,
        borderRadius: 24,
        alignItems: "center",
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    resumeButtonText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#fff",
    },
});
