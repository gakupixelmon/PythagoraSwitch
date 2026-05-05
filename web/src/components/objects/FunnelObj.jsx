import { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { applyHoles } from '../../utils/applyHoles';

export default function FunnelObj({ object, isEditMode }) {
  const { position, rotation, isStatic, mass, properties } = object;
  const {
    radius    = 1.2,
    depth     = 0.6,
    wallThick = 0.06,
    holeRadius = 0,
    holes     = []
  } = properties;

  const rbType = isEditMode ? 'fixed' : (isStatic ? 'fixed' : 'dynamic');

  const wallGeo = useMemo(() => {
    const p = [];
    const steps = 20;
    // 上部の縁から開始
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const r = radius * (1 - t) + holeRadius * t;
      const y = -depth * Math.pow(t, 1.5);
      p.push(new THREE.Vector2(r, y));
    }
    // 底面を閉じる（holeRadiusが0の場合のみ中央まで埋める）
    if (holeRadius === 0) {
      p.push(new THREE.Vector2(0, -depth));
    }
    const baseGeo = new THREE.LatheGeometry(p, 48);
    return applyHoles(baseGeo, holes);
  }, [radius, depth, holeRadius, holes]);

  return (
    <group position={position} rotation={rotation}>
      <RigidBody type={rbType} mass={mass} friction={0.3} restitution={0.05} colliders="trimesh">
        <mesh castShadow receiveShadow geometry={wallGeo}>
          <meshStandardMaterial
            color="#7c3aed"
            roughness={0.3}
            metalness={0.3}
            side={THREE.DoubleSide}
            transparent
            opacity={0.88}
          />
        </mesh>
      </RigidBody>

      {isEditMode && holes.map((h, i) => (
        <mesh key={i} position={[h.localX, h.localY, h.localZ]}>
          {h.shape === 'square'
            ? <boxGeometry args={[h.radius * 2, 0.1, h.radius * 2]} />
            : <cylinderGeometry args={[h.radius, h.radius, 0.1, 20]} />
          }
          <meshStandardMaterial color="#ef4444" wireframe />
        </mesh>
      ))}
    </group>
  );
}
