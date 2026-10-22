import {useCallback, useState} from 'react';

/**
 * Step-by-step navigation through a grounding exercise. `done` is true once
 * the last step has been passed; `restart` goes back to the first.
 */
export function useGroundingFlow<T>(steps: readonly T[]) {
  const [index, setIndex] = useState(0);
  const total = steps.length;
  const done = index >= total;

  const next = useCallback(() => setIndex(i => Math.min(i + 1, total)), [total]);
  const previous = useCallback(() => setIndex(i => Math.max(i - 1, 0)), []);
  const restart = useCallback(() => setIndex(0), []);

  return {
    index,
    total,
    step: done ? null : steps[index],
    isFirst: index === 0,
    isLast: index === total - 1,
    done,
    next,
    previous,
    restart,
  };
}
