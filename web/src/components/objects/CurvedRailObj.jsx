import { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

/**
 * カーブレール
 * properties:
 *   radius      : カーブ半径 (default 2)
 *   angle       : カーブ角度 (default 90)
 *   width       : レール幅 (default 0.65)
 *   bendAxis    : 'horizontal' | 'vertical'  (曲がる平面)
 *   bendDirection: 'left' | 'right'          (曲がる向き)
 */
export default function CurvedRailObj({ object, isEditMode }) {
  const { position, rotation, isStatic, mass, properties } = object;
  const {
    radius       = 2,
    angle        = 90,
    width        = 0.65,
    bendAxis      = 'horizontal',
    bendDirection = 'left',
  } = properties;

  const thick = 0.08;
  const wallH = 0.18;
  const wallT = 0.04;
  const rbType = isEditMode ? 'fixed' : (isStatic ? 'fixed' : 'dynamic');

  const geometry = useMemo(() => {
    const halfW = width / 2;
    const angleRad = angle * Math.PI / 180;
    const sign = bendDirection === 'right' ? -1 : 1;

    // パスカーブ
    const curve = new THREE.Curve();

    if (bendAxis === 'horizontal') {
      // XZ平面上で左右に曲がる（列車のカーブ）
      curve.getPoint = (t) => {
        const a = angleRad * t * sign;
        return new THREE.Vector3(
          (Math.cos(a) - 1) * radius * sign,
          0,
          Math.sin(a) * radius
        );
      };
    } else {
      // XY平面上で上下に曲がる（ジェットコースターの縦ループ/急降下）
      curve.getPoint = (t) => {
        const a = angleRad * t;
        return new THREE.Vector3(
          0,
          (Math.cos(a * sign) - 1) * radius * -sign,
          Math.sin(a) * radius
        );
      };
    }

    // U字断面
    const uShape = new THREE.Shape();
    uShape.moveTo(-halfW, thick + wallH);
    uShape.lineTo(-halfW, 0);
    uShape.lineTo( halfW, 0);
    uShape.lineTo( halfW, thick + wallH);
    uShape.lineTo( halfW - wallT, thick + wallH);
    uShape.lineTo( halfW - wallT, thick);
    uShape.lineTo(-halfW + wallT, thick);
    uShape.lineTo(-halfW + wallT, thick + wallH);
    uShape.lineTo(-halfW, thick + wallH);

    const extrudeSettings = {
      steps: Math.max(12, Math.floor(angle / 4)),
      extrudePath: curve,
      bevelEnabled: false,
    };
    return new THREE.ExtrudeGeometry(uShape, extrudeSettings);
  }, [radius, angle, width, bendAxis, bendDirection]);

  return (
    <group position={position} rotation={rotation}>
      <RigidBody type={rbType} mass={mass} friction={0.5} restitution={0.1} colliders="trimesh">
        <mesh geometry={geometry} receiveShadow castShadow>
          <meshStandardMaterial color="#92400e" roughness={0.85} metalness={0.05} />
        </mesh>
      </RigidBody>
    </group>
  );
}
