"use client";

import React, { useRef, useEffect, useState, createElement, useMemo, useCallback, memo } from "react";
import { Platform } from "react-native";

export enum Tag {
  H1 = "h1",
  H2 = "h2",
  H3 = "h3",
  P = "p",
}

type VaporizeTextCycleProps = {
  texts: string[];
  font?: {
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: number;
  };
  color?: string;
  spread?: number;
  density?: number;
  animation?: {
    vaporizeDuration?: number;
    fadeInDuration?: number;
    waitDuration?: number;
  };
  direction?: "left-to-right" | "right-to-left";
  alignment?: "left" | "center" | "right";
  tag?: Tag;
};

type Particle = {
  x: number;
  y: number;
  originalX: number;
  originalY: number;
  color: string;
  opacity: number;
  originalAlpha: number;
  velocityX: number;
  velocityY: number;
  angle: number;
  speed: number;
  shouldFadeQuickly?: boolean;
};

type TextBoundaries = {
  left: number;
  right: number;
  width: number;
};

declare global {
  interface HTMLCanvasElement {
    textBoundaries?: TextBoundaries;
  }
}

export function VaporizeTextCycle({
  texts = ["Next.js", "React"],
  font = {
    fontFamily: "sans-serif",
    fontSize: "50px",
    fontWeight: 400,
  },
  color = "rgb(255, 255, 255)",
  spread = 5,
  density = 5,
  animation = {
    vaporizeDuration: 2,
    fadeInDuration: 1,
    waitDuration: 0.5,
  },
  direction = "left-to-right",
  alignment = "center",
  tag = Tag.P,
}: VaporizeTextCycleProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  
  // Custom hook integrated for simplicity
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'web' || !wrapperRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0, rootMargin: '50px' }
    );
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  const lastFontRef = useRef<string | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [animationState, setAnimationState] = useState<"static" | "vaporizing" | "fadingIn" | "waiting">("static");
  const vaporizeProgressRef = useRef(0);
  const fadeOpacityRef = useRef(0);
  const [wrapperSize, setWrapperSize] = useState({ width: 0, height: 0 });
  
  const transformValue = (input: number, inputRange: number[], outputRange: number[], clamp = false): number => {
    const [inputMin, inputMax] = inputRange;
    const [outputMin, outputMax] = outputRange;
    const progress = (input - inputMin) / (inputMax - inputMin);
    let result = outputMin + progress * (outputMax - outputMin);
    if (clamp) {
      if (outputMax > outputMin) result = Math.min(Math.max(result, outputMin), outputMax);
      else result = Math.min(Math.max(result, outputMax), outputMin);
    }
    return result;
  };

  const transformedDensity = transformValue(density, [0, 10], [0.3, 1], true);

  // Calculate device pixel ratio
  const globalDpr = useMemo(() => {
    if (typeof window !== "undefined") {
      return window.devicePixelRatio * 1.5 || 1;
    }
    return 1;
  }, []);

  // Memoize static styles
  const wrapperStyle = useMemo(() => ({
    width: "100%",
    height: "100%",
    pointerEvents: "none" as const,
  }), []);

  const canvasStyle = useMemo(() => ({
    minWidth: "30px",
    minHeight: "20px",
    pointerEvents: "none" as const,
  }), []);

  // Memoize animation durations
  const animationDurations = useMemo(() => ({
    VAPORIZE_DURATION: (animation.vaporizeDuration ?? 2) * 1000,
    FADE_IN_DURATION: (animation.fadeInDuration ?? 1) * 1000,
    WAIT_DURATION: (animation.waitDuration ?? 0.5) * 1000,
  }), [animation.vaporizeDuration, animation.fadeInDuration, animation.waitDuration]);

  // Memoize font and spread calculations
  const fontConfig = useMemo(() => {
    const fontSize = parseInt(font.fontSize?.replace("px", "") || "50");
    const VAPORIZE_SPREAD = calculateVaporizeSpread(fontSize);
    const MULTIPLIED_VAPORIZE_SPREAD = VAPORIZE_SPREAD * spread;
    return {
      fontSize,
      VAPORIZE_SPREAD,
      MULTIPLIED_VAPORIZE_SPREAD,
      font: `${font.fontWeight ?? 400} ${fontSize * globalDpr}px ${font.fontFamily}`,
    };
  }, [font.fontSize, font.fontWeight, font.fontFamily, spread, globalDpr]);

  // Particle update logic
  const updateParticlesLocal = useCallback((particles: Particle[], vaporizeX: number, deltaTime: number) => {
    let allParticlesVaporized = true;
    particles.forEach(particle => {
      const shouldVaporize = direction === "left-to-right" ? particle.originalX <= vaporizeX : particle.originalX >= vaporizeX;
      if (shouldVaporize) {
        if (particle.speed === 0) {
          particle.angle = Math.random() * Math.PI * 2;
          particle.speed = (Math.random() * 1 + 0.5) * fontConfig.MULTIPLIED_VAPORIZE_SPREAD;
          particle.velocityX = Math.cos(particle.angle) * particle.speed;
          particle.velocityY = Math.sin(particle.angle) * particle.speed;
          particle.shouldFadeQuickly = Math.random() > transformedDensity;
        }
        if (particle.shouldFadeQuickly) {
          particle.opacity = Math.max(0, particle.opacity - deltaTime);
        } else {
          const dx = particle.originalX - particle.x;
          const dy = particle.originalY - particle.y;
          const distanceFromOrigin = Math.sqrt(dx * dx + dy * dy);
          const dampingFactor = Math.max(0.95, 1 - distanceFromOrigin / (100 * fontConfig.MULTIPLIED_VAPORIZE_SPREAD));
          const randomSpread = fontConfig.MULTIPLIED_VAPORIZE_SPREAD * 3;
          particle.velocityX = (particle.velocityX + (Math.random() - 0.5) * randomSpread + dx * 0.002) * dampingFactor;
          particle.velocityY = (particle.velocityY + (Math.random() - 0.5) * randomSpread + dy * 0.002) * dampingFactor;
          const maxVelocity = fontConfig.MULTIPLIED_VAPORIZE_SPREAD * 2;
          const currentVelocity = Math.sqrt(particle.velocityX * particle.velocityX + particle.velocityY * particle.velocityY);
          if (currentVelocity > maxVelocity) {
            const scale = maxVelocity / currentVelocity;
            particle.velocityX *= scale;
            particle.velocityY *= scale;
          }
          particle.x += particle.velocityX * deltaTime * 20;
          particle.y += particle.velocityY * deltaTime * 10;
          const baseFadeRate = 0.25;
          const durationBasedFadeRate = baseFadeRate * (2000 / animationDurations.VAPORIZE_DURATION);
          particle.opacity = Math.max(0, particle.opacity - deltaTime * durationBasedFadeRate);
        }
        if (particle.opacity > 0.01) allParticlesVaporized = false;
      } else {
        allParticlesVaporized = false;
      }
    });
    return allParticlesVaporized;
  }, [fontConfig.MULTIPLIED_VAPORIZE_SPREAD, animationDurations.VAPORIZE_DURATION, direction, transformedDensity]);

  const renderParticlesLocal = useCallback((ctx: CanvasRenderingContext2D, particles: Particle[]) => {
    ctx.save();
    ctx.scale(globalDpr, globalDpr);
    particles.forEach(particle => {
      if (particle.opacity > 0) {
        const color = particle.color.replace(/[\d.]+\)$/, `${particle.opacity})`);
        ctx.fillStyle = color;
        ctx.fillRect(particle.x / globalDpr, particle.y / globalDpr, 1, 1);
      }
    });
    ctx.restore();
  }, [globalDpr]);

  // Start animation cycle when in view
  useEffect(() => {
    if (isInView) {
      const startAnimationTimeout = setTimeout(() => setAnimationState("vaporizing"), 0);
      return () => clearTimeout(startAnimationTimeout);
    } else {
      setAnimationState("static");
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, [isInView]);

  // Animation loop
  useEffect(() => {
    if (!isInView) return;
    let lastTime = performance.now();
    let frameId: number;
    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx || !particlesRef.current.length) {
        frameId = requestAnimationFrame(animate);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      switch (animationState) {
        case "static": renderParticlesLocal(ctx, particlesRef.current); break;
        case "vaporizing": {
          vaporizeProgressRef.current += deltaTime * 100 / (animationDurations.VAPORIZE_DURATION / 1000);
          const textBoundaries = canvas.textBoundaries;
          if (!textBoundaries) break;
          const progress = Math.min(100, vaporizeProgressRef.current);
          const vaporizeX = direction === "left-to-right"
            ? textBoundaries.left + textBoundaries.width * progress / 100
            : textBoundaries.right - textBoundaries.width * progress / 100;
          const allVaporized = updateParticlesLocal(particlesRef.current, vaporizeX, deltaTime);
          renderParticlesLocal(ctx, particlesRef.current);
          if (vaporizeProgressRef.current >= 100 && allVaporized) {
            setCurrentTextIndex(prevIndex => (prevIndex + 1) % texts.length);
            setAnimationState("fadingIn");
            fadeOpacityRef.current = 0;
          }
          break;
        }
        case "fadingIn": {
          fadeOpacityRef.current += deltaTime * 1000 / animationDurations.FADE_IN_DURATION;
          ctx.save(); ctx.scale(globalDpr, globalDpr);
          particlesRef.current.forEach(particle => {
            particle.x = particle.originalX; particle.y = particle.originalY;
            const opacity = Math.min(fadeOpacityRef.current, 1) * particle.originalAlpha;
            const color = particle.color.replace(/[\d.]+\)$/, `${opacity})`);
            ctx.fillStyle = color; ctx.fillRect(particle.x / globalDpr, particle.y / globalDpr, 1, 1);
          });
          ctx.restore();
          if (fadeOpacityRef.current >= 1) {
            setAnimationState("waiting");
            setTimeout(() => {
              setAnimationState("vaporizing");
              vaporizeProgressRef.current = 0;
              particlesRef.current.forEach(p => {
                p.x = p.originalX; p.y = p.originalY; p.opacity = p.originalAlpha;
                p.speed = 0; p.velocityX = 0; p.velocityY = 0;
              });
            }, animationDurations.WAIT_DURATION);
          }
          break;
        }
        case "waiting": renderParticlesLocal(ctx, particlesRef.current); break;
      }
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [animationState, isInView, texts.length, direction, globalDpr, updateParticlesLocal, renderParticlesLocal, animationDurations]);

  // Main rendering logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !wrapperSize.width || !wrapperSize.height) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width, height } = wrapperSize;
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    canvas.width = Math.floor(width * globalDpr); canvas.height = Math.floor(height * globalDpr);
    const fontSizeNum = parseInt(font.fontSize?.replace("px", "") || "50");
    const fontStr = `${font.fontWeight ?? 400} ${fontSizeNum * globalDpr}px ${font.fontFamily ?? "sans-serif"}`;
    const colorStr = parseColor(color);
    let textX; const textY = canvas.height / 2;
    const currentText = texts[currentTextIndex] || "Next.js";
    if (alignment === "center") textX = canvas.width / 2;
    else if (alignment === "left") textX = 0;
    else textX = canvas.width;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = colorStr; ctx.font = fontStr; ctx.textAlign = alignment; ctx.textBaseline = "middle";
    const metrics = ctx.measureText(currentText);
    const textWidth = metrics.width;
    let textLeft = alignment === "center" ? textX - textWidth / 2 : (alignment === "left" ? textX : textX - textWidth);
    canvas.textBoundaries = { left: textLeft, right: textLeft + textWidth, width: textWidth };
    ctx.fillText(currentText, textX, textY);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const currentDPR = canvas.width / parseInt(canvas.style.width);
    const sampleRate = Math.max(1, Math.round(currentDPR / 3));
    const newParticles = [];
    for (let y = 0; y < canvas.height; y += sampleRate) {
      for (let x = 0; x < canvas.width; x += sampleRate) {
        const index = (y * canvas.width + x) * 4;
        const alpha = data[index + 3];
        if (alpha > 0) {
          const originalAlpha = alpha / 255 * (sampleRate / currentDPR);
          newParticles.push({
            x, y, originalX: x, originalY: y,
            color: `rgba(${data[index]}, ${data[index + 1]}, ${data[index + 2]}, ${originalAlpha})`,
            opacity: originalAlpha, originalAlpha,
            velocityX: 0, velocityY: 0, angle: 0, speed: 0
          });
        }
      }
    }
    particlesRef.current = newParticles;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (font.fontFamily !== lastFontRef.current) {
      lastFontRef.current = font.fontFamily || "sans-serif";
    }
  }, [texts, font, color, alignment, wrapperSize, currentTextIndex, globalDpr, transformedDensity]);

  useEffect(() => {
    const container = wrapperRef.current;
    if (!container) return;
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setWrapperSize({ width, height });
      }
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setWrapperSize({ width: rect.width, height: rect.height });
    }
  }, []);

  if (Platform.OS !== 'web') return null;

  return (
    <div ref={wrapperRef} style={wrapperStyle}>
      <canvas ref={canvasRef} style={canvasStyle} />
      <SeoElement tag={tag} texts={texts} />
    </div>
  );
}

