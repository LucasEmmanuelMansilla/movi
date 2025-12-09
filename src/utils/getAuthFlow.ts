import Constants from "expo-constants";

export const getAuthFlow = () => {
  const isDev = __DEV__ || Constants.executionEnvironment === "storeClient";

  // En desarrollo → implicit
  if (isDev) return "pkce";

  // En release → pkce
  return "implicit";
};