import { create } from 'zustand';

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: object;
  textStyle?: object;
};

type AlertConfig = {
  title: string;
  message: string;
  buttons?: AlertButton[];
};

interface AlertState {
  visible: boolean;
  config: AlertConfig;
  showAlert: (config: AlertConfig) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  config: {
    title: '',
    message: '',
    buttons: [],
  },
  showAlert: (config) => set({ 
    visible: true, 
    config: {
      ...config,
      buttons: config.buttons || [{ text: 'Aceptar', onPress: () => set({ visible: false }) }]
    }
  }),
  hideAlert: () => set({ visible: false }),
}));
