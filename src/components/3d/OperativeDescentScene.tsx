import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface OperativeDescentSceneProps {
  phase: 'boot' | 'descent' | 'crystals' | 'complete';
  onLandingImpact?: () => void;
  onCrystalsAssembled?: () => void;
}

export const OperativeDescentScene: React.FC<OperativeDescentSceneProps> = ({
  phase,
  onLandingImpact,
  onCrystalsAssembled,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const landingTriggeredRef = useRef(false);
  const crystalsTriggeredRef = useRef(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.045);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 4, 11);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 2.5);
    dirLight.position.set(5, 12, 7);
    scene.add(dirLight);

    const rimLight = new THREE.PointLight(0x06b6d4, 4, 15);
    rimLight.position.set(-4, 3, -4);
    scene.add(rimLight);

    const groundPulseLight = new THREE.PointLight(0x00f0ff, 0, 10);
    groundPulseLight.position.set(0, 0.2, 0);
    scene.add(groundPulseLight);

    // 1. Grid & Floor
    const gridHelper = new THREE.GridHelper(30, 30, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // Shockwave Ring Mesh
    const shockwaveGeo = new THREE.RingGeometry(0.1, 0.4, 64);
    shockwaveGeo.rotateX(-Math.PI / 2);
    const shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const shockwaveMesh = new THREE.Mesh(shockwaveGeo, shockwaveMat);
    shockwaveMesh.position.y = 0.02;
    scene.add(shockwaveMesh);

    // Secondary Shockwave
    const shockwave2Mat = shockwaveMat.clone();
    shockwave2Mat.color.setHex(0x00f0ff);
    const shockwave2Mesh = new THREE.Mesh(shockwaveGeo.clone(), shockwave2Mat);
    shockwave2Mesh.position.y = 0.03;
    scene.add(shockwave2Mesh);

    // 2. Futuristic Operative Figure (Original Cyber Operative)
    const operativeGroup = new THREE.Group();
    operativeGroup.position.set(0, 14, 0); // starts high up
    scene.add(operativeGroup);

    // Materials
    const armorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.85,
    });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const crystalArmorMat = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      roughness: 0.1,
      metalness: 0.95,
      transparent: true,
      opacity: 0.9,
    });

    // Operative Torso in crouched superhero posture
    const torsoGeo = new THREE.BoxGeometry(0.7, 0.9, 0.5);
    const torso = new THREE.Mesh(torsoGeo, armorMat);
    torso.position.set(0, 0.85, 0);
    torso.rotation.x = 0.45; // leaning forward
    operativeGroup.add(torso);

    // Glowing chest reactor
    const coreGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16);
    coreGeo.rotateX(Math.PI / 2);
    const coreMesh = new THREE.Mesh(coreGeo, glowMat);
    coreMesh.position.set(0, 0.95, 0.26);
    operativeGroup.add(coreMesh);

    // Head / Futuristic Helmet
    const headGeo = new THREE.BoxGeometry(0.42, 0.45, 0.45);
    const head = new THREE.Mesh(headGeo, armorMat);
    head.position.set(0, 1.45, 0.2);
    head.rotation.x = -0.2;
    operativeGroup.add(head);

    // Visor HUD line
    const visorGeo = new THREE.BoxGeometry(0.38, 0.08, 0.1);
    const visor = new THREE.Mesh(visorGeo, glowMat);
    visor.position.set(0, 1.45, 0.42);
    operativeGroup.add(visor);

    // Shoulders
    const shoulderL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.35), armorMat);
    shoulderL.position.set(-0.5, 1.15, 0.1);
    operativeGroup.add(shoulderL);

    const shoulderR = shoulderL.clone();
    shoulderR.position.x = 0.5;
    operativeGroup.add(shoulderR);

    // Left Arm (Planted Fist onto ground in superhero landing pose)
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.9), armorMat);
    armL.position.set(-0.45, 0.5, 0.35);
    armL.rotation.set(0.6, 0, 0.3);
    operativeGroup.add(armL);

    const fistL = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), crystalArmorMat);
    fistL.position.set(-0.35, 0.08, 0.55); // touching floor
    operativeGroup.add(fistL);

    // Right Arm (Dramatically back/stabilizing)
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.85), armorMat);
    armR.position.set(0.45, 0.6, -0.2);
    armR.rotation.set(-0.7, 0.2, -0.5);
    operativeGroup.add(armR);

    // Left Leg (Crouched tight knee)
    const thighL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.8), armorMat);
    thighL.position.set(-0.35, 0.6, 0.15);
    thighL.rotation.set(-0.9, 0, 0.2);
    operativeGroup.add(thighL);

    const shinL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.8), armorMat);
    shinL.position.set(-0.35, 0.2, 0.3);
    shinL.rotation.set(1.4, 0, 0);
    operativeGroup.add(shinL);

    // Right Leg (Stretched back support leg)
    const thighR = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.9), armorMat);
    thighR.position.set(0.35, 0.45, -0.4);
    thighR.rotation.set(0.8, 0, -0.3);
    operativeGroup.add(thighR);

    const shinR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.9), armorMat);
    shinR.position.set(0.5, 0.15, -0.85);
    shinR.rotation.set(-0.3, 0, -0.3);
    operativeGroup.add(shinR);

    // 3. Thousands of Nano-Crystals Particle System
    const crystalCount = 1800;
    const crystalGeo = new THREE.OctahedronGeometry(0.06, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.85,
    });

    const crystalInstanced = new THREE.InstancedMesh(crystalGeo, crystalMat, crystalCount);
    crystalInstanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(crystalInstanced);

    // Initial Particle Physics Data
    const dummy = new THREE.Object3D();
    const particleData: Array<{
      pos: THREE.Vector3;
      vel: THREE.Vector3;
      rot: THREE.Vector3;
      rotSpeed: THREE.Vector3;
      scale: number;
      targetOrbit: number;
      angle: number;
      speed: number;
      height: number;
    }> = [];

    for (let i = 0; i < crystalCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.05 + Math.random() * 0.18;
      const radius = 0.2 + Math.random() * 0.5;

      particleData.push({
        pos: new THREE.Vector3(Math.cos(angle) * radius, 0.1, Math.sin(angle) * radius),
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          Math.random() * 6 + 1,
          (Math.random() - 0.5) * 8
        ),
        rot: new THREE.Vector3(Math.random() * Math.PI, Math.random() * Math.PI, 0),
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1
        ),
        scale: 0.4 + Math.random() * 0.9,
        targetOrbit: 0.6 + Math.random() * 1.8,
        angle: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.04,
        height: 0.2 + Math.random() * 1.8,
      });

      dummy.position.copy(particleData[i].pos);
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      crystalInstanced.setMatrixAt(i, dummy.matrix);
    }
    crystalInstanced.instanceMatrix.needsUpdate = true;

    // Atmospheric Floating Dust Particles
    const dustCount = 350;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i += 3) {
      dustPositions[i] = (Math.random() - 0.5) * 16;
      dustPositions[i + 1] = Math.random() * 8;
      dustPositions[i + 2] = (Math.random() - 0.5) * 16;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.04,
      transparent: true,
      opacity: 0.4,
    });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    scene.add(dustPoints);

    // Animation Loop State
    let descentVelocity = 0;
    let cameraShake = 0;
    let shockwaveRadius = 0;
    let shockwave2Radius = 0;
    let crystalBurstTimer = 0;
    let clock = new THREE.Clock();

    let reqId: number;

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const currentPhase = phaseRef.current;

      // 1. DESCENT PHASE
      if (currentPhase === 'descent' || currentPhase === 'crystals' || currentPhase === 'complete') {
        if (operativeGroup.position.y > 0) {
          descentVelocity += 22 * delta; // rapid gravity descent
          operativeGroup.position.y -= descentVelocity * delta;

          if (operativeGroup.position.y <= 0) {
            operativeGroup.position.y = 0;
            cameraShake = 0.45;
            shockwaveRadius = 0.3;
            groundPulseLight.intensity = 12;

            if (!landingTriggeredRef.current) {
              landingTriggeredRef.current = true;
              if (onLandingImpact) onLandingImpact();
            }
          }
        }
      }

      // Camera Shake dampening
      if (cameraShake > 0.001) {
        camera.position.x = (Math.random() - 0.5) * cameraShake * 1.5;
        camera.position.y = 4 + (Math.random() - 0.5) * cameraShake * 1.5;
        cameraShake *= 0.88;
      } else {
        camera.position.x = 0;
        camera.position.y = 4;
      }

      // Shockwave Expansion
      if (shockwaveRadius > 0 && shockwaveRadius < 14) {
        shockwaveRadius += 16 * delta;
        shockwaveMesh.scale.set(shockwaveRadius, shockwaveRadius, 1);
        shockwaveMat.opacity = Math.max(0, 1 - shockwaveRadius / 14);

        if (shockwaveRadius > 2 && shockwave2Radius === 0) {
          shockwave2Radius = 0.2;
        }
      }
      if (shockwave2Radius > 0 && shockwave2Radius < 12) {
        shockwave2Radius += 14 * delta;
        shockwave2Mesh.scale.set(shockwave2Radius, shockwave2Radius, 1);
        shockwave2Mat.opacity = Math.max(0, 0.8 - shockwave2Radius / 12);
      }

      // Ground light fade
      if (groundPulseLight.intensity > 0.05) {
        groundPulseLight.intensity *= 0.94;
      }

      // 2. NANO-CRYSTAL ACTIVATION (SCENE 3)
      if (currentPhase === 'crystals' || currentPhase === 'complete') {
        crystalBurstTimer += delta;

        for (let i = 0; i < crystalCount; i++) {
          const p = particleData[i];

          if (crystalBurstTimer < 0.8) {
            // Explode outward
            p.pos.addScaledVector(p.vel, delta);
            p.vel.y -= 7 * delta; // gravity
            if (p.pos.y < 0.05) p.pos.y = 0.05;
          } else {
            // Hover, rotate & vortex-assemble around operative
            p.angle += p.speed * 2.2;
            const targetX = Math.cos(p.angle) * p.targetOrbit;
            const targetZ = Math.sin(p.angle) * p.targetOrbit;
            const targetY = p.height + Math.sin(crystalBurstTimer * 3 + i) * 0.2;

            // Lerp towards dynamic vortex orbit
            p.pos.x += (targetX - p.pos.x) * 0.06;
            p.pos.y += (targetY - p.pos.y) * 0.06;
            p.pos.z += (targetZ - p.pos.z) * 0.06;
          }

          p.rot.x += p.rotSpeed.x;
          p.rot.y += p.rotSpeed.y;

          dummy.position.copy(p.pos);
          dummy.rotation.set(p.rot.x, p.rot.y, p.rot.z);

          const scaleFactor = Math.min(1, crystalBurstTimer * 2.5) * p.scale;
          dummy.scale.setScalar(scaleFactor);
          dummy.updateMatrix();
          crystalInstanced.setMatrixAt(i, dummy.matrix);
        }
        crystalInstanced.instanceMatrix.needsUpdate = true;

        if (crystalBurstTimer > 3.0 && !crystalsTriggeredRef.current) {
          crystalsTriggeredRef.current = true;
          if (onCrystalsAssembled) onCrystalsAssembled();
        }
      }

      // Dust drift
      const positions = dustGeo.attributes.position.array as Float32Array;
      for (let i = 1; i < dustCount * 3; i += 3) {
        positions[i] -= 0.005;
        if (positions[i] < 0) positions[i] = 8;
      }
      dustGeo.attributes.position.needsUpdate = true;

      // Subtle slow orbital camera rotation for AAA feel
      const elapsed = clock.getElapsedTime();
      camera.position.x += Math.sin(elapsed * 0.3) * 0.02;
      camera.lookAt(0, 1.2, 0);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [onLandingImpact, onCrystalsAssembled]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
    />
  );
};
