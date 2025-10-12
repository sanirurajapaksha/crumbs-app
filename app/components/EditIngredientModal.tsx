import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { categorizeIngredient } from '../api/groqApi';
import { colors } from '../theme/colors';

interface IngredientData {
    id: string;
    name: string;
    quantity?: string;
    category?: string;
    expiryDate?: string | null;
}

interface EditIngredientModalProps {
    visible: boolean;
    ingredient: IngredientData | null;
    onClose: () => void;
    onSave: (updatedIngredient: IngredientData) => void;
    onDelete?: (ingredientId: string) => void;
}

const categories = [
    'vegetables',
    'fruits', 
    'dairy & eggs',
    'meat & poultry',
    'seafood',
    'grains & cereals',
    'legumes & nuts',
    'spices & herbs',
    'oils & condiments',
    'beverages',
    'baking & desserts',
    'frozen foods',
    'canned goods',
    'other'
];

export const EditIngredientModal: React.FC<EditIngredientModalProps> = ({
    visible,
    ingredient,
    onClose,
    onSave,
    onDelete
}) => {
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [category, setCategory] = useState('other');
    const [expiryDate, setExpiryDate] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerDate, setDatePickerDate] = useState(new Date());
    const [isRecategorizing, setIsRecategorizing] = useState(false);

    useEffect(() => {
        if (ingredient) {
            setName(ingredient.name);
            setQuantity(ingredient.quantity || '');
            setCategory(ingredient.category || 'other');
            // Format date for display if exists
            if (ingredient.expiryDate) {
                const date = new Date(ingredient.expiryDate);
                setExpiryDate(date.toISOString().split('T')[0]);
                setDatePickerDate(date);
            } else {
                setExpiryDate('');
                setDatePickerDate(new Date());
            }
        }
    }, [ingredient]);

    const handleSave = () => {
        if (!name.trim()) {
            Alert.alert('Name Required', 'Please enter an ingredient name.');
            return;
        }

        if (!ingredient) return;

        const updatedIngredient: IngredientData = {
            ...ingredient,
            name: name.trim(),
            quantity: quantity.trim() || undefined,
            category: category,
            expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null
        };

        onSave(updatedIngredient);
        onClose();
    };

    const handleCancel = () => {
        // Reset form to original values
        if (ingredient) {
            setName(ingredient.name);
            setQuantity(ingredient.quantity || '');
            setCategory(ingredient.category || 'other');
            if (ingredient.expiryDate) {
                const date = new Date(ingredient.expiryDate);
                setExpiryDate(date.toISOString().split('T')[0]);
            } else {
                setExpiryDate('');
            }
        }
        onClose();
    };

    const handleDelete = () => {
        if (!ingredient || !onDelete) return;

        Alert.alert(
            'Delete Ingredient',
            `Are you sure you want to delete "${ingredient.name}" from your pantry?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        onDelete(ingredient.id);
                        onClose();
                    },
                },
            ]
        );
    };

    const handleRecategorize = async () => {
        if (!name.trim()) {
            Alert.alert('Name Required', 'Please enter an ingredient name first.');
            return;
        }

        setIsRecategorizing(true);
        try {
            const newCategory = await categorizeIngredient(name.trim());
            setCategory(newCategory);
            Alert.alert(
                'Category Updated', 
                `AI has categorized "${name.trim()}" as "${newCategory}".`,
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('Error recategorizing ingredient:', error);
            Alert.alert(
                'Error', 
                'Failed to categorize ingredient. Please try again or select manually.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsRecategorizing(false);
        }
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        // On Android, the picker stays open, on iOS it closes automatically
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        
        if (selectedDate) {
            setDatePickerDate(selectedDate);
            setExpiryDate(selectedDate.toISOString().split('T')[0]);
        }
    };

    const handleOpenDatePicker = () => {
        setShowDatePicker(true);
    };

    const handleClearDate = () => {
        setExpiryDate('');
        setDatePickerDate(new Date());
    };

    if (!ingredient) return null;

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={handleCancel}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.modalTitle}>Edit Ingredient</Text>
                        <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Name Field */}
                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Name *</Text>
                            <TextInput
                                style={styles.textInput}
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter ingredient name"
                                placeholderTextColor={colors.textMuted}
                                autoCapitalize="words"
                            />
                        </View>

                        {/* Quantity Field */}
                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Quantity</Text>
                            <TextInput
                                style={styles.textInput}
                                value={quantity}
                                onChangeText={setQuantity}
                                placeholder="e.g., 2 lbs, 1 cup, 3 pieces"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        {/* Category Field */}
                        <View style={styles.fieldContainer}>
                            <View style={styles.categoryHeader}>
                                <Text style={styles.fieldLabel}>Category</Text>
                                <TouchableOpacity 
                                    style={[styles.aiButton, isRecategorizing && styles.aiButtonDisabled]}
                                    onPress={handleRecategorize}
                                    disabled={isRecategorizing}
                                >
                                    {isRecategorizing ? (
                                        <ActivityIndicator size="small" color={colors.white} />
                                    ) : (
                                        <Ionicons name="sparkles" size={14} color={colors.white} />
                                    )}
                                    <Text style={styles.aiButtonText}>
                                        {isRecategorizing ? 'AI...' : 'AI'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.categoryContainer}>
                                {categories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[
                                            styles.categoryChip,
                                            category === cat && styles.categoryChipSelected
                                        ]}
                                        onPress={() => setCategory(cat)}
                                        disabled={isRecategorizing}
                                    >
                                        <Text
                                            style={[
                                                styles.categoryChipText,
                                                category === cat && styles.categoryChipTextSelected
                                            ]}
                                        >
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Expiry Date Field */}
                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Expiry Date (Optional)</Text>
                            <View style={styles.dateInputContainer}>
                                <TouchableOpacity 
                                    style={styles.dateButton}
                                    onPress={handleOpenDatePicker}
                                >
                                    <Ionicons name="calendar-outline" size={20} color={colors.accent} />
                                    <Text style={styles.dateButtonText}>
                                        {expiryDate || 'Select Date'}
                                    </Text>
                                </TouchableOpacity>
                                {expiryDate && (
                                    <TouchableOpacity 
                                        style={styles.clearDateButton}
                                        onPress={handleClearDate}
                                    >
                                        <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <Text style={styles.fieldHint}>
                                Tap the calendar icon to select a date
                            </Text>
                        </View>

                        {/* Date Picker */}
                        {showDatePicker && (
                            <DateTimePicker
                                value={datePickerDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={handleDateChange}
                                minimumDate={new Date()}
                                textColor={colors.textPrimary}
                            />
                        )}

                        {/* iOS Date Picker Done Button */}
                        {showDatePicker && Platform.OS === 'ios' && (
                            <View style={styles.datePickerActions}>
                                <TouchableOpacity 
                                    style={styles.datePickerButton}
                                    onPress={() => setShowDatePicker(false)}
                                >
                                    <Text style={styles.datePickerButtonText}>Done</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>

                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                        {onDelete && (
                            <TouchableOpacity 
                                style={styles.deleteButton} 
                                onPress={handleDelete}
                            >
                                <Ionicons name="trash-outline" size={16} color={colors.white} />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity 
                            style={styles.cancelButton} 
                            onPress={handleCancel}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.saveButton} 
                            onPress={handleSave}
                        >
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: colors.white,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    closeButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        maxHeight: 400,
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    fieldContainer: {
        marginBottom: 20,
    },
    fieldLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.textPrimary,
        marginBottom: 8,
    },
    textInput: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: colors.textPrimary,
        backgroundColor: colors.white,
    },
    fieldHint: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 4,
    },
    categoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    aiButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.accent,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    aiButtonDisabled: {
        backgroundColor: colors.textMuted,
    },
    aiButtonText: {
        fontSize: 12,
        color: colors.white,
        fontWeight: '500',
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.neutral200,
        borderWidth: 1,
        borderColor: colors.border,
    },
    categoryChipSelected: {
        backgroundColor: colors.accent,
        borderColor: colors.accent,
    },
    categoryChipText: {
        fontSize: 14,
        color: colors.textSecondary,
        textTransform: 'capitalize',
    },
    categoryChipTextSelected: {
        color: colors.white,
        fontWeight: '500',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 16,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
        gap: 12,
    },
    deleteButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: colors.neutral200,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    saveButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: colors.accent,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.white,
    },
    dateInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.white,
    },
    dateButtonText: {
        fontSize: 16,
        color: colors.textPrimary,
        flex: 1,
    },
    clearDateButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    datePickerActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingTop: 12,
        marginBottom: 8,
    },
    datePickerButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: colors.accent,
    },
    datePickerButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.white,
    },
});

export default EditIngredientModal;