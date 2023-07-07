import type { ReticleAttributes, ReticleOptions } from '@/util/Reticulum/Types'
import type { PerspectiveCamera } from 'three'
import { Color, Mesh, MeshBasicMaterial, Object3D, RingGeometry, Vector3 } from 'three'
import { clampBottom } from '@/util/Reticulum/Utils'

export default class Reticle {
  public options: Required<ReticleOptions> = {
    color: 0x00fff6,
    innerRadius: 0.0004,
    outerRadius: 0.003,
    visible: true,
    vibrate: 50,
    speed: 5,
    restPoint: NaN,
    ignoreInvisible: true,
    hover: {
      color: 0x00fff6,
      innerRadius: 0.03,
      outerRadius: 0.036,
    },
  }

  public active = false
  public hit = false
  speed = 0
  public worldPosition = new Vector3()
  currentBaseColor: Color
  public currentHoverColor: Color
  baseColor: Color
  public hoverColor: Color
  public mesh: Mesh

  parent: Object3D
  camera: PerspectiveCamera

  constructor(p: Object3D, c: PerspectiveCamera, o: ReticleOptions = {}) {
    this.active = true
    this.options.color = o.color ?? this.options.color
    this.options.innerRadius = o.innerRadius ?? this.options.innerRadius
    this.options.outerRadius = o.outerRadius ?? this.options.outerRadius
    this.options.visible = o.visible ?? this.options.visible
    this.options.vibrate = o?.vibrate ?? this.options.vibrate
    this.options.speed = o?.speed ?? this.options.speed
    this.options.restPoint = o.restPoint ?? c.far

    this.options.ignoreInvisible = o.ignoreInvisible ?? this.options.ignoreInvisible
    this.options.hover.color = o.hover?.color ?? this.options.hover.color
    this.options.hover.innerRadius = o.hover?.innerRadius ?? this.options.hover.innerRadius
    this.options.hover.outerRadius = o.hover?.outerRadius ?? this.options.hover.outerRadius

    this.baseColor = new Color(this.options.color)
    this.hoverColor = new Color(this.options.hover.color)
    this.currentBaseColor = this.baseColor.clone()
    this.currentHoverColor = this.hoverColor.clone()

    this.parent = p
    this.camera = c

    const base: ReticleAttributes = {
      color: this.options.color,
      innerRadius: this.options.innerRadius,
      outerRadius: this.options.outerRadius,
    }
    const hover = this.options.hover

    // Geometry
    const geoBase = new RingGeometry(base.innerRadius, base.outerRadius, 32, 3, 0, Math.PI * 2)
    const geoHover = new RingGeometry(hover.innerRadius, hover.outerRadius, 32, 3, 0, Math.PI * 2)

    // Mesh
    this.mesh = new Mesh(
      geoBase,
      new MeshBasicMaterial({
        color: this.baseColor,
        fog: false,
        transparent: false,
      }),
    )

    // Add Morph Targets for scale animation
    this.mesh.visible = this.options.visible
    this.mesh.geometry.morphAttributes.position = []
    this.mesh.geometry.morphAttributes.position[0] = geoHover.getAttribute('position')

    this.setDepthAndScale()
  }

  // Sets the depth and scale of the reticle - reduces eyestrain and depth issues
  public setDepthAndScale(depth?: number) {
    const z = Math.abs(depth ?? this.options.restPoint)

    // Force reticle to appear the same size - scale
    // http://answers.unity3d.com/questions/419342/make-gameobject-size-always-be-the-same.html
    const scale = Math.abs(this.camera.position.z - z) - Math.abs(this.camera.position.z)

    //Set Depth
    this.parent.position.x = 0
    this.parent.position.y = 0
    this.parent.position.z = clampBottom(z, this.camera.near + 0.1) * -1

    //Set Scale
    this.parent.scale.set(scale, scale, scale)
  }

  public update(delta: number) {
    // If not active
    if (!this.active) {
      return
    }

    const acceleration = delta * this.options.speed

    if (this.hit) {
      this.speed += acceleration
      this.speed = Math.ceil(Math.min(this.speed, 1) * 1000) / 1000
    } else {
      this.speed -= acceleration
      this.speed = Math.floor(Math.max(this.speed, 0) * 1000) / 1000
    }
    // Morph
    this.mesh.morphTargetInfluences = this.mesh.morphTargetInfluences ?? []
    this.mesh.morphTargetInfluences[0] = this.speed

    // Set Color
    const material = this.mesh.material as MeshBasicMaterial
    this.currentBaseColor = this.baseColor.clone()
    material.color = this.currentBaseColor.lerp(this.currentHoverColor, this.speed)
  }
}
