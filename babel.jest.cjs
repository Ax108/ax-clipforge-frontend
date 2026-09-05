module.exports = {
  presets: [
    ['@babel/preset-env', {targets: {node: 'current'}}],
    ['@babel/preset-typescript', {allowDeclareFields: true}],
    ['@babel/preset-react', {runtime: 'automatic'}],
  ],
  plugins: [
    function viteImportMetaEnv() {
      return {
        visitor: {
          MetaProperty(path) {
            if (
              path.node.meta.name === 'import' &&
              path.node.property.name === 'meta'
            ) {
              path.replaceWithSourceString('{env: {}}');
            }
          },
        },
      };
    },
  ],
};
