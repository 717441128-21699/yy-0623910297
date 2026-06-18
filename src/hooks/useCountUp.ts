import { useState, useEffect, useRef } from 'react';

export function useCountUp(target: number, duration: number = 1000, startOnMount: boolean = true) {
  const [count, setCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hasAnimatedRef = useRef(false);

  const start = () => {
    if (hasAnimatedRef.current) return;
    setIsAnimating(true);
    startTimeRef.current = null;
  };

  const reset = () => {
    hasAnimatedRef.current = false;
    setCount(0);
    setIsAnimating(false);
    startTimeRef.current = null;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  useEffect(() => {
    if (!isAnimating && startOnMount && !hasAnimatedRef.current) {
      setIsAnimating(true);
    }
  }, [isAnimating, startOnMount]);

  useEffect(() => {
    if (!isAnimating) return;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(easeOutQuart * target);

      setCount(current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(target);
        setIsAnimating(false);
        hasAnimatedRef.current = true;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAnimating, target, duration]);

  return { count, isAnimating, start, reset };
}
