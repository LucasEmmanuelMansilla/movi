import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../../ui/theme';

type ImageSourceModalHandles = {
  show: () => void;
  hide: () => void;
};

interface ImageSourceModalProps {
  onSelectSource: (source: 'camera' | 'gallery') => void;
  title?: string;
  message?: string;
}

const ImageSourceModal = forwardRef<ImageSourceModalHandles, ImageSourceModalProps>(
  ({ onSelectSource, title = 'Agregar foto', message = '¿Cómo deseas agregar la foto?' }, ref) => {
    const [visible, setVisible] = useState(false);

    useImperativeHandle(ref, () => ({
      show: () => setVisible(true),
      hide: () => setVisible(false),
    }));

    const handleSelect = (source: 'camera' | 'gallery') => {
      setVisible(false);
      onSelectSource(source);
    };

    if (!visible) return null;

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={visible}
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.option}
                onPress={() => handleSelect('camera')}
                activeOpacity={0.7}
              >
                <View style={styles.optionIconContainer}>
                  <Ionicons name="camera" size={32} color={colors.accent} />
                </View>
                <Text style={styles.optionText}>Cámara</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.option}
                onPress={() => handleSelect('gallery')}
                activeOpacity={0.7}
              >
                <View style={styles.optionIconContainer}>
                  <Ionicons name="images" size={32} color={colors.accent} />
                </View>
                <Text style={styles.optionText}>Galería</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: spacing.xl,
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: radii.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.muted,
    marginBottom: spacing.xl,
    textAlign: 'center',
    lineHeight: 22,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionIconContainer: {
    marginBottom: spacing.sm,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  cancelButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.sm,
    alignItems: 'center',
    backgroundColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});

ImageSourceModal.displayName = 'ImageSourceModal';

export default ImageSourceModal;

