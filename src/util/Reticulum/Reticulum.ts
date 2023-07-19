/*! Reticulum - v2.1.2
 * http://skezo.github.io/examples/basic.html
 *
 * Copyright (c) 2015 Skezo;
 * Licensed under the MIT license */
import Fuse from '@/util/Reticulum/Fuse'
import Reticle from '@/util/Reticulum/Reticle'
import type { ReticulumData, ReticulumOptions, ReticulumTarget, UserData } from '@/util/Reticulum/Types'
import type { PerspectiveCamera, XRTargetRaySpace } from 'three'
import { Clock, Color, Frustum, Matrix4, Mesh, MeshBasicMaterial, Object3D, Raycaster, Vector2 } from 'three'

export default class Reticulum {
  private options: ReticulumOptions = {
    proximity: false,
    clickEvents: true,
    lockDistance: false,
  }
  private collisionList: Array<ReticulumTarget> = []
  private intersected?: ReticulumTarget
  private reticleHitOnClickStart: boolean = false

  // Three objects
  private parent = new Object3D()
  private raycaster = new Raycaster()
  private frustum = new Frustum()
  private clock = new Clock(true)
  private screenCenterCoords = new Vector2(0, 0)
  private cameraViewProjectionMatrix = new Matrix4()
  private camera: PerspectiveCamera
  private controllers: Array<XRTargetRaySpace>

  // Library parts
  private reticle: Reticle
  private fuse: Fuse

  private clickStartListener = this.onClickStart.bind(this)
  private clickEndListener = this.onClickEnd.bind(this)
  private vibrate: (pattern: VibratePattern) => boolean

  constructor(ca: PerspectiveCamera, co: Array<XRTargetRaySpace> = [], o: ReticulumOptions = {}) {
    this.camera = ca
    this.controllers = co
    this.options.proximity = o.proximity ?? this.options.proximity
    this.options.lockDistance = o.lockDistance ?? this.options.lockDistance
    this.options.clickEvents = o.clickEvents ?? this.options.clickEvents

    // Vibration
    this.vibrate = navigator.vibrate ? navigator.vibrate.bind(navigator) : () => false

    // Update Raycaster
    if (o.near && o.near >= 0) {
      this.raycaster.near = o.near
    }

    if (o.far && o.far >= 0) {
      this.raycaster.far = o.far
    }

    //Enable click / Tap events
    if (this.options.clickEvents) {
      document.addEventListener('mousedown', this.clickStartListener, false)
      document.addEventListener('mouseup', this.clickEndListener, false)
      document.addEventListener('touchstart', this.clickStartListener, false)
      document.addEventListener('touchend', this.clickEndListener, false)

      this.controllers.forEach((controller) => {
        controller.addEventListener('connected', () => {
          console.log('controller connected')
          controller.addEventListener('selectstart', () => {
            console.log('selectstart test') // not working
          })

          controller.addEventListener('selectend', () => {
            console.log('selectend test') // not working
          })
          controller.addEventListener('selectstart', this.clickStartListener)
          controller.addEventListener('selectend', this.clickEndListener)
        })
      })
    }

    //Initiate Reticle
    this.reticle = new Reticle(this.parent, this.camera, o.reticle)
    this.parent.add(this.reticle.mesh)

    //Initiate Fuse
    this.fuse = new Fuse(this.parent, this.reticle, o.fuse)
    this.parent.add(this.fuse.mesh)

    // Add parent to camera
    this.camera.add(this.parent)
  }

