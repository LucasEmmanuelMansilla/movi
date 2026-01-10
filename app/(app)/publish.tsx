import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { FormField } from '../../src/components/shipments/FormField';
import { ImagePickerSection } from '../../src/components/shipments/ImagePickerSection';
import { ShipmentFormHeader } from '../../src/components/shipments/ShipmentFormHeader';
import { MapPickerModal } from '../../src/components/shipments/MapPickerModal';
import { 
  PriceDisplay, 
  LocationSelector, 
  PublishActionButton 
} from '../../src/components/shipments/PublishComponents';
import CustomAlert from '../../src/components/ui/CustomAlert';
import { usePublishScreenLogic } from '../../src/hooks/shipments/usePublishScreenLogic';
import { colors, spacing } from '../../src/ui/theme';

/**
 * Pantalla de Publicación de Envíos
 * Permite a los usuarios crear nuevos pedidos de envío, calculando el precio 
 * automáticamente y procesando el pago inicial.
 */
export default function PublishScreen() {
  const {
    formData,
    errors,
    loading,
    updateField,
    imagePicker,
    alertRef,
    processingPayment,
    mapVisible,
    setMapVisible,
    mapTarget,
    mapInitialCoords,
    calculatingPrice,
    isFormValid,
    handleImageAdd,
    handleImageRemove,
    handleSelectAddress,
    handleConfirmLocation,
    handleSubmit,
  } = usePublishScreenLogic();

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <ShipmentFormHeader />

      <ImagePickerSection
        images={formData.images}
        onImageAdd={handleImageAdd}
        onImageRemove={handleImageRemove}
        maxImages={imagePicker.maxImages}
      />

      <FormField
        label="Título"
        required
        placeholder="Ej: Envío de documentos urgentes"
        value={formData.title}
        onChangeText={(text) => updateField('title', text)}
        error={errors.title}
        editable={!loading}
      />

      <FormField
        label="Descripción"
        hint="Opcional"
        placeholder="Describe el pedido, dimensiones, peso, etc."
        value={formData.description}
        onChangeText={(text) => updateField('description', text)}
        multiline
        numberOfLines={4}
        editable={!loading}
      />

      <LocationSelector 
        label="Dirección de retiro"
        value={formData.pickup}
        error={errors.pickup}
        onSelectMap={() => handleSelectAddress('pickup')}
        loading={loading}
      />

      <LocationSelector 
        label="Dirección de entrega"
        value={formData.dropoff}
        error={errors.dropoff}
        onSelectMap={() => handleSelectAddress('dropoff')}
        loading={loading}
      />

      <FormField
        label="Peso (en kg)"
        required
        placeholder="Ej: 5.5"
        value={formData.weight}
        onChangeText={(text) => updateField('weight', text.replace(/[^0-9.]/g, ''))}
        error={errors.weight}
        keyboardType="decimal-pad"
        editable={!loading}
      />

      <PriceDisplay 
        calculating={calculatingPrice}
        price={formData.price}
      />

      <PublishActionButton 
        loading={loading}
        processingPayment={processingPayment}
        isValid={isFormValid}
        onPress={handleSubmit}
      />

      <View style={styles.footer} />
      <CustomAlert ref={alertRef} />
      
      <MapPickerModal
        visible={mapVisible}
        initialCoords={mapInitialCoords}
        onClose={() => setMapVisible(false)}
        title={mapTarget === 'pickup' ? 'Selecciona punto de retiro' : 'Selecciona punto de entrega'}
        onConfirm={handleConfirmLocation}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    paddingBottom: spacing.xl,
  },
  footer: {
    height: 20,
  },
});
