import React from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useChat } from '../../../src/hooks/chat/useChat';
import { ChatMessage } from '../../../src/components/chat/ChatMessage';
import { ChatInput } from '../../../src/components/chat/ChatInput';
import { colors, spacing } from '../../../src/ui/theme';

export default function ChatScreen() {
    const { shipmentId } = useLocalSearchParams<{ shipmentId: string }>();
    const headerHeight = useHeaderHeight();
    const insets = useSafeAreaInsets();
    const { 
        messages, 
        loading, 
        sending, 
        currentUserId, 
        flatListRef, 
        sendMessage 
    } = useChat(shipmentId);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <Stack.Screen
                options={{
                    title: 'Chat de Envío',
                    headerBackTitle: 'Atrás',
                }}
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                style={styles.keyboardView}
                // Compensa header + safe-area para evitar que el teclado tape el input (especialmente en Android físico)
                keyboardVerticalOffset={Math.max(0, headerHeight + insets.top)}
            >
                <View style={styles.container}>
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <ChatMessage 
                                message={item} 
                                isMine={item.sender_id === currentUserId} 
                            />
                        )}
                        contentContainerStyle={styles.listContent}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        keyboardDismissMode="on-drag"
                        keyboardShouldPersistTaps="handled"
                    />

                    <ChatInput 
                        onSend={sendMessage} 
                        sending={sending} 
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    listContent: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
    },
});
