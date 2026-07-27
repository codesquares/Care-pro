module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current'
        }
      }
    ],
    [
      '@babel/preset-react',
      {
        runtime: 'automatic'
      }
    ]
  ],
  plugins: [
    // Transform import.meta for Jest
    function() {
      return {
        visitor: {
          MetaProperty(path) {
            if (path.node.meta.name === 'import' && path.node.property.name === 'meta') {
              // babel.config.cjs is only loaded by babel-jest (Vite uses esbuild directly,
              // see vite.config.js), so this always runs under Jest — no need to reference
              // `import.meta` in the replacement itself, which would just reintroduce the
              // syntax error this plugin exists to avoid.
              path.replaceWithSourceString('global.importMeta');
            }
          }
        }
      };
    }
  ]
};