  public add(target: Object3D, o: ReticulumData) {
    const d = target.userData as UserData
    d.reticulum = d.reticulum ?? {}

    // Reticle
    d.reticulum.gazeable = true
    d.reticulum.reticleHoverColor = o.reticleHoverColor ? new Color(o.reticleHoverColor) : undefined

    // Fuse
    d.reticulum.fuseDuration = o.fuseDuration ?? undefined
    d.reticulum.fuseColor = o.fuseColor ?? undefined
    d.reticulum.fuseVisible = o.fuseVisible ?? undefined
    d.reticulum.clickCancelFuse = o.clickCancelFuse ?? undefined
    d.reticulum.onGazeOver = o.onGazeOver ?? undefined
    d.reticulum.onGazeOut = o.onGazeOut ?? undefined
    d.reticulum.onGazeLong = o.onGazeLong ?? undefined
    d.reticulum.onGazeClick = o.onGazeClick ?? undefined

    // Add object to list
    this.collisionList.push(target as ReticulumTarget)
  }

  public remove(target: ReticulumTarget) {
    const d = target.userData as UserData
    const idx = this.collisionList.indexOf(target)
    d.reticulum.gazeable = false

    if (idx > -1) {
      this.collisionList.splice(idx, 1)
    }
  }

  public update() {
    const delta = this.clock.getDelta()

    this.detectHit()
    this.proximity()
    this.reticle.update(delta)
  }

  public destroy() {
    document.removeEventListener('mousedown', this.clickStartListener, false)
    document.removeEventListener('mouseup', this.clickEndListener, false)
    document.removeEventListener('touchstart', this.clickStartListener, false)
    document.removeEventListener('touchend', this.clickEndListener, false)

    this.controllers.forEach((controller) => {
      console.log('controller unregistered')
      controller.removeEventListener('selectstart', this.clickStartListener)
      controller.removeEventListener('selectend', this.clickEndListener)
    })
  }

  private onClickStart() {
    this.reticleHitOnClickStart = this.reticle.hit
  }

  private onClickEnd(e: MouseEvent | TouchEvent | unknown) {
    if (!(e instanceof MouseEvent || e instanceof TouchEvent)) {
      console.log('clickend')
      console.log(this.intersected)
      console.log(this.reticle.hit)
    }

    console.log(e)

    if (this.intersected != null && this.reticle.hit && this.reticleHitOnClickStart) {
      this.gazeClick(this.intersected)

      if (e instanceof MouseEvent || e instanceof TouchEvent) {
        e.preventDefault()
      }
    }

    this.reticleHitOnClickStart = false
  }

  private gazeClick(target: ReticulumTarget) {
    const d = target.userData
    const cancel = d.reticulum.clickCancelFuse ?? this.fuse.options.clickCancel

    // Cancel Fuse
    if (cancel) {
      // Reset the clock
      d.hitTime = this.clock.getElapsedTime()
      //Force gaze to end...this might be to assumptions
      this.fuse.update(this.fuse.options.duration)
    }

    // Does object have an action assigned to it?
    if (d.reticulum.onGazeClick != null) {
      d.reticulum.onGazeClick()
    }
  }

  private gazeOut() {
    this.fuse.out()
    this.reticle.hit = false
    this.reticle.setDepthAndScale()

    if (this.intersected != null) {
      this.intersected.userData.hitTime = 0

      if (this.intersected.userData.reticulum.onGazeOut != null) {
        this.intersected.userData.reticulum.onGazeOut()
      }

      console.log('intersected changed to undefined')
      this.intersected = undefined
    }
  }

  private gazeOver(target: ReticulumTarget) {
    const d = target.userData
    console.log('intersected changed to', target.uuid)
    this.intersected = target

    // Reticle
    this.reticle.currentHoverColor = d.reticulum.reticleHoverColor ?? this.reticle.hoverColor

    // Fuse
    this.fuse.over(d.reticulum.fuseDuration, d.reticulum.fuseVisible)

    if (d.reticulum.fuseColor) {
      this.setColor(this.fuse.mesh, d.reticulum.fuseColor)
    }

    d.hitTime = this.clock.getElapsedTime()

    // Vibrate
    if (this.reticle.options.vibrate) {
      this.vibrate(this.reticle.options.vibrate)
    }

    // Does object have an action assigned to it?
    if (d.reticulum.onGazeOver != null) {
      d.reticulum.onGazeOver()
    }
  }

