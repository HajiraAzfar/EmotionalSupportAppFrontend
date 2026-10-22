import {useEffect, useState} from 'react';
import {AccessibilityInfo} from 'react-native';

// Whether the phone's "remove animations" / "reduce motion" setting is on,
// kept current if it changes while the screen is open.
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(value => alive && setReduced(value))
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      alive = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
