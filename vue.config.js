const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  devServer: {
    proxy: {
      "/api/tmdb": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  transpileDependencies: [
    'vuetify'
  ]
})