  private gazeLong(obj: ReticulumTarget) {
    const d = obj.userData
    const elapsed = this.clock.getElapsedTime()
    const gazeTime = elapsed - d.hitTime
    let distance

    // There has to be a better way...
    // Keep updating distance while user is focused on target
    if (this.reticle.active) {
      if (!this.options.lockDistance) {
        this.reticle.worldPosition.setFromMatrixPosition(obj.matrixWorld)
        distance = this.camera.position.distanceTo(this.reticle.worldPosition)

        const { geometry } = obj as unknown as Mesh

        if (geometry != null) {
          distance -= geometry.boundingSphere?.radius ?? 0
        }
      }

      this.reticle.hit = true

      if (!this.options.lockDistance) {
        this.reticle.setDepthAndScale(distance)
      }
    }

    // Fuse
    if (gazeTime >= this.fuse.duration && !this.fuse.active && !this.fuse.timeDone) {
      // Vibrate
      this.fuse.timeDone = true
      this.fuse.mesh.visible = this.fuse.options.visible && !this.fuse.options.hideAfterEnd
      this.vibrate(this.fuse.options.vibrate)

      // Does object have an action assigned to it?
      if (d.reticulum.onGazeLong != null) {
        d.reticulum.onGazeLong()
      }

      // Reset the clock
      d.hitTime = elapsed
    } else {
      this.fuse.update(gazeTime)
    }
  }

  private setColor(obj: Mesh, color: number) {
    const mat = obj.material as MeshBasicMaterial
    mat.color.setHex(color)
  }

  private detectHit() {
    try {
      this.raycaster.setFromCamera(this.screenCenterCoords, this.camera)
    } catch (e) {
      this.raycaster.ray.origin.copy(this.camera.position)
      this.raycaster.ray.direction
        .set(this.screenCenterCoords.x, this.screenCenterCoords.y, 0.5)
        .unproject(this.camera)
        .sub(this.camera.position)
        .normalize()
    }

    // Intersects
    const targets: Array<ReticulumTarget> = this.raycaster
      .intersectObjects<ReticulumTarget>(this.collisionList)
      .map(({ object }) => object)

    // Gaze out when no targets or when intersected is not gazeable anymore
    if (!targets.length || !this.intersected?.userData.reticulum.gazeable) {
      this.gazeOut()
    }

    // Check if what we are hitting is a valid target
    const target = targets.find(({ userData, visible }) => {
      const isGazeable = userData.reticulum.gazeable
      const isVisible = this.reticle.options.ignoreInvisible ? visible : true

      return isGazeable && isVisible
    })

    // There is no valid object
    if (target == null) {
      return
    }

    // Is it the intersected object?
    if (target === this.intersected) {
      // Ok it looks like we are in love
      this.gazeLong(this.intersected)
    } else {
      // If old intersected i.e. not null reset and gazeout
      if (this.intersected != null) {
        this.gazeOut()
      }

      // Update intersected with new object
      this.gazeOver(target)
    }
  }

  private proximity() {
    if (!this.options.proximity) {
      return
    }

    let showReticle = false

    //Use frustum to see if any targetable object is visible
    //http://stackoverflow.com/questions/17624021/determine-if-a-mesh-is-visible-on-the-viewport-according-to-current-camera
    this.camera.updateMatrixWorld()
    this.camera.matrixWorldInverse.copy(this.camera.matrixWorld).invert()

    this.cameraViewProjectionMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse)

    this.frustum.setFromProjectionMatrix(this.cameraViewProjectionMatrix)

    for (let i = 0, l = this.collisionList.length; i < l; i++) {
      const target = this.collisionList[i]

      if (!target.userData.reticulum.gazeable) {
        continue
      }

      if (this.reticle.options.ignoreInvisible && !target.visible) {
        continue
      }

      if (this.frustum.intersectsObject(target)) {
        showReticle = true
        break
      }
    }

    this.reticle.mesh.visible = showReticle
  }
}
