const tsConfigPaths = require('tsconfig-paths')
const tsConfig = require('./tsconfig.json')

tsConfigPaths.register({
  baseUrl: './',
  paths: tsConfig.compilerOptions.paths || {},
})
