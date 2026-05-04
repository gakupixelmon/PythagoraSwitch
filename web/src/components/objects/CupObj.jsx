import { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

/**
 * コップ型オブジェクト（内側にボールが留まる）
 * properties:
 *   topRadius    : 口の半径 (default 0.8)
 *   bottomRadius : 底の半径 (default 0.4)
 *   height       : 高さ (default 1.2)
 *   wallThick    : 壁の厚さ (default 0.06)
 */
export default function CupObj({ object, isEditMode }) {
  const { position, rotation, isStatic, mass, properties } = object;
  const {
    topRadius    = 0.8,
    bottomRadius = 0.4,
    height       = 1.2,
    wallThick    = 0.06,
  } = properties;

  const rbType = isEditMode ? 'fixed' : (isStatic ? 'fixed' : 'dynamic');

  // 外形の回転体
  const outerGeo = useMemo(() => {
    const points = [];
    const steps = 12;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const r = bottomRadius + (topRadius - bottomRadius) * t;
      const y = t * height;
      points.push(new THREE.Vector2(r, y));
    }
    // 壁の厚さ（内側）
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const r = Math.max(0.05, (bottomRadius + (topRadius - bottomRadius) * t) - wallThick);
      const y = t * height;
      points.push(new THREE.Vector2(r, y));
    }
    const shape = new THREE.Shape(points);
    return new THREE.LatheGeometry(
      points.slice(0, steps + 1).concat([new THREE.Vector2(bottomRadius - wallThick, 0), new THREE.Vector2(bottomRadius, 0)]),
      32
    );
  }, [topRadius, bottomRadius, height, wallThick]);

  // 底板
  const bottomGeo = useMemo(() => new THREE.CylinderGeometry(
    bottomRadius - wallThick, bottomRadius - wallThick, wallThick, 32
  ), [bottomRadius, wallThick]);

  // 壁体（外筒）
  const wallGeo = useMemo(() => {
    const inner = bottomRadius - wallThick;
    const outer = bottomRadius;
    const points = [];
    const steps = 12;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const rO = bottomRadius + (topRadius - bottomRadius) * t;
      const y  = t * height;
      points.push(new THREE.Vector2(rO, y));
    }
    return new THREE.LatheGeometry(points, 32);
  }, [topRadius, bottomRadius, height]);

  return (
    <group position={position} rotation={rotation}>
      <RigidBody type={rbType} mass={mass} friction={0.4} restitution={0.05} colliders="trimesh">
        {/* 外側の円筒壁（内側に当たり判定あり） */}
        <mesh castShadow receiveShadow>
          <latheGeometry
            args={[
              (() => {
                const pts = [];
                const steps = 16;
                for (let i = 0; i <= steps; i++) {
                  const t = i / steps;
                  const rO = bottomRadius + (topRadius - bottomRadius) * t;
                  pts.push(new THREE.Vector2(rO, t * height));
                }
                return pts;
              })(),
              32
            ]}
          />
          <meshStandardMaterial color="#1e40af" roughness={0.3} metalness={0.4} side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>
        {/* 底板 */}
        <mesh position={[0, wallThick / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[bottomRadius, bottomRadius, wallThick, 32]} />
          <meshStandardMaterial color="#1e40af" roughness={0.3} metalness={0.4} />
        </mesh>
      </RigidBody>
    </group>
  );
}
