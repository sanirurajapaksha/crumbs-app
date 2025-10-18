/**
 * DuplicateResolutionModal - Intelligent UI for handling duplicate pantry items
 * Presents merge suggestions with options to merge, replace, or add separately
 */

import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { DuplicateMatch } from '../api/duplicateDetectionApi';
import { colors } from '../theme/colors';

interface DuplicateResolutionModalProps {
    visible: boolean;
    matches: DuplicateMatch[];
    onResolve: (resolutions: ResolutionDecision[]) => void;
    onCancel: () => void;
}

export interface ResolutionDecision {
    match: DuplicateMatch;
    action: 'merge' | 'separate' | 'replace' | 'skip';
}

export function DuplicateResolutionModal({
    visible,
    matches,
    onResolve,
    onCancel,
}: DuplicateResolutionModalProps) {
    const [decisions, setDecisions] = useState<Map<number, 'merge' | 'separate' | 'replace' | 'skip'>>(new Map());

    const handleDecision = (index: number, action: 'merge' | 'separate' | 'replace' | 'skip') => {
        setDecisions(prev => {
            const updated = new Map(prev);
            updated.set(index, action);
            return updated;
        });
    };

    const handleConfirm = () => {
        const resolutions: ResolutionDecision[] = matches.map((match, index) => ({
            match,
            action: decisions.get(index) || match.suggestedAction,
        }));

        // Validate: ensure user made decisions for all matches
        const undecided = resolutions.filter(r => !decisions.has(matches.indexOf(r.match)));
        if (undecided.length > 0) {
            Alert.alert(
                'Incomplete Selection',
                'Please review all duplicate items before continuing.',
                [{ text: 'OK' }]
            );
            return;
        }

        onResolve(resolutions);
        setDecisions(new Map()); // Reset for next time
    };

    const getConfidenceColor = (confidence: number): string => {
        if (confidence >= 0.9) return colors.success;
        if (confidence >= 0.7) return colors.accent;
        return colors.danger;
    };

    const getConfidenceLabel = (confidence: number): string => {
        if (confidence >= 0.9) return 'High Confidence';
        if (confidence >= 0.7) return 'Medium Confidence';
        return 'Low Confidence';
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onCancel}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerIcon}>
                            <Ionicons name="duplicate-outline" size={24} color={colors.accent} />
                        </View>
                        <Text style={styles.headerTitle}>Possible Duplicates Found</Text>
                        <Text style={styles.headerSubtitle}>
                            We found {matches.length} {matches.length === 1 ? 'item' : 'items'} that might already be in your pantry
                        </Text>
                    </View>

                    {/* Duplicate Items List */}
                    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {matches.map((match, index) => {
                            const decision = decisions.get(index) || match.suggestedAction;
                            
                            return (
                                <View key={index} style={styles.duplicateCard}>
                                    {/* Confidence Badge */}
                                    <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(match.confidence) + '20' }]}>
                                        <Text style={[styles.confidenceText, { color: getConfidenceColor(match.confidence) }]}>
                                            {getConfidenceLabel(match.confidence)} ({Math.round(match.confidence * 100)}%)
                                        </Text>
                                    </View>

                                    {/* Items Comparison */}
                                    <View style={styles.comparisonContainer}>
                                        {/* Existing Item */}
                                        <View style={styles.itemColumn}>
                                            <Text style={styles.itemLabel}>In Pantry</Text>
                                            <View style={styles.itemCard}>
                                                <Text style={styles.itemName}>{match.existingItem.name}</Text>
                                                <Text style={styles.itemDetails}>
                                                    {match.existingItem.quantity || 'No quantity'}
                                                </Text>
                                                {match.existingItem.category && (
                                                    <Text style={styles.itemCategory}>{match.existingItem.category}</Text>
                                                )}
                                            </View>
                                        </View>

                                        {/* Arrow */}
                                        <View style={styles.arrowContainer}>
                                            <MaterialIcons name="compare-arrows" size={24} color={colors.textMuted} />
                                        </View>

                                        {/* New Item */}
                                        <View style={styles.itemColumn}>
                                            <Text style={styles.itemLabel}>New Item</Text>
                                            <View style={styles.itemCard}>
                                                <Text style={styles.itemName}>{match.newItem.name}</Text>
                                                <Text style={styles.itemDetails}>
                                                    {match.newItem.quantity || 'No quantity'}
                                                </Text>
                                                {match.newItem.category && (
                                                    <Text style={styles.itemCategory}>{match.newItem.category}</Text>
                                                )}
                                            </View>
                                        </View>
                                    </View>

                                    {/* Reason */}
                                    <View style={styles.reasonContainer}>
                                        <Ionicons name="information-circle" size={16} color={colors.accent} />
                                        <Text style={styles.reasonText}>{match.reason}</Text>
                                    </View>

                                    {/* Action Buttons */}
                                    <View style={styles.actionButtons}>
                                        <TouchableOpacity
                                            style={[
                                                styles.actionButton,
                                                decision === 'merge' && styles.actionButtonActive
                                            ]}
                                            onPress={() => handleDecision(index, 'merge')}
                                        >
                                            <Ionicons 
                                                name="git-merge-outline" 
                                                size={18} 
                                                color={decision === 'merge' ? colors.white : colors.accent} 
                                            />
                                            <Text style={[
                                                styles.actionButtonText,
                                                decision === 'merge' && styles.actionButtonTextActive
                                            ]}>
                                                Merge
                                            </Text>
                                            {match.mergedItem && (
                                                <Text style={[
                                                    styles.actionHint,
                                                    decision === 'merge' && styles.actionHintActive
                                                ]}>
                                                    → {match.mergedItem.quantity}
                                                </Text>
                                            )}
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[
                                                styles.actionButton,
                                                decision === 'separate' && styles.actionButtonActive
                                            ]}
                                            onPress={() => handleDecision(index, 'separate')}
                                        >
                                            <Ionicons 
                                                name="add-circle-outline" 
                                                size={18} 
                                                color={decision === 'separate' ? colors.white : colors.textSecondary} 
                                            />
                                            <Text style={[
                                                styles.actionButtonText,
                                                decision === 'separate' && styles.actionButtonTextActive
                                            ]}>
                                                Add as New
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[
                                                styles.actionButton,
                                                decision === 'replace' && styles.actionButtonActive
                                            ]}
                                            onPress={() => handleDecision(index, 'replace')}
                                        >
                                            <Ionicons 
                                                name="swap-horizontal-outline" 
                                                size={18} 
                                                color={decision === 'replace' ? colors.white : colors.accentAlt} 
                                            />
                                            <Text style={[
                                                styles.actionButtonText,
                                                decision === 'replace' && styles.actionButtonTextActive
                                            ]}>
                                                Replace
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[
                                                styles.actionButton,
                                                decision === 'skip' && styles.actionButtonActive
                                            ]}
                                            onPress={() => handleDecision(index, 'skip')}
                                        >
                                            <Ionicons 
                                                name="close-circle-outline" 
                                                size={18} 
                                                color={decision === 'skip' ? colors.white : colors.danger} 
                                            />
                                            <Text style={[
                                                styles.actionButtonText,
                                                decision === 'skip' && styles.actionButtonTextActive
                                            ]}>
                                                Skip
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>

                    {/* Footer Actions */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                            <Text style={styles.confirmButtonText}>Confirm All</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        paddingTop: 24,
    },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
        alignItems: 'center',
    },
    headerIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.accent + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 14,
        color: colors.textMuted,
        textAlign: 'center',
    },
    scrollContent: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    duplicateCard: {
        backgroundColor: colors.neutral50,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    confidenceBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 12,
    },
    confidenceText: {
        fontSize: 12,
        fontWeight: '600',
    },
    comparisonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    itemColumn: {
        flex: 1,
    },
    itemLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textMuted,
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    itemCard: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    itemDetails: {
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    itemCategory: {
        fontSize: 11,
        color: colors.accent,
        fontWeight: '500',
    },
    arrowContainer: {
        paddingHorizontal: 12,
        paddingTop: 20,
    },
    reasonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.accent + '10',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        gap: 8,
    },
    reasonText: {
        flex: 1,
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.white,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 8,
        gap: 4,
    },
    actionButtonActive: {
        backgroundColor: colors.accent,
        borderColor: colors.accent,
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    actionButtonTextActive: {
        color: colors.white,
    },
    actionHint: {
        fontSize: 10,
        color: colors.textMuted,
        fontWeight: '500',
    },
    actionHintActive: {
        color: colors.white,
        opacity: 0.9,
    },
    footer: {
        flexDirection: 'row',
        padding: 24,
        paddingTop: 16,
        gap: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: colors.success,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: colors.success,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.white,
    },
});
