import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { KinomaLogo } from '../ui/KinomaLogo';
import './panda-intro.css';
import introAudioUrl from '../../../assets/reelaudio-52430_VbuEeMF7.mp3';

const INTRO_DURATION = 9000;
const FOG_TRANSITION = 1800;
const INTRO_SESSION_KEY = 'panda_intro_seen';
const FOG_PARTICLES = 2200;

function createParticles(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    x: ((index * 73.37 + 17) % 100) - 50,
    y: ((index * 41.91 + 29) % 100) - 50,
    z: -520 + ((index * 97.13 + 7) % 100) * 10.4,
    size: 1 + (index % 7) * 0.55,
    delay: -((index * 0.043) % 6),
    duration: 5.2 + (index % 9) * 0.62,
    driftX: ((index * 19) % 31) - 15,
    driftY: ((index * 23) % 25) - 12,
    driftZ: 80 + (index % 13) * 24,
    opacity: 0.12 + (index % 8) * 0.035,
  }));
}

function hasSeenIntroThisSession() {
  try {
    return window.sessionStorage.getItem(INTRO_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function markIntroSeen() {
  try {
    window.sessionStorage.setItem(INTRO_SESSION_KEY, '1');
  } catch {
    // If storage is unavailable, the intro still plays normally.
  }
}

export function PandaIntro() {
  const [leaving, setLeaving] = useState(false);
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return true;
    return !hasSeenIntroThisSession();
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const finishTimerRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const particles = useMemo(() => createParticles(420), []);
  const fogCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!visible || !fogCanvasRef.current) return;
    const canvas = fogCanvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 1, 2400);
    camera.position.z = 720;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(FOG_PARTICLES * 3);
    const sizes = new Float32Array(FOG_PARTICLES);
    const phases = new Float32Array(FOG_PARTICLES);
    const drift = new Float32Array(FOG_PARTICLES);
    for (let i = 0; i < FOG_PARTICLES; i++) {
      const radius = Math.pow(Math.random(), .72) * 900;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - .5) * 980;
      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = (Math.random() - .5) * 1500;
      sizes[i] = 55 + Math.random() * 170;
      phases[i] = Math.random() * Math.PI * 2;
      drift[i] = .35 + Math.random() * .9;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aDrift', new THREE.BufferAttribute(drift, 1));

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uDissipate: { value: 0 },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uReveal;
        uniform float uDissipate;
        attribute float aSize;
        attribute float aPhase;
        attribute float aDrift;
        varying float vDepth;
        varying float vDissipate;
        void main() {
          vec3 p = position;
          float t = uTime * aDrift;
          p.x += sin(t * .42 + aPhase) * 105.0 + sin(t * .17 + aPhase * 2.0) * 70.0;
          p.y += cos(t * .31 + aPhase) * 85.0 + sin(t * .11 + aPhase) * 45.0;
          p.z += sin(t * .23 + aPhase) * 120.0;
          float spread = 1.0 + uDissipate * 3.8;
          p.xy *= spread;
          p.z += uDissipate * 850.0;
          p *= mix(.18, 1.0, smoothstep(0.0, 1.0, uReveal));
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = aSize * (560.0 / max(160.0, -mvPosition.z));
          vDepth = clamp(1.0 - (-mvPosition.z / 1900.0), 0.0, 1.0);
          vDissipate = uDissipate;
        }
      `,
      fragmentShader: `
        varying float vDepth;
        varying float vDissipate;
        void main() {
          vec2 uv = gl_PointCoord - .5;
          float d = length(uv);
          float soft = smoothstep(.5, .03, d);
          float inner = smoothstep(.38, 0.0, d);
          float alpha = soft * (.055 + inner * .16) * (1.0 - vDissipate * .92);
          vec3 warm = mix(vec3(.31,.25,.22), vec3(.88,.82,.76), vDepth * .72);
          gl_FragColor = vec4(warm, alpha);
        }
      `,
    });

    const fog = new THREE.Points(geometry, material);
    fog.frustumCulled = false;
    scene.add(fog);

    let frame = 0;
    const started = performance.now();
    const resize = () => {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', resize);

    const animate = (now: number) => {
      const elapsed = (now - started) / 1000;
      material.uniforms.uTime.value = elapsed;
      material.uniforms.uReveal.value = Math.min(1, elapsed / 5);
      const leavingStarted = elapsed - (INTRO_DURATION / 1000);
      material.uniforms.uDissipate.value = leavingStarted > 0 ? Math.min(1, leavingStarted / (FOG_TRANSITION / 1000)) : 0;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [visible]);

  useEffect(() => {
    if (typeof window === 'undefined' || !visible) return;
    const audio = audioRef.current;
    let cancelled = false;

    const startAudio = async () => {
      if (!audio || cancelled || !audio.paused) return;
      try { audio.currentTime = 0; await audio.play(); } catch {}
    };

    const retryAudio = () => {
      void startAudio();
      window.removeEventListener('pointerdown', retryAudio);
      window.removeEventListener('keydown', retryAudio);
    };

    void startAudio();
    const begin = window.setTimeout(startAudio, 120);
    window.addEventListener('pointerdown', retryAudio, { once: true, passive: true });
    window.addEventListener('keydown', retryAudio, { once: true });

    finishTimerRef.current = window.setTimeout(() => {
      if (cancelled) return;
      setLeaving(true);
      transitionTimerRef.current = window.setTimeout(() => {
        if (cancelled) return;
        markIntroSeen();
        setVisible(false);
        window.dispatchEvent(new CustomEvent('panda_intro_complete'));
      }, FOG_TRANSITION);
    }, INTRO_DURATION);

    return () => {
      cancelled = true;
      window.clearTimeout(begin);
      if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
      if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
      window.removeEventListener('pointerdown', retryAudio);
      window.removeEventListener('keydown', retryAudio);
      audio?.pause();
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className={"panda-intro " + (leaving ? 'is-leaving' : '')} role="presentation" aria-hidden="true">
      <audio ref={audioRef} src={introAudioUrl} preload="auto" autoPlay playsInline />
      <div className="panda-intro__backdrop" />
      <canvas ref={fogCanvasRef} className="panda-intro__webgl-fog" aria-hidden="true" />
      <div className="panda-intro__volumetric panda-intro__volumetric--back" />
      <div className="panda-intro__volumetric panda-intro__volumetric--mid" />
      <div className="panda-intro__fog panda-intro__fog--back" />
      <div className="panda-intro__fog panda-intro__fog--mid" />
      <div className="panda-intro__depth">
        {particles.map((particle) => (
          <i key={particle.id} style={{
            '--x': particle.x + 'vw', '--y': particle.y + 'vh', '--z': particle.z + 'px',
            '--size': particle.size + 'px', '--delay': particle.delay + 's', '--duration': particle.duration + 's',
            '--dx': particle.driftX + 'vw', '--dy': particle.driftY + 'vh', '--dz': particle.driftZ + 'px', '--opacity': particle.opacity,
          } as React.CSSProperties} />
        ))}
      </div>
      <div className="panda-intro__mist-field"><span /><span /><span /><span /><span /><span /><span /><span /></div>
      <div className="panda-intro__mark">
        <div className="panda-intro__halo" />
        <div className="panda-intro__logo"><KinomaLogo size="lg" variant="mark" /></div>
        <span className="panda-intro__wordmark" aria-label="PANDA.FUN">
          <span className="panda-intro__typed">PANDA.FUN</span>
        </span>
      </div>
      <div className="panda-intro__fog panda-intro__fog--front" />
      <div className="panda-intro__rush" />
      <div className="panda-intro__grain" />
    </div>
  );
}
