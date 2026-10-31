
// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-file

import { defineConfig } from '#q-app/wrappers'

export default defineConfig((/* ctx */) => {
  return {
    // https://v2.quasar.dev/quasar-cli-vite/prefetch-feature
    // preFetch: true,

    // app boot file (/src/boot)
    // --> boot files are part of "main.js"
    boot: ['axios'],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#css
    css: ['app.scss'],

    // https://github.com/quasarframework/quasar/tree/dev/extras
    extras: [
      // 'ionicons-v4',
      // 'mdi-v7',
      // 'fontawesome-v6',
      // 'eva-icons',
      // 'themify',
      // 'line-awesome',
      // 'roboto-font-latin-ext',
      // 'roboto-font',

      'roboto-font',
      'material-icons',
    ],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#build
    build: {
      target: {
        browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
        node: 'node20',
      },

      vueRouterMode: 'hash',

      // vueRouterBase,
      // vueDevtools,
      // vueOptionsAPI: false,

      // rebuildCache: true,

      // publicPath: '/',
      // analyze: true,
      // env: {},
      // rawDefine: {}
      // ignorePublicFolder: true,
      // minify: false,
      // polyfillModulePreload: true,
      // distDir

      // extendViteConf (viteConf) {},
      // viteVuePluginOptions: {},

      vitePlugins: [],
    },

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#devserver
    devServer: {
      // https: true,
      open: true,
    },

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#framework
    framework: {
      config: {},

      // iconSet: 'material-icons',
      // lang: 'en-US',

      // components: [],
      // directives: [],

      // Plugins utilizados pelo sistema
      plugins: [
        'Notify',
        'Dialog',
      ],
    },

    // https://v2.quasar.dev/options/animations
    animations: [],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#sourcefiles
    // sourceFiles: {
    //   rootComponent: 'src/App.vue',
    //   router: 'src/router/index',
    //   store: 'src/store/index',
    //   pwaRegisterServiceWorker: 'src-pwa/register-service-worker',
    //   pwaServiceWorker: 'src-pwa/custom-service-worker',
    //   pwaManifestFile: 'src-pwa/manifest.json',
    //   electronMain: 'src-electron/electron-main',
    //   electronPreload: 'src-electron/electron-preload',
    //   bexManifestFile: 'src-bex/manifest.json',
    // },

    // https://v2.quasar.dev/quasar-cli-vite/developing-ssr/configuring-ssr
    ssr: {
      prodPort: 3000,

      middlewares: [
        'render',
      ],

      // extendPackageJson (json) {},
      // extendSSRWebserverConf (esbuildConf) {},

      // manualStoreSerialization: true,
      // manualStoreHydration: true,

      pwa: false,
      // pwaOfflineHtmlFilename: 'offline.html',
    },

    // https://v2.quasar.dev/quasar-cli-vite/developing-pwa/configuring-pwa
    pwa: {
      workboxMode: 'GenerateSW',

      // swFilename: 'sw.js',
      // manifestFilename: 'manifest.json',
      // extendPWACustomSWConf (esbuildConf) {},
      // extendGenerateSWOptions (cfg) {},
      // extendInjectManifestConf (cfg) {},
    },

    // https://v2.quasar.dev/quasar-cli-vite/developing-cordova-apps/configuring-cordova
    cordova: {
      // noIosLegacyBuildFlag: true,
    },

    // https://v2.quasar.dev/quasar-cli-vite/developing-capacitor-apps/configuring-capacitor
    capacitor: {
      hideSplashscreen: true,
    },

    // https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/configuring-electron
    electron: {
      // extendElectronMainConf (esbuildConf) {},
      // extendElectronPreloadConf (esbuildConf) {},

      // extendPackageJson (json) {},

      preloadScripts: ['electron-preload'],

      inspectPort: 5858,

      // Utiliza Electron Builder para gerar
      // instalador do Windows (.exe).
      bundler: 'builder',

      packager: {
        // Configurações do Electron Packager.
        // Mantido para compatibilidade,
        // caso seja utilizado futuramente.
      },

      builder: {
        // Identificação do aplicativo.
        appId: 'com.tcc.monitoramento.paradas',

        // Nome apresentado no Windows.
        productName: 'Monitoramento de Paradas',

        // Configurações para Windows.
        win: {
          target: 'nsis',
          icon: 'src-electron/icons/icon.ico',
        },

        // Configurações do instalador.
        nsis: {
          // Exibe o assistente de instalação.
          oneClick: false,

          // Permite escolher onde instalar.
          allowToChangeInstallationDirectory: true,

          // Cria atalho na área de trabalho.
          createDesktopShortcut: true,

          // Cria atalho no menu Iniciar.
          createStartMenuShortcut: true,
        },
      },
    },

    // https://v2.quasar.dev/quasar-cli-vite/developing-browser-extensions/configuring-bex
    bex: {
      // extendBexScriptsConf (bexConf) {},
      // extendBexManifestJson (bexManifest) {},

      extraScripts: [],
    },
  }
})
