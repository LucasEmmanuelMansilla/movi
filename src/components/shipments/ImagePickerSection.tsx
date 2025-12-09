import React, { useRef } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ImageSourceModal from '../ui/ImageSourceModal';

interface ImagePickerSectionProps {
  images: string[];
  onImageAdd: (source: 'camera' | 'gallery') => void;
  onImageRemove: (index: number) => void;
  maxImages?: number;
}

export function ImagePickerSection({
  images,
  onImageAdd,
  onImageRemove,
  maxImages = 5,
}: ImagePickerSectionProps) {
  const modalRef = useRef<{ show: () => void; hide: () => void }>(null);

  const handleAddImage = () => {
    modalRef.current?.show();
  };

  const handleSelectSource = (source: 'camera' | 'gallery') => {
    onImageAdd(source);
  };

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fotos del pedido</Text>
        <Text style={styles.sectionHint}>(Opcional - máximo {maxImages} fotos)</Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.imagesContainer}
          contentContainerStyle={styles.imagesContent}
        >
          {images.map((uri, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => onImageRemove(index)}
              >
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
          
          {images.length < maxImages && (
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={handleAddImage}
            >
              <Ionicons name="camera" size={32} color="#09c577" />
              <Text style={styles.addImageText}>Agregar foto</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
      <ImageSourceModal
        ref={modalRef}
        onSelectSource={handleSelectSource}
        title="Agregar foto"
        message="¿Cómo deseas agregar la foto?"
      />
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#053959',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  imagesContainer: {
    marginTop: 8,
  },
  imagesContent: {
    paddingRight: 16,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  removeImageButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'white',
    borderRadius: 12,
    zIndex: 1000,
  },
  addImageButton: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#09c577',
    borderStyle: 'dashed',
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addImageText: {
    marginTop: 8,
    fontSize: 12,
    color: '#09c577',
    fontWeight: '600',
  },
});

