import { Alert } from 'react-native';

export enum ErrorType {
    NETWORK = 'NETWORK',
    PERMISSION = 'PERMISSION',
    API_QUOTA = 'API_QUOTA',
    PROCESSING = 'PROCESSING',
    VALIDATION = 'VALIDATION',
    UNKNOWN = 'UNKNOWN'
}

export interface AppError {
    type: ErrorType;
    message: string;
    details?: string;
    recoverable: boolean;
}

export class AIProcessingError extends Error {
    public type: ErrorType;
    public recoverable: boolean;
    public details?: string;

    constructor(type: ErrorType, message: string, details?: string, recoverable = true) {
        super(message);
        this.type = type;
        this.recoverable = recoverable;
        this.details = details;
        this.name = 'AIProcessingError';
    }
}

export function handleError(error: any): AppError {
    console.error('Handling error:', error);

    // Handle custom AIProcessingError
    if (error instanceof AIProcessingError) {
        return {
            type: error.type,
            message: error.message,
            details: error.details,
            recoverable: error.recoverable
        };
    }

    // Handle network errors
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
        return {
            type: ErrorType.NETWORK,
            message: 'Network connection failed. Please check your internet connection.',
            recoverable: true
        };
    }

    // Handle Groq API specific errors
    if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
        return {
            type: ErrorType.API_QUOTA,
            message: 'API usage limit reached. Please try again later.',
            recoverable: true
        };
    }

    // Handle permission errors
    if (error.message?.includes('permission') || error.message?.includes('Permission')) {
        return {
            type: ErrorType.PERMISSION,
            message: 'Permission required. Please grant the necessary permissions.',
            recoverable: true
        };
    }

    // Handle processing errors
    if (error.message?.includes('analyze') || error.message?.includes('process')) {
        return {
            type: ErrorType.PROCESSING,
            message: 'Failed to process the input. Please try again.',
            recoverable: true
        };
    }

    // Default unknown error
    return {
        type: ErrorType.UNKNOWN,
        message: 'An unexpected error occurred. Please try again.',
        details: error.message,
        recoverable: true
    };
}

export function showErrorAlert(error: AppError, onRetry?: () => void) {
    // Explicitly type as AlertButton[] to allow onPress
    const buttons: import('react-native').AlertButton[] = [
        { text: 'OK', style: 'default' }
    ];

    if (error.recoverable && onRetry) {
        buttons.unshift({ text: 'Retry', onPress: onRetry, style: 'default' });
    }

    Alert.alert(
        getErrorTitle(error.type),
        error.message,
        buttons
    );
}

function getErrorTitle(type: ErrorType): string {
    switch (type) {
        case ErrorType.NETWORK:
            return 'Connection Error';
        case ErrorType.PERMISSION:
            return 'Permission Required';
        case ErrorType.API_QUOTA:
            return 'Service Temporarily Unavailable';
        case ErrorType.PROCESSING:
            return 'Processing Error';
        case ErrorType.VALIDATION:
            return 'Invalid Input';
        default:
            return 'Error';
    }
}

export async function withErrorHandling<T>(
    operation: () => Promise<T>,
    context: string
): Promise<T | null> {
    try {
        return await operation();
    } catch (error) {
        const appError = handleError(error);
        console.error(`Error in ${context}:`, appError);
        throw new AIProcessingError(
            appError.type,
            appError.message,
            appError.details,
            appError.recoverable
        );
    }
}