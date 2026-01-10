import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '../../features/chat/types';
import { colors, spacing } from '../../ui/theme';

interface ChatMessageProps {
    message: Message;
    isMine: boolean;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message, isMine }) => {
    return (
        <View style={[
            styles.container,
            isMine ? styles.myMessage : styles.otherMessage
        ]}>
            <Text style={[
                styles.text,
                isMine ? styles.myText : styles.otherText
            ]}>
                {message.content}
            </Text>
            <Text style={[
                styles.time,
                isMine ? styles.myTime : styles.otherTime
            ]}>
                {new Date(message.created_at).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                })}
            </Text>
        </View>
    );
};

export const ChatMessage = memo(ChatMessageComponent);

const styles = StyleSheet.create({
    container: {
        maxWidth: '80%',
        padding: spacing.md,
        borderRadius: 16,
        marginBottom: spacing.sm,
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: colors.primary,
        borderBottomRightRadius: 4,
    },
    otherMessage: {
        alignSelf: 'flex-start',
        backgroundColor: colors.white,
        borderBottomLeftRadius: 4,
    },
    text: {
        fontSize: 16,
    },
    myText: {
        color: '#fff',
    },
    otherText: {
        color: colors.text,
    },
    time: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    myTime: {
        color: 'rgba(255,255,255,0.7)',
    },
    otherTime: {
        color: colors.muted,
    },
});
