import sharp from 'sharp'
import fs from 'fs-extra'
import fetch from 'node-fetch'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function generateImage(tokenAddress: string): Promise<void> {
  try {
    const distPath = path.resolve(__dirname, '../dist/pool-images')
    const srcPath = path.resolve(__dirname, '../src/')
    const fileName = `${tokenAddress}.jpg`
    const ogImagePath = path.join(distPath, fileName)
    const templatePath = path.resolve(srcPath, './template.jpg')
    const overlayImagePath = path.resolve(
      __dirname,
      '../dist/pool-images',
      'image.png'
    )

    await fs.ensureDir(distPath)
    await fs.ensureDir(srcPath)

    if (!(await fs.pathExists(ogImagePath))) {
      const overlayImageUrl = `https://storage.googleapis.com/mrgn-public/mrgn-trade-token-icons/${tokenAddress}.png`
      const overlayImageRes = await fetch(overlayImageUrl)

      if (!overlayImageRes.ok) {
        throw new Error(`Failed to fetch overlay image from ${overlayImageUrl}`)
      }

      const overlayImageBuffer = Buffer.from(
        await overlayImageRes.arrayBuffer()
      )
      await fs.writeFile(overlayImagePath, overlayImageBuffer)

      const overlaySize = 120

      const resizedOverlay = await sharp(overlayImageBuffer)
        .resize(overlaySize, overlaySize)
        .toBuffer()

      const radius = overlaySize / 2
      const mask = Buffer.from(
        `<svg><circle cx="${radius}" cy="${radius}" r="${radius}" /></svg>`
      )

      const roundedOverlay = await sharp(resizedOverlay)
        .composite([{ input: mask, blend: 'dest-in' }])
        .toBuffer()

      const circleCenterX = 600
      const circleCenterY = 210

      const left = circleCenterX - overlaySize / 2
      const top = circleCenterY - overlaySize / 2

      await sharp(templatePath)
        .composite([{ input: roundedOverlay, top, left }])
        .toFile(ogImagePath)

      await fs.remove(overlayImagePath)
    }

    console.log(`Generated image at ${ogImagePath}`)
  } catch (error) {
    console.error('Failed to generate image:', error)
  }
}

async function main() {
  const args = process.argv.slice(2)
  if (args.length !== 1) {
    console.error('Usage: ts-node src/generate-image.ts <tokenAddress>')
    process.exit(1)
  }

  const tokenAddress = args[0]
  await generateImage(tokenAddress)
}

main()
