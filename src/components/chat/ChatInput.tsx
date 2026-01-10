import React, { useState } from 'react';
import { 
    View, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../ui/theme';

interface ChatInputProps {
    onSend: (content: string) => Promise<void>;
    sending: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, sending }) => {
    const [content, setContent] = useState('');

    const handleSend = async () => {
        if (!content.trim() || sending) return;

        const messageContent = content.trim();
        setContent('');
        
        try {
            await onSend(messageContent);
        } catch (error) {
            setContent(messageContent); // Restaurar contenido si falla
        }
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="Escribe un mensaje..."
                value={content}
                onChangeText={setContent}
                multiline
                placeholderTextColor={colors.muted}
                maxLength={1000}
                editable={!sending}
            />
            <TouchableOpacity
                style={[
                    styles.sendButton,
                    (!content.trim() || sending) && styles.sendButtonDisabled
                ]}
                onPress={handleSend}
                disabled={!content.trim() || sending}
            >
                {sending ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Ionicons name="send" size={20} color="#fff" />
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: spacing.md,
        backgroundColor: colors.white,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    input: {
        flex: 1,
        backgroundColor: colors.background,
        borderRadius: 20,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        maxHeight: 100,
        marginRight: spacing.sm,
        color: colors.text,
        fontSize: 16,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: colors.muted,
        opacity: 0.6,
    },
});
