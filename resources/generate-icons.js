// Run with: node resources/generate-icons.js
// Requires: npm install canvas --save-dev
// This generates a simple Business OS icon using Node.js canvas

const { createCanvas, registerFont } = require('canvas')
const fs = require('fs')
const path = require('path')

const sizes = {
  'icon.png': [512, 512],
  'icon.ico': [256, 256],
  'installer-sidebar.bmp': [164, 314]
}

function drawIcon(canvas) {
  const ctx = canvas.getContext('2d')
  const size = canvas.width

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, size, size)
  grad.addColorStop(0, '#2563EB')
  grad.addColorStop(1, '#1D4ED8')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.roundRect(size * 0.1, size * 0.1, size * 0.8, size * 0.8, size * 0.18)
  ctx.fill()

  // B shape
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `bold ${size * 0.5}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('B', size * 0.5, size * 0.52)

  // OS text
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.font = `${size * 0.12}px sans-serif`
  ctx.fillText('OS', size * 0.5, size * 0.82)
}

function drawSidebar(canvas) {
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#1E3A5F'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 28px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Business', canvas.width / 2, 100)
  ctx.fillText('OS', canvas.width / 2, 150)
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = '14px sans-serif'
  ctx.fillText('Setup', canvas.width / 2, 200)
}

async function main() {
  const outDir = __dirname

  for (const [name, [w, h]] of Object.entries(sizes)) {
    const canvas = createCanvas(w, h)
    if (name === 'installer-sidebar.bmp') {
      drawSidebar(canvas)
    } else {
      drawIcon(canvas)
    }
    const ext = path.extname(name)
    const outPath = path.join(outDir, name)
    if (ext === '.bmp') {
      const buffer = canvas.toBuffer('image/bmp')
      fs.writeFileSync(outPath, buffer)
    } else {
      const buffer = canvas.toBuffer('image/png')
      fs.writeFileSync(outPath, buffer)
    }
    console.log(`Generated ${name} (${w}x${h})`)
  }
}

main().catch(console.error)
