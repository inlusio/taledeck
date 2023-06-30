import { quat } from 'gl-matrix'
import { computed, ref, watch } from 'vue'
import type { Ref } from 'vue'

const LOOK_SPEED = 0.00025

const lookYaw = ref<number>(0)
const lookPitch = ref<number>(0)
const viewerHeight = ref<number>(0)
const dirty = ref<boolean>(false)

export default function useXrInlineViewerHelper(
  context: Ref<WebGL2RenderingContext | null>,
  baseRefSpace: Ref<XRReferenceSpace | XRBoundedReferenceSpace | undefined>,
) {
  const canvasEl = ref<HTMLCanvasElement | null>(null)
  const resultingRefSpace = ref<XRReferenceSpace | XRBoundedReferenceSpace | undefined>(baseRefSpace.value)
  const refSpace = computed<XRReferenceSpace | XRBoundedReferenceSpace | undefined>(() => {
    if (context.value == null || baseRefSpace.value == null) {
      return undefined
    }

    if (resultingRefSpace.value == null) {
      resultingRefSpace.value = baseRefSpace.value
    }

    if (dirty.value) {
      // Represent the rotational component of the reference space as a quaternion.
      const invOrient = quat.create()
      quat.rotateX(invOrient, invOrient, -lookPitch.value)
      quat.rotateY(invOrient, invOrient, -lookYaw.value)
      let xform = new XRRigidTransform({}, { x: invOrient[0], y: invOrient[1], z: invOrient[2], w: invOrient[3] })
      const tempRefSpace = baseRefSpace.value.getOffsetReferenceSpace(xform)
      xform = new XRRigidTransform({ y: -viewerHeight.value })
      resultingRefSpace.value = tempRefSpace.getOffsetReferenceSpace(xform)

      dirty.value = false
    }

    return resultingRefSpace.value
  })

  watch(
    () => [context.value, baseRefSpace.value],
    (nVal) => {
      if (nVal.every((v) => v != null)) {
        canvasEl.value = context.value!.canvas as HTMLCanvasElement
      }
    },
    { immediate: true },
  )

  watch(
    () => canvasEl.value,
    (nVal) => {
      if (nVal != null) {
        init(nVal)
      }
    },
  )

  const primaryTouch = ref<number | undefined>(undefined)
  const prevTouchX = ref<number | undefined>(undefined)
  const prevTouchY = ref<number | undefined>(undefined)

  const setHeight = (value: number) => {
    if (viewerHeight.value != value) {
      viewerHeight.value = value
    }

    dirty.value = true
  }

  const rotateView = (dx: number, dy: number) => {
    lookYaw.value += dx * LOOK_SPEED
    lookPitch.value += dy * LOOK_SPEED

    if (lookPitch.value < -Math.PI * 0.5) {
      lookPitch.value = -Math.PI * 0.5
    }

    if (lookPitch.value > Math.PI * 0.5) {
      lookPitch.value = Math.PI * 0.5
    }

    dirty.value = true
  }

  const reset = () => {
    lookYaw.value = 0
    lookPitch.value = 0
    resultingRefSpace.value = baseRefSpace.value
    dirty.value = false
  }

  const init = (c: HTMLCanvasElement) => {
    c.style.cursor = 'grab'

    c.addEventListener(
      'mousemove',
      (event) => {
        // Only rotate when the left button is pressed
        if (event.buttons & 1) {
          rotateView(event.movementX, event.movementY)
        }
      },
      { passive: true },
    )

    c.addEventListener(
      'touchstart',
      (event) => {
        if (primaryTouch.value == null) {
          const { identifier, pageX, pageY } = event.changedTouches[0]

          primaryTouch.value = identifier
          prevTouchX.value = pageX
          prevTouchY.value = pageY
        }
      },
      { passive: true },
    )

    c.addEventListener(
      'touchend',
      (event) => {
        for (const touch of event.changedTouches) {
          if (primaryTouch.value == touch.identifier) {
            primaryTouch.value = undefined
            rotateView(touch.pageX - prevTouchX.value!, touch.pageY - prevTouchY.value!)
          }
        }
      },
      { passive: true },
    )

    c.addEventListener(
      'touchcancel',
      (event) => {
        for (const touch of event.changedTouches) {
          if (primaryTouch.value == touch.identifier) {
            primaryTouch.value = undefined
          }
        }
      },
      { passive: true },
    )

    c.addEventListener(
      'touchmove',
      (event) => {
        for (const touch of event.changedTouches) {
          if (primaryTouch.value == touch.identifier) {
            rotateView(touch.pageX - prevTouchX.value!, touch.pageY - prevTouchY.value!)
            prevTouchX.value = touch.pageX
            prevTouchY.value = touch.pageY
          }
        }
      },
      { passive: true },
    )
  }

  return {
    refSpace,
    reset,
    setHeight,
  }
}
