import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker, Region, MapPressEvent } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  visible: boolean;
  initialCoords: { latitude: number; longitude: number };
  onConfirm: (coords: { latitude: number; longitude: number }) => void;
  onClose: () => void;
  title?: string;
};

const DEFAULT_DELTA = { latitudeDelta: 0.02, longitudeDelta: 0.02 };

export function MapPickerModal({ visible, initialCoords, onConfirm, onClose, title }: Props) {
  const [region, setRegion] = useState<Region>({
    ...initialCoords,
    ...DEFAULT_DELTA,
  });
  const [marker, setMarker] = useState<{ latitude: number; longitude: number } | null>(initialCoords);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setRegion({ ...initialCoords, ...DEFAULT_DELTA });
      setMarker(initialCoords);
    }
  }, [visible, initialCoords]);

  const handlePress = (event: MapPressEvent) => {
    setMarker(event.nativeEvent.coordinate);
  };

  const handleConfirm = async () => {
    if (!marker) return;
    setLoading(true);
    try {
      onConfirm(marker);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{title ?? 'Selecciona la ubicación'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#111827" />
            </TouchableOpacity>
          </View>

          <MapView
            style={styles.map}
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={handlePress}
          >
            {marker && (
              <Marker
                coordinate={marker}
                draggable
                onDragEnd={(e) => setMarker(e.nativeEvent.coordinate)}
              />
            )}
          </MapView>

          <TouchableOpacity
            style={[styles.confirmButton, loading && styles.disabled]}
            onPress={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.confirmText}>Confirmar ubicación</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontWeight: '700',
    fontSize: 16,
    color: '#111827',
  },
  map: {
    width: '100%',
    height: 360,
  },
  confirmButton: {
    backgroundColor: '#09c577',
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
});


