import { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { applyHoles } from '../../utils/applyHoles';

export default function CupObj({ object, isEditMode }) {
  const { position, rotation, isStatic, mass, properties } = object;
  const {
    topRadius    = 0.8,
    bottomRadius = 0.4,
    height       = 1.2,
    wallThick    = 0.06,
    holes        = []
  } = properties;

  const rbType = isEditMode ? 'fixed' : (isStatic ? 'fixed' : 'dynamic');

  const wallGeo = useMemo(() => {
    const pts = [];
    const steps = 16;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const rO = bottomRadius + (topRadius - bottomRadius) * t;
      pts.push(new THREE.Vector2(rO, t * height));
    }
    const baseGeo = new THREE.LatheGeometry(pts, 32);
    // 穴あけ
    return applyHoles(baseGeo, holes);
  }, [topRadius, bottomRadius, height, holes]);

  return (
    <group position={position} rotation={rotation}>
      <RigidBody type={rbType} mass={mass} friction={0.4} restitution={0.05} colliders="trimesh">
        <mesh castShadow receiveShadow geometry={wallGeo}>
          <meshStandardMaterial color="#1e40af" roughness={0.3} metalness={0.4} side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>
        <mesh position={[0, wallThick / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[bottomRadius, bottomRadius, wallThick, 32]} />
          <meshStandardMaterial color="#1e40af" roughness={0.3} metalness={0.4} />
        </mesh>
      </RigidBody>

      {/* 編集モード: 穴の位置をワイヤーフレームで可視化 */}
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
