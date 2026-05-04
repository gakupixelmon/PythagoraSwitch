import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, BallCollider } from '@react-three/rapier';
import { Trail } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';

export default function Ball({ startPosition, ballPosRef }) {
  const rbRef  = useRef();
  const meshRef = useRef();
  const fellFired = useRef(false);
  const { state, onFell } = useGameStore();

  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#00b4ff'),
    emissive: new THREE.Color('#003888'),
    emissiveIntensity: 0.7,
    roughness: 0.1,
    metalness: 0.85,
  }), []);

  const trailColor = useMemo(() => new THREE.Color('#00e5ff'), []);

  useEffect(() => {
    if (!rbRef.current) return;
    const [x, y, z] = startPosition;

    if (state === 'ready' || state === 'goal' || state === 'fell') {
      fellFired.current = false;
      try {
        rbRef.current.setBodyType(1, true);           // Kinematic
        rbRef.current.setTranslation({ x, y, z }, true);
        rbRef.current.setLinvel({ x:0, y:0, z:0 }, true);
        rbRef.current.setAngvel({ x:0, y:0, z:0 }, true);
      } catch {
        // ignore
      }
    } else if (state === 'running') {
      fellFired.current = false;
      try {
        rbRef.current.setBodyType(0, true);           // Dynamic
      } catch {
        // ignore
      }
    }
  }, [state, startPosition]);

  useFrame(() => {
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

  return (
    <RigidBody
      ref={rbRef}
      type="kinematic"
      position={startPosition}
      mass={0.5}
      restitution={0.15}
      friction={0.55}
      linearDamping={0.25}
      angularDamping={0.08}
      colliders={false}
    >
      <BallCollider args={[0.12]} />
      <Trail
        width={0.5}
        length={10}
        color={trailColor}
        attenuation={t => t * t}
        target={meshRef}
      />
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[0.12, 32, 32]} />
        <primitive object={material} />
      </mesh>
      <pointLight
        color="#00ccff"
        intensity={state === 'running' ? 8 : 0}
        distance={3}
        decay={2}
      />
    </RigidBody>
  );
}