const SeoElement = memo(({ tag = Tag.P, texts }: { tag: Tag, texts: string[] }) => {
  const style = useMemo(() => ({
    position: "absolute" as const, width: "0", height: "0", overflow: "hidden", userSelect: "none" as const, pointerEvents: "none" as const,
  }), []);
  const safeTag = Object.values(Tag).includes(tag) ? tag : "p";
  return createElement(safeTag, { style }, texts?.join(" ") ?? "");
});

const calculateVaporizeSpread = (fontSize: number) => {
  const size = typeof fontSize === "string" ? parseInt(fontSize) : fontSize;
  const points = [{ size: 20, spread: 0.2 }, { size: 50, spread: 0.5 }, { size: 100, spread: 1.5 }];
  if (size <= points[0].size) return points[0].spread;
  if (size >= points[points.length - 1].size) return points[points.length - 1].spread;
  let i = 0; while (i < points.length - 1 && points[i + 1].size < size) i++;
  const p1 = points[i]; const p2 = points[i + 1];
  return p1.spread + (size - p1.size) * (p2.spread - p1.spread) / (p2.size - p1.size);
};

const parseColor = (color: string) => {
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
  if (rgbaMatch) { const [_, r, g, b, a] = rgbaMatch; return `rgba(${r}, ${g}, ${b}, ${a})`; }
  else if (rgbMatch) { const [_, r, g, b] = rgbMatch; return `rgba(${r}, ${g}, ${b}, 1)`; }
  return "rgba(0, 0, 0, 1)";
};

export const IntroComponent = () => {
    return (
        <div style={{ backgroundColor: 'black', height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <VaporizeTextCycle
                texts={["JUICY SHOP", "Fresh", "Pure"]}
                font={{
                    fontFamily: "Calibri",
                    fontSize: "80px",
                    fontWeight: 700
                }}
                color="rgb(230, 126, 34)" // Rich Burnt Orange
                spread={5}
                density={5}
                animation={{
                    vaporizeDuration: 2,
                    fadeInDuration: 1,
                    waitDuration: 0.8
                }}
                direction="left-to-right"
                alignment="center"
                tag={Tag.H1}
                />
        </div>
    )
}
