import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { analyzePantryItemsFromAudio, analyzePantryItemsFromImage, processDetectedItems } from '../../api/pantryAnalysis';
import { useStore } from '../../store/useStore';
import { colors } from '../../theme/colors';
import { initializeAudio, RecordingState, startRecording, stopRecording } from '../../utils/audioUtils';
import { handleError, showErrorAlert } from '../../utils/errorHandling';

interface CameraScreenProps {
    onPhotoTaken?: (uri: string) => void;
    onItemsDetected?: (items: any[]) => void;
}

export default function CameraScreen({ onPhotoTaken, onItemsDetected }: CameraScreenProps) {
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [recordingState, setRecordingState] = useState<RecordingState>({
        isRecording: false,
        isProcessing: false,
        duration: 0,
        permissionGranted: false
    });
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    
    const cameraRef = useRef<CameraView>(null);
    const router = useRouter();
    const { addBatchPantryItems, pantryItems, user } = useStore();

    useEffect(() => {
        // Initialize audio permissions on component mount
        const setupAudio = async () => {
            const granted = await initializeAudio();
            setRecordingState(prev => ({ ...prev, permissionGranted: granted }));
        };
        setupAudio();
    }, []);

    if (!permission) {
        // Camera permissions are still loading
        return (
            <View style={styles.container}>
                <Text style={styles.message}>Loading camera...</Text>
            </View>
        );
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet
        return (
            <View style={styles.container}>
                <Text style={styles.message}>We need your permission to show the camera</Text>
                <TouchableOpacity style={styles.button} onPress={requestPermission}>
                    <Text style={styles.buttonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    const takePicture = async () => {
        if (cameraRef.current && !isAnalyzing) {
            try {
                setIsAnalyzing(true);
                
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                    base64: false,
                    skipProcessing: false,
                });
                
                if (photo?.uri) {
                    if (onPhotoTaken) {
                        onPhotoTaken(photo.uri);
                    }
                    
                    // Analyze the image with AI
                    const result = await analyzePantryItemsFromImage(photo.uri, user?.id);
                    
                    if (result.success && result.items.length > 0) {
                        // Filter items to avoid duplicates
                        const filteredItems = processDetectedItems(result.detectedItems, pantryItems);
                        
                        if (filteredItems.length > 0) {
                            // Add detected items to pantry
                            addBatchPantryItems(result.items);
                            
                            if (onItemsDetected) {
                                onItemsDetected(result.items);
                            }
                            
                            Alert.alert(
                                'Items Detected!', 
                                `Found ${result.items.length} pantry items: ${result.items.map(item => item.name).join(', ')}`,
                                [{ text: 'OK', onPress: () => router.back() }]
                            );
                        } else {
                            Alert.alert('No New Items', 'All detected items are already in your pantry.');
                        }
                    } else {
                        const error = handleError(new Error(result.error || 'Analysis failed'));
                        showErrorAlert(error, () => takePicture());
                    }
                }
            } catch (error) {
                const appError = handleError(error);
                showErrorAlert(appError, () => takePicture());
                console.error('Camera analysis error:', error);
            } finally {
                setIsAnalyzing(false);
            }
        }
    };

    const startVoiceRecording = async () => {
        if (!recordingState.permissionGranted) {
            Alert.alert('Permission Required', 'Please grant microphone permission to use voice input.');
            return;
        }

        try {
            const newRecording = await startRecording();
            if (newRecording) {
                setRecording(newRecording);
                setRecordingState(prev => ({ ...prev, isRecording: true, duration: 0 }));
                
                // Start duration counter
                const timer = setInterval(() => {
                    setRecordingState(prev => ({ ...prev, duration: prev.duration + 1 }));
                }, 1000);
                
                // Store timer reference for cleanup
                (newRecording as any).timer = timer;
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to start voice recording.');
            console.error('Recording error:', error);
        }
    };

    const stopVoiceRecording = async () => {
        if (!recording) return;

        try {
            setRecordingState(prev => ({ ...prev, isRecording: false, isProcessing: true }));
            
            // Clear timer
            if ((recording as any).timer) {
                clearInterval((recording as any).timer);
            }

            const audioUri = await stopRecording(recording);
            
            if (audioUri) {
                // Analyze the audio with AI
                const result = await analyzePantryItemsFromAudio(audioUri, user?.id);
                
                if (result.success && result.items.length > 0) {
                    // Filter items to avoid duplicates
                    const filteredItems = processDetectedItems(result.detectedItems, pantryItems);
                    
                    if (filteredItems.length > 0) {
                        // Add detected items to pantry
                        addBatchPantryItems(result.items);
                        
                        if (onItemsDetected) {
                            onItemsDetected(result.items);
                        }
                        
                        Alert.alert(
                            'Items Added!', 
                            `Added ${result.items.length} items from voice input: ${result.items.map(item => item.name).join(', ')}`,
                            [{ text: 'OK', onPress: () => router.back() }]
                        );
                    } else {
                        Alert.alert('No New Items', 'All mentioned items are already in your pantry.');
                    }
                } else {
                    const error = handleError(new Error(result.error || 'Analysis failed'));
                    showErrorAlert(error, () => stopVoiceRecording());
                }
            }
        } catch (error) {
            const appError = handleError(error);
            showErrorAlert(appError, () => stopVoiceRecording());
            console.error('Voice processing error:', error);
        } finally {
            setRecording(null);
            setRecordingState(prev => ({ 
                ...prev, 
                isRecording: false, 
                isProcessing: false, 
                duration: 0 
            }));
        }
    };

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.container}>
            <CameraView 
                style={styles.camera} 
                facing={facing}
                ref={cameraRef}
            >
                <View style={styles.headerContainer}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="close" size={24} color={colors.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>AI Pantry Scanner</Text>
                    <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                        <Ionicons name="camera-reverse" size={24} color={colors.white} />
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomContainer}>
                    {/* Recording status indicator */}
                    {recordingState.isRecording && (
                        <View style={styles.recordingIndicator}>
                            <View style={styles.recordingDot} />
                            <Text style={styles.recordingText}>Recording: {formatDuration(recordingState.duration)}</Text>
                        </View>
                    )}
                    
                    {/* Processing indicator */}
                    {(isAnalyzing || recordingState.isProcessing) && (
                        <View style={styles.processingIndicator}>
                            <ActivityIndicator size="small" color={colors.white} />
                            <Text style={styles.processingText}>
                                {isAnalyzing ? 'Analyzing image...' : 'Processing voice...'}
                            </Text>
                        </View>
                    )}

                    <View style={styles.instructionContainer}>
                        <Text style={styles.instructionText}>
                            Take a photo of pantry items or hold the mic button to speak
                        </Text>
                    </View>
                    
                    <View style={styles.controlsContainer}>
                        {/* Voice recording button */}
                        <TouchableOpacity 
                            style={[
                                styles.voiceButton, 
                                recordingState.isRecording && styles.voiceButtonActive
                            ]}
                            onPress={recordingState.isRecording ? stopVoiceRecording : startVoiceRecording}
                            disabled={isAnalyzing || recordingState.isProcessing}
                        >
                            <Ionicons 
                                name={recordingState.isRecording ? "stop" : "mic"} 
                                size={24} 
                                color={colors.white} 
                            />
                        </TouchableOpacity>

                        {/* Camera capture button */}
                        <TouchableOpacity 
                            style={styles.captureButton} 
                            onPress={takePicture}
                            disabled={isAnalyzing || recordingState.isRecording || recordingState.isProcessing}
                        >
                            <View style={[
                                styles.captureButtonInner,
                                (isAnalyzing || recordingState.isRecording || recordingState.isProcessing) && styles.captureButtonDisabled
                            ]}>
                                {isAnalyzing ? (
                                    <ActivityIndicator size="small" color={colors.white} />
                                ) : (
                                    <Ionicons name="camera" size={24} color={colors.white} />
                                )}
                            </View>
                        </TouchableOpacity>

                        {/* Spacer for symmetry */}
                        <View style={styles.voiceButton} />
                    </View>
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.black,
    },
    message: {
        textAlign: 'center',
        paddingBottom: 10,
        color: colors.white,
        fontSize: 16,
    },
    camera: {
        flex: 1,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: colors.white,
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    flipButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 50,
    },
    recordingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,0,0,0.8)',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        marginBottom: 20,
        alignSelf: 'center',
    },
    recordingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.white,
        marginRight: 8,
    },
    recordingText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: 'bold',
    },
    processingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        marginBottom: 20,
        alignSelf: 'center',
    },
    processingText: {
        color: colors.white,
        fontSize: 14,
        marginLeft: 8,
    },
    instructionContainer: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    instructionText: {
        color: colors.white,
        fontSize: 16,
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 15,
        borderRadius: 10,
    },
    controlsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    voiceButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.white,
    },
    voiceButtonActive: {
        backgroundColor: colors.accent,
        borderColor: colors.accent,
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: colors.accent,
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButtonDisabled: {
        backgroundColor: colors.textMuted,
    },
    button: {
        backgroundColor: colors.accent,
        padding: 15,
        borderRadius: 10,
        marginHorizontal: 20,
        alignItems: 'center',
    },
    buttonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});