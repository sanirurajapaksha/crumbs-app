import { FirebaseApp, initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
}

const firebaseConfig: FirebaseConfig = {
    apiKey: "AIzaSyBn798PJRXhv1AyI32sIlnqXKEj7j9lnTo",
    authDomain: "crumbs-recipeapp.firebaseapp.com",
    projectId: "crumbs-recipeapp",
    storageBucket: "crumbs-recipeapp.firebasestorage.app",
    messagingSenderId: "71791941949",
    appId: "1:71791941949:web:80c7fe96235522869ecd54",
    measurementId: "G-9N12SC8E82",
};

// Initialize Firebase
export const app: FirebaseApp = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
