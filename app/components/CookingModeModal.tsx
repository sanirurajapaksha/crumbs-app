import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

export type CookingMode = 'interactive' | 'manual';

interface CookingModeModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectMode: (mode: CookingMode) => void;
    userName?: string;
    recipeName: string;
}

export default function CookingModeModal({
    visible,
    onClose,
    onSelectMode,
    userName = 'Chef',
    recipeName,
}: CookingModeModalProps) {
    
    const handleModeSelection = (mode: CookingMode) => {
        onSelectMode(mode);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Cooking Mode</Text>
                    </View>

                    {/* Interactive Mode Option */}
                    <TouchableOpacity
                        style={styles.optionCard}
                        onPress={() => handleModeSelection('interactive')}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.iconContainer, styles.interactiveIcon]}>
                            <MaterialIcons name="mic" size={28} color="#fff" />
                        </View>
                        <View style={styles.optionContent}>
                            <Text style={styles.optionTitle}>Hands-Free</Text>
                            <Text style={styles.optionDescription}>
                                Voice commands • Auto TTS
                            </Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={colors.accent} />
                    </TouchableOpacity>

                    {/* Manual Mode Option */}
                    <TouchableOpacity
                        style={styles.optionCard}
                        onPress={() => handleModeSelection('manual')}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.iconContainer, styles.manualIcon]}>
                            <MaterialIcons name="touch-app" size={28} color="#fff" />
                        </View>
                        <View style={styles.optionContent}>
                            <Text style={styles.optionTitle}>Manual</Text>
                            <Text style={styles.optionDescription}>
                                Button controls • Optional TTS
                            </Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#666" />
                    </TouchableOpacity>

                    {/* Cancel Button */}
                    <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: width * 0.9,
        maxWidth: 500,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    header: {
        marginBottom: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F8F8',
        borderRadius: 14,
        padding: 18,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: '#E8E8E8',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    interactiveIcon: {
        backgroundColor: colors.accent,
    },
    manualIcon: {
        backgroundColor: '#666',
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    optionDescription: {
        fontSize: 13,
        color: colors.textMuted,
    },
    cancelButton: {
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    cancelText: {
        fontSize: 16,
        color: colors.textMuted,
        fontWeight: '600',
    },
});
