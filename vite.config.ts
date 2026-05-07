import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const certDir = process.env.OFFICE_ADDIN_CERT_DIR || path.join(process.env.USERPROFILE || '', '.office-addin-dev-certs')
const keyPath = path.join(certDir, 'localhost.key')
const certPath = path.join(certDir, 'localhost.crt')
const hasCerts = fs.existsSync(keyPath) && fs.existsSync(certPath)

export default defineConfig({
  plugins: [react()],
  server: {
    ...(hasCerts ? {
      https: {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      },
    } : {}),
    port: 3000,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  base: './',
})
