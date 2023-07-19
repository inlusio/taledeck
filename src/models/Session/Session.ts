export const sessionMode: XRSessionMode = 'immersive-vr'
export const referenceSpaceType: XRReferenceSpaceType = 'local'
export const sessionOptions: XRSessionInit = {
  optionalFeatures: [],
  requiredFeatures: [referenceSpaceType],
}
