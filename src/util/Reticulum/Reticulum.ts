/*! Reticulum - v2.1.2
 * http://skezo.github.io/examples/basic.html
 *
 * Copyright (c) 2015 Skezo;
 * Licensed under the MIT license */
import Fuse from '@/util/Reticulum/Fuse'
import Reticle from '@/util/Reticulum/Reticle'
import type { ReticulumData, ReticulumOptions, ReticulumTarget, UserData } from '@/util/Reticulum/Types'
import type { PerspectiveCamera } from 'three'
import { Clock, Color, Frustum, Matrix4, Mesh, MeshBasicMaterial, Object3D, Raycaster, Vector2 } from 'three'

export default class Reticulum {
  private INTERSECTED: ReticulumTarget | null = null
  private options: ReticulumOptions = {
    proximity: false,
    clickEvents: true,
    lockDistance: false,
  }
  private collisionList: Array<ReticulumTarget> = []

  private parent = new Object3D()
  private frustum = new Frustum()
  private cameraViewProjectionMatrix = new Matrix4()
  private camera: PerspectiveCamera
  private raycaster: Raycaster
  private vector: Vector2
  private clock: Clock

  private reticle: Reticle
  private fuse: Fuse

  private vibrate: (pattern: VibratePattern) => boolean

  constructor(c: PerspectiveCamera, o: ReticulumOptions = {}) {
    this.camera = c //required
    this.options.proximity = o.proximity ?? this.options.proximity
    this.options.lockDistance = o.lockDistance ?? this.options.lockDistance
    this.options.clickEvents = o.clickEvents ?? this.options.clickEvents

    // Vibration
    this.vibrate = navigator.vibrate ? navigator.vibrate.bind(navigator) : () => false

    // Raycaster Setup
    this.raycaster = new Raycaster()
    this.vector = new Vector2(0, 0)

    // Update Raycaster
    if (o.near && o.near >= 0) {
      this.raycaster.near = o.near
    }

    if (o.far && o.far >= 0) {
      this.raycaster.far = o.far
    }

    //Enable Click / Tap Events
    if (this.options.clickEvents) {
      document.body.addEventListener('click', this.onClick.bind(this), false)
    }

    //Clock Setup
    this.clock = new Clock(true)

    //Initiate Reticle
    this.reticle = new Reticle(this.parent, this.camera, o.reticle)
    this.parent.add(this.reticle.mesh)

    //Initiate Fuse
    this.fuse = new Fuse(this.parent, this.reticle, o.fuse)
    this.parent.add(this.fuse.mesh)

    // Add parent to camera
    this.camera.add(this.parent)
  }

  public add(obj: Object3D, o: ReticulumData) {
    const d = obj.userData as UserData
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
    this.collisionList.push(obj as ReticulumTarget)
  }

  public remove(obj: ReticulumTarget) {
    const idx = this.collisionList.indexOf(obj)

    obj.userData.reticulum.gazeable = false

    if (idx > -1) {
      this.collisionList.splice(idx, 1)
    }
  }

  public update() {
    const delta = this.clock.getDelta()
    this.detectHit()

    // Proximity
    if (this.options.proximity) {
      this.proximity()
    }

    // Animation
    this.reticle.update(delta)
  }

  private onClick(e: MouseEvent) {
    if (this.reticle.hit && this.INTERSECTED) {
      e.preventDefault()
      this.gazeClick(this.INTERSECTED)
    }
  }

  private gazeClick(obj: ReticulumTarget) {
    const reticulum: ReticulumData = obj.userData.reticulum as ReticulumData
    const cancel = reticulum.clickCancelFuse ?? this.fuse.options.clickCancel

    // Cancel Fuse
    if (cancel) {
      // Reset the clock
      obj.userData.hitTime = this.clock.getElapsedTime()
      //Force gaze to end...this might be to assumptions
      this.fuse.update(this.fuse.options.duration)
    }

    // Does object have an action assigned to it?
    if (reticulum.onGazeClick != null) {
      reticulum.onGazeClick()
    }
  }

  private gazeOut(obj: ReticulumTarget) {
    obj.userData.hitTime = 0

    this.fuse.out()

    this.reticle.hit = false
    this.reticle.setDepthAndScale()

    if (obj.userData.reticulum.onGazeOut != null) {
      obj.userData.reticulum.onGazeOut()
    }
  }

  private gazeOver(obj: ReticulumTarget) {
    const data = obj.userData.reticulum

    // Reticle
    this.reticle.currentHoverColor = data.reticleHoverColor ?? this.reticle.hoverColor

    // Fuse
    this.fuse.over(data.fuseDuration, data.fuseVisible)

    if (data.fuseColor) {
      this.setColor(this.fuse.mesh, data.fuseColor)
    }

    obj.userData.hitTime = this.clock.getElapsedTime()

    // Vibrate
    if (this.reticle.options.vibrate) {
      this.vibrate(this.reticle.options.vibrate)
    }

    // Does object have an action assigned to it?
    if (obj.userData.reticulum.onGazeOver != null) {
      obj.userData.reticulum.onGazeOver()
    }
  }

  private gazeLong(obj: ReticulumTarget) {
    let distance
    const elapsed = this.clock.getElapsedTime()
    const gazeTime = elapsed - obj.userData.hitTime

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
      this.fuse.mesh.visible = !this.fuse.options.hideAfterEnd
      this.vibrate(this.fuse.options.vibrate)

      // Does object have an action assigned to it?
      if (obj.userData.reticulum.onGazeLong != null) {
        obj.userData.reticulum.onGazeLong()
      }

      // Reset the clock
      obj.userData.hitTime = elapsed
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
      this.raycaster.setFromCamera(this.vector, this.camera)
    } catch (e) {
      this.raycaster.ray.origin.copy(this.camera.position)
      this.raycaster.ray.direction
        .set(this.vector.x, this.vector.y, 0.5)
        .unproject(this.camera)
        .sub(this.camera.position)
        .normalize()
    }

    //
    const intersects = this.raycaster.intersectObjects<ReticulumTarget>(this.collisionList)
    const intersectsCount = intersects.length

    // Detect
    if (intersectsCount) {
      let newObj

      // Check if what we are hitting can be used
      for (let i = 0, l = intersectsCount; i < l; i++) {
        newObj = intersects[i].object
        // If new object is not gazeable skip it.
        if (!newObj.userData.reticulum.gazeable) {
          if (newObj == this.INTERSECTED) {
            //TO DO: move this else where
            this.gazeOut(this.INTERSECTED)
          }
          newObj = null
          continue
        }
        // If new object is invisible skip it.
        if (this.reticle.options.ignoreInvisible && !newObj.visible) {
          newObj = null
          continue
        }
        // No issues let use this one
        break
      }

      // There is no valid object
      if (newObj == null) {
        return
      }

      // Is it a new object?
      if (this.INTERSECTED != newObj) {
        // If old INTERSECTED i.e. not null reset and gazeout
        if (this.INTERSECTED) {
          this.gazeOut(this.INTERSECTED)
        }

        //Updated INTERSECTED with new object
        this.INTERSECTED = newObj
        //Is the object gazeable?
        //if (INTERSECTED.gazeable) {
        //Yes
        this.gazeOver(this.INTERSECTED)
        //}
      } else {
        //Ok it looks like we are in love
        this.gazeLong(this.INTERSECTED)
      }
    } else {
      // Is the object gazeable?
      if (this.INTERSECTED) {
        // GAZE OUT
        this.gazeOut(this.INTERSECTED)
      }

      this.INTERSECTED = null
    }
  }

  private proximity() {
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
