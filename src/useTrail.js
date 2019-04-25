import { useCallback, useRef, useMemo, useEffect } from 'react'
import { callProp, is, usePrev } from './shared/helpers'
import { useSprings } from './useSprings'

/** API
 * const trails = useTrail(number, { ... })
 * const [trails, set] = useTrail(number, () => ({ ... }))
 */

export const useTrail = (length, propsArg) => {
  const hasNewSprings = length !== usePrev(length)
  const isFn = is.fun(propsArg)

  // The `propsArg` coerced into an object
  let props = isFn ? null : propsArg

  // Retain the controllers so we can update them.
  const springsRef = useRef([])
  const springs = springsRef.current
  if (hasNewSprings) springs.length = length

  // The controllers are recreated whenever `length` changes.
  const [values, animate, stop] = useSprings(length, (i, spring) => {
    if (isFn && !props) props = callProp(propsArg) || {}
    springs[i] = spring
    return {
      ...props,
      config: callProp(props.config, i),
      attach: i > 0 && (() => springs[i - 1]),
    }
  })

  /** For imperative updates to the props of all springs in the trail */
  const update = useCallback(
    propsArg =>
      animate((i, spring) => {
        const props = callProp(propsArg, i, spring) || {}
        const parent = springsRef.current[props.reverse ? i + 1 : i - 1]
        return {
          ...props,
          config: callProp(props.config, i),
          attach: !!parent && (() => parent),
        }
      }),
    []
  )

  // Update the animations on re-render when `propsArg` is an object
  // and the controllers were *not* created in the current render.
  useEffect(() => {
    if (!isFn && !hasNewSprings) {
      update(propsArg)
    }
  })

  // Return the update/stop functions when the `propsArg` is a function.
  return isFn ? [values, update, stop] : values
}
