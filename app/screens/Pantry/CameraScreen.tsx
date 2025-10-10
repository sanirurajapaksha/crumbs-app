import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../theme/colors';

interface CameraScreenProps {
    onPhotoTaken?: (uri: string) => void;
}

export default function CameraScreen({ onPhotoTaken }: CameraScreenProps) {
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const router = useRouter();

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
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                    base64: false,
                    skipProcessing: false,
                });
                
                if (photo?.uri) {
                    // TODO: Process the image with AI/ML for object detection
                    // For now, we'll simulate processing and go back
                    // This is where you would integrate with Google Vision API, 
                    // Gemini Vision, or other AI services to detect pantry items
                    
                    if (onPhotoTaken) {
                        onPhotoTaken(photo.uri);
                    }
                    
                    // For demo purposes, we'll just go back to the previous screen
                    // In a real implementation, you'd process the image and add detected items
                    router.back();
                }
            } catch (error) {
                Alert.alert('Error', 'Failed to take picture');
                console.error('Camera error:', error);
            }
        }
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
                    <Text style={styles.headerTitle}>Scan Pantry Items</Text>
                    <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                        <Ionicons name="camera-reverse" size={24} color={colors.white} />
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomContainer}>
                    <View style={styles.instructionContainer}>
                        <Text style={styles.instructionText}>
                            Point camera at your pantry items or ingredients
                        </Text>
                    </View>
                    
                    <View style={styles.captureContainer}>
                        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                            <View style={styles.captureButtonInner} />
                        </TouchableOpacity>
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
    captureContainer: {
        alignItems: 'center',
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