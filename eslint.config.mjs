import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'

const config = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    ignores: ['**/*.old.*', 'extract_keys.js', 'fix_payloads.js', 'inject_*.js', 'patch_*.js'],
  },
]

export default config
