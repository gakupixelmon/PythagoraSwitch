import { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

/**
 * すり鉢型オブジェクト（ボールが中心に集まる）
 * properties:
 *   radius       : 口の半径 (default 1.2)
 *   depth        : 深さ (default 0.6)
 *   wallThick    : 壁の厚さ (default 0.06)
 */
export default function FunnelObj({ object, isEditMode }) {
  const { position, rotation, isStatic, mass, properties } = object;
  const {
    radius    = 1.2,
    depth     = 0.6,
    wallThick = 0.06,
    holeRadius = 0,   // > 0 なら底に穴あき（「じょうご型」）
  } = properties;

  const rbType = isEditMode ? 'fixed' : (isStatic ? 'fixed' : 'dynamic');

  // すり鉢の断面: 外側はradius, 中心に向かってdepth分下がる
  const pts = useMemo(() => {
    const p = [];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // 外から内へ: x = radius*(1-t), y = -depth*t^1.5 (放物線)
      const r = radius * (1 - t) + holeRadius * t;
      const y = -depth * Math.pow(t, 1.5);
      p.push(new THREE.Vector2(r, y));
    }
    return p;
  }, [radius, depth, holeRadius]);

  return (
    <group position={position} rotation={rotation}>
      <RigidBody type={rbType} mass={mass} friction={0.3} restitution={0.05} colliders="trimesh">
        {/* 外側の回転体 */}
        <mesh castShadow receiveShadow>
          <latheGeometry args={[pts, 48]} />
          <meshStandardMaterial
            color="#7c3aed"
            roughness={0.3}
            metalness={0.3}
            side={THREE.DoubleSide}
            transparent
            opacity={0.88}
          />
        </mesh>

        {/* 底の薄い円板（穴なしの場合のみ） */}
        {holeRadius === 0 && (
          <mesh position={[0, -depth + wallThick / 2, 0]} castShadow>
            <cylinderGeometry args={[wallThick * 2, wallThick * 2, wallThick, 24]} />
            <meshStandardMaterial color="#6d28d9" roughness={0.4} />
          </mesh>
        )}
      </RigidBody>
    </group>
  );
}
