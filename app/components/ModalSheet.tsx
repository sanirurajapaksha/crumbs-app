import React from "react";
import { Modal, View, StyleSheet, TouchableOpacity, Text } from "react-native";

interface ModalSheetProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    children?: React.ReactNode;
}
export const ModalSheet: React.FC<ModalSheetProps> = ({ visible, onClose, title, children }) => {
    return (
        <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.close}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    {children}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "flex-end" },
    sheet: { backgroundColor: "#fff", padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: "80%" },
    header: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    title: { flex: 1, fontWeight: "600", fontSize: 16 },
    close: { fontSize: 18 },
});

export default ModalSheet;
