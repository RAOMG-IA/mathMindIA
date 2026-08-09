module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    // react-native-reanimated/plugin debe ir el ultimo (requisito de la libreria, usado por
    // NeuralLoader). Reenvia a react-native-worklets/plugin (Reanimated 4.x delega el
    // transform de worklets a ese paquete).
    plugins: ['react-native-reanimated/plugin'],
  }
}
