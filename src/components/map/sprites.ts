/*
 * Vorgerenderte Kartensymbole. Canvas-Schatten (shadowBlur) sind teuer: bei Hunderten Objekten und Retina-Auflösung
 * stockte das Zoomen, weil jedes Neuzeichnen alle Schatten neu berechnete. Jedes Symbol wird deshalb pro Zustand und
 * Pixeldichte einmal in ein kleines Canvas gezeichnet und danach nur noch kopiert (drawImage).
 */

const sprites = new Map<string, HTMLCanvasElement>()

/**
 * Zeichnet das Sprite `key` mit Mittelpunkt (x, y) in Gerätepixeln; `draw` erzeugt es beim ersten Mal, mit dem
 * Mittelpunkt (cx, cy) im Sprite. halfWidth/halfHeight in CSS-Pixeln, gross genug für Ring und Schatten.
 * cacheable = false zeichnet direkt (z.B. solange die Schrift eines Badges noch nicht geladen ist).
 */
export function drawSprite(
  context: CanvasRenderingContext2D,
  key: string,
  x: number,
  y: number,
  ratio: number,
  halfWidth: number,
  halfHeight: number,
  draw: (context: CanvasRenderingContext2D, cx: number, cy: number) => void,
  cacheable = true,
) {
  if (!cacheable) {
    draw(context, x, y)
    return
  }
  const cacheKey = `${key}|${ratio}`
  let sprite = sprites.get(cacheKey)
  if (!sprite) {
    sprite = document.createElement('canvas')
    sprite.width = Math.ceil(halfWidth * ratio) * 2
    sprite.height = Math.ceil(halfHeight * ratio) * 2
    const spriteContext = sprite.getContext('2d')
    if (!spriteContext) return draw(context, x, y)
    draw(spriteContext, sprite.width / 2, sprite.height / 2)
    sprites.set(cacheKey, sprite)
  }
  // Auf ganze Gerätepixel runden, sonst wird das Bild beim Kopieren weichgezeichnet
  context.drawImage(sprite, Math.round(x - sprite.width / 2), Math.round(y - sprite.height / 2))
}
