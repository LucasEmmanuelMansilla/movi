import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type ButtonProps = {
  text: string;
  onPress?: () => void;
  style?: object;
  textStyle?: object;
};

type AlertConfig = {
  title: string;
  message: string;
  buttons?: ButtonProps[];
};

type CustomAlertProps = {
  visible?: boolean;
  onClose?: () => void;
  config?: AlertConfig;
};

type CustomAlertHandles = {
  show: (config: AlertConfig) => void;
  hide: () => void;
};

const CustomAlert = forwardRef<CustomAlertHandles, CustomAlertProps>(({ visible: propsVisible, onClose: propsOnClose, config: propsConfig }, ref) => {
  const [internalVisible, setInternalVisible] = useState(false);
  const [internalConfig, setInternalConfig] = useState<AlertConfig>({
    title: '',
    message: '',
    buttons: [],
  });

  const isControlled = propsVisible !== undefined;
  const visible = isControlled ? propsVisible : internalVisible;
  const config = isControlled ? (propsConfig || internalConfig) : internalConfig;

  useImperativeHandle(ref, () => ({
    show: (alertConfig: AlertConfig) => {
      setInternalConfig({
        title: alertConfig.title,
        message: alertConfig.message,
        buttons: alertConfig.buttons || [
          { text: 'Aceptar', onPress: () => setInternalVisible(false) },
        ],
      });
      setInternalVisible(true);
    },
    hide: () => setInternalVisible(false),
  }));

  if (!visible) return null;

  const handleClose = () => {
    if (isControlled) {
      propsOnClose?.();
    } else {
      setInternalVisible(false);
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.message}>{config.message}</Text>
          <View style={styles.buttonsContainer}>
            {config.buttons?.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.button, button.style]}
                onPress={() => {
                  button.onPress?.();
                  if (button.text !== 'Cancelar' && !button.text.includes('Reenviar')) {
                    handleClose();
                  }
                }}
              >
                <Text style={[styles.buttonText, button.textStyle]}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 24,
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#053959',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    backgroundColor: '#09c577',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});

export default CustomAlert;