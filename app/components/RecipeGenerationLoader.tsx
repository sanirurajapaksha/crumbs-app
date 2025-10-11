import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Dimensions,
    Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

// Inspirational food quotes
const FOOD_QUOTES = [
    "Good food is the foundation of genuine happiness.",
    "Cooking is love made visible.",
    "Every recipe has a story to tell.",
    "Waste not, want not - every ingredient matters.",
    "The secret ingredient is always love.",
    "Fresh ingredients make the best meals.",
    "Plan your meals, save your resources.",
    "Cooking at home saves money and health.",
    "Transform simple ingredients into magic.",
    "Your pantry holds endless possibilities.",
];

interface RecipeGenerationLoaderProps {
    visible: boolean;
}

export default function RecipeGenerationLoader({ visible }: RecipeGenerationLoaderProps) {
    const [quote, setQuote] = useState(FOOD_QUOTES[0]);
    const [rotateAnim] = useState(new Animated.Value(0));
    const [dot1Anim] = useState(new Animated.Value(0.3));
    const [dot2Anim] = useState(new Animated.Value(0.6));
    const [dot3Anim] = useState(new Animated.Value(1));
    const [quoteOpacity] = useState(new Animated.Value(1));

    useEffect(() => {
        // Rotate animation
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
            })
        ).start();

        // Pulsing dots animation
        const createPulseAnimation = (animValue: Animated.Value, delay: number) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.timing(animValue, {
                        toValue: 1,
                        duration: 600,
                        delay,
                        useNativeDriver: true,
                    }),
                    Animated.timing(animValue, {
                        toValue: 0.3,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ])
            );
        };

        createPulseAnimation(dot1Anim, 0).start();
        createPulseAnimation(dot2Anim, 200).start();
        createPulseAnimation(dot3Anim, 400).start();

        // Change quote every 4 seconds with fade animation
        const quoteInterval = setInterval(() => {
            // Fade out
            Animated.timing(quoteOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                // Change quote
                const randomQuote = FOOD_QUOTES[Math.floor(Math.random() * FOOD_QUOTES.length)];
                setQuote(randomQuote);
                // Fade in
                Animated.timing(quoteOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            });
        }, 4000);

        return () => clearInterval(quoteInterval);
    }, []);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Loading Icon */}
                    <Animated.View style={[styles.iconContainer, { transform: [{ rotate: spin }] }]}>
                        <MaterialIcons name="restaurant-menu" size={48} color={colors.accent} />
                    </Animated.View>

                    {/* Title */}
                    <Text style={styles.title}>Creating Your Recipe</Text>

                    {/* Loading indicator */}
                    <View style={styles.dotsContainer}>
                        <Animated.View style={[styles.dot, { opacity: dot1Anim }]} />
                        <Animated.View style={[styles.dot, { opacity: dot2Anim }]} />
                        <Animated.View style={[styles.dot, { opacity: dot3Anim }]} />
                    </View>

                    {/* Quote */}
                    <Animated.View style={[styles.quoteContainer, { opacity: quoteOpacity }]}>
                        <MaterialIcons name="format-quote" size={20} color={colors.textMuted} />
                        <Text style={styles.quote}>{quote}</Text>
                    </Animated.View>

                    {/* Subtle hint */}
                    <Text style={styles.hint}>This may take a moment...</Text>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: width * 0.85,
        maxWidth: 400,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 16,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFF5F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 16,
        textAlign: 'center',
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 24,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.accent,
    },
    quoteContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#F8F8F8',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        gap: 8,
    },
    quote: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
        color: colors.textSecondary,
        fontStyle: 'italic',
    },
    hint: {
        fontSize: 13,
        color: colors.textMuted,
        textAlign: 'center',
    },
});
