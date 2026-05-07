// Detect whether the device's primary pointer is touch — i.e. a
// phone or a tablet without a paired mouse. Hybrid devices that
// have a touchscreen plus a mouse (e.g. Surface, iPad with trackpad)
// report `pointer: fine` and stay on the desktop path.

export function isTouchDevice(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches
  )
}
