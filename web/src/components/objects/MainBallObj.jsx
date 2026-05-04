import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, BallCollider } from '@react-three/rapier';
import { Trail } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';

export default function MainBallObj({ object, ballPosRef, isEditMode }) {
  const { position, mass, properties } = object;
  const radius = properties.radius || 0.12;
  const color = properties.color || '#00b4ff';

  const rbRef  = useRef();
  const meshRef = useRef();
  const fellFired = useRef(false);
  const { state, onFell } = useGameStore();

  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    emissive: new THREE.Color('#003888'),
    emissiveIntensity: 0.7,
    roughness: 0.1,
    metalness: 0.85,
  }), [color]);

  const trailColor = useMemo(() => new THREE.Color('#00e5ff'), []);

  useEffect(() => {
    if (!rbRef.current || isEditMode) return;
    const [x, y, z] = position;

    if (state === 'ready' || state === 'goal' || state === 'fell') {
      fellFired.current = false;
      try {
        rbRef.current.setBodyType(1, true); // Kinematic
        rbRef.current.setTranslation({ x, y, z }, true);
        rbRef.current.setLinvel({ x:0, y:0, z:0 }, true);
        rbRef.current.setAngvel({ x:0, y:0, z:0 }, true);
      } catch { /* ignore */ }
    } else if (state === 'running') {
      fellFired.current = false;
      try {
        rbRef.current.setBodyType(0, true); // Dynamic
      } catch { /* ignore */ }
    }
  }, [state, position, isEditMode]);

  useFrame(() => {
    if (isEditMode) {
      if (ballPosRef) ballPosRef.current.set(position[0], position[1], position[2]);
      return;
    }
    if (!rbRef.current) return;
    const pos = rbRef.current.translation();

    if (ballPosRef) {
      ballPosRef.current.set(pos.x, pos.y, pos.z);
    }

    if (state === 'running' && pos.y < -14 && !fellFired.current) {
      fellFired.current = true;
      onFell();
    }
  });

  if (isEditMode) {
    return (
      <group position={position}>
        <mesh ref={meshRef}>
          <sphereGeometry args={[radius, 32, 32]} />
          <primitive object={material} />
        </mesh>
      </group>
    );
  }

  return (
    <RigidBody
      ref={rbRef}
      type="kinematic"
      position={position}
      mass={mass}
      restitution={0.15}
      friction={0.55}
      linearDamping={0.25}
      angularDamping={0.08}
      colliders={false}
    >
      <BallCollider args={[radius]} />
      <Trail width={0.5} length={10} color={trailColor} attenuation={t => t * t} target={meshRef} />
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[radius, 32, 32]} />
        <primitive object={material} />
      </mesh>
      <pointLight color="#00ccff" intensity={state === 'running' ? 8 : 0} distance={3} decay={2} />
    </RigidBody>
  );
}
