import type Reticle from '@/util/Reticulum/Reticle'
import type { FuseOptions } from '@/util/Reticulum/Types'
import { BackSide, BufferAttribute, Mesh, MeshBasicMaterial, Object3D, RingGeometry } from 'three'

export default class Fuse {
  public options: Required<FuseOptions> = {
    color: 0x00fff6,
    innerRadius: 0,
    outerRadius: 0,
    visible: true,
    duration: 2.5,
    vibrate: 100,
    clickCancel: false,
  }

  public active = false
  public timeDone = false
  public duration = this.options.duration
  phiSegments = 3
  thetaSegments = 32
  thetaStart = Math.PI / 2
  parent: Object3D
  public mesh: Mesh

  constructor(p: Object3D, reticle: Reticle, o: FuseOptions = {}) {
    this.options.visible = o.visible ?? this.options.visible
    this.options.duration = o.duration ?? this.options.duration
    this.options.vibrate = o.vibrate ?? this.options.vibrate
    this.options.color = o.color ?? this.options.color
    this.options.innerRadius = o.innerRadius ?? reticle.options.hover.innerRadius!
    this.options.outerRadius = o.outerRadius ?? reticle.options.hover.outerRadius!
    this.options.clickCancel = o.clickCancel ?? this.options.clickCancel

    const geometry = new RingGeometry(
      this.options.innerRadius,
      this.options.outerRadius,
      this.thetaSegments,
      this.phiSegments,
      this.thetaStart,
      Math.PI / 2,
    )

    const material = new MeshBasicMaterial({
      color: this.options.color,
      side: BackSide,
      fog: false,
    })

    // Mesh
    this.mesh = new Mesh(geometry, material)
    this.mesh.visible = this.options.visible
    this.mesh.position.z = 0.0001 // Keep in front of reticle
    this.mesh.rotation.y = 180 * (Math.PI / 180) //Make it turn clockwise

    // Parent
    this.parent = p
  }

  public out() {
    this.active = false
    this.mesh.visible = false
    this.timeDone = false
    this.update(0)
  }

  public over(duration?: number, visible?: boolean) {
    this.duration = duration ?? this.options.duration
    this.active = true
    this.update(0)
    this.mesh.visible = visible ?? this.options.visible
  }

  public update(elapsed: number) {
    if (!this.active || this.timeDone) {
      return
    }

    const gazedTime = elapsed / this.duration
    const thetaLength = gazedTime * (Math.PI * 2)
    const radiusStep = (this.options.outerRadius - this.options.innerRadius) / this.phiSegments

    let count = 0
    let r = this.options.innerRadius

    const index = this.mesh.geometry.getIndex() as BufferAttribute
    const position = this.mesh.geometry.getAttribute('position')

    for (let j = 0; j <= this.phiSegments; j++) {
      for (let i = 0; i <= this.thetaSegments; i++) {
        const segment = this.thetaStart + (i / this.thetaSegments) * thetaLength
        const idx = index.array[count]
        const x = r * Math.cos(segment)
        const y = r * Math.sin(segment)

        position.setXY(idx, x, y)
        count++
      }

      r += radiusStep
    }

    position.needsUpdate = true

    //Disable fuse if reached 100%
    if (gazedTime >= 1) {
      this.active = false
    }
  }
}
