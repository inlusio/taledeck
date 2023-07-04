const size = 64
const canvas = document.createElement('canvas')
const context = canvas.getContext('2d')

if (context == null) {
  throw new Error('Context not found for InlineHotspotTemplate.')
}

const x = size
const y = size
const radius = size
const startAngle = 0
const endAngle = Math.PI * 2
const whiteStripe = 20
const blackStripe = 6

context.canvas.width = size * 2
context.canvas.height = size * 2

// context.fillStyle = 'blue'
// context.fillRect(0, 0, canvas.width, canvas.height)

context.fillStyle = '#bd210f'
context.beginPath()
context.arc(x, y, radius, startAngle, endAngle)
context.fill()

context.strokeStyle = '#ffffff'
context.lineWidth = whiteStripe
context.beginPath()
context.arc(x, y, radius - whiteStripe / 2, startAngle, endAngle)
context.stroke()

context.strokeStyle = '#000000'
context.lineWidth = blackStripe
context.beginPath()
context.arc(x, y, radius - blackStripe / 2, startAngle, endAngle)
context.stroke()

export default function useInlineHotspotTemplate() {
  return {
    canvas,
  }
}
