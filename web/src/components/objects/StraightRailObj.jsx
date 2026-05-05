import { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { applyHoles } from '../../utils/applyHoles';

export default function StraightRailObj({ object, isEditMode }) {
  const { position, rotation, isStatic, mass, properties } = object;
  const { length = 4, width = 0.65, holes = [] } = properties;
  const thick = 0.08;
  const wallH = 0.18;
  const wallT = 0.04;
  const halfW = width / 2;

  const rbType = isEditMode ? 'fixed' : (isStatic ? 'fixed' : 'dynamic');

  // 床板ジオメトリ（穴あき対応）
  const floorGeo = useMemo(() => {
    const base = new THREE.BoxGeometry(width, thick, length);
    return applyHoles(base, holes);
  }, [width, thick, length, holes]);

  return (
    <group position={position} rotation={rotation}>
      <RigidBody type={rbType} mass={mass} friction={0.5} restitution={0.1} colliders="trimesh">
        {/* 床板（穴あき） */}
        <mesh receiveShadow castShadow position={[0, thick / 2, 0]} geometry={floorGeo}>
          <meshStandardMaterial color="#92400e" roughness={0.85} metalness={0.05} side={THREE.DoubleSide} />
        </mesh>
        {/* 左壁 */}
        <mesh receiveShadow castShadow position={[halfW - wallT / 2, thick + wallH / 2, 0]}>
          <boxGeometry args={[wallT, wallH, length]} />
          <meshStandardMaterial color="#78350f" roughness={0.9} />
        </mesh>
        {/* 右壁 */}
        <mesh receiveShadow castShadow position={[-halfW + wallT / 2, thick + wallH / 2, 0]}>
          <boxGeometry args={[wallT, wallH, length]} />
          <meshStandardMaterial color="#78350f" roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* 編集モード: 穴の位置をワイヤーフレームで可視化 */}
      {isEditMode && holes.map((h, i) => (
        <mesh key={i} position={[h.localX, h.localY + thick / 2, h.localZ]}>
          {h.shape === 'square'
            ? <boxGeometry args={[h.radius * 2, thick + 0.02, h.radius * 2]} />
            : <cylinderGeometry args={[h.radius, h.radius, thick + 0.02, 20]} />
          }
          <meshStandardMaterial color="#ef4444" wireframe />
        </mesh>
      ))}
    </group>
  );
}
