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
    const totalWallH = wallH + thick / 2;

    // パスカーブ
    const curve = new THREE.Curve();
    const hShape = new THREE.Shape();
    
    // 一筆書きでH型断面を作成
    if (bendAxis === 'horizontal') {
      // 水平カーブの場合、ExtrudeGeometryのNormalがY軸になりやすいため、
      // 断面のXを高さ方向、Yを幅方向に割り当てることで壁を垂直に立たせる
      hShape.moveTo(totalWallH, -halfW);
      hShape.lineTo(-totalWallH, -halfW);
      hShape.lineTo(-totalWallH, -halfW + wallT);
      hShape.lineTo(-thick / 2, -halfW + wallT);
      hShape.lineTo(-thick / 2, halfW - wallT);
      hShape.lineTo(-totalWallH, halfW - wallT);
      hShape.lineTo(-totalWallH, halfW);
      hShape.lineTo(totalWallH, halfW);
      hShape.lineTo(totalWallH, halfW - wallT);
      hShape.lineTo(thick / 2, halfW - wallT);
      hShape.lineTo(thick / 2, -halfW + wallT);
      hShape.lineTo(totalWallH, -halfW + wallT);
    } else {
      // 垂直カーブの場合、断面のXが幅方向、Yが高さ方向で正しく垂直になる
      hShape.moveTo(-halfW, totalWallH);
      hShape.lineTo(-halfW, -totalWallH);
      hShape.lineTo(-halfW + wallT, -totalWallH);
      hShape.lineTo(-halfW + wallT, -thick / 2);
      hShape.lineTo( halfW - wallT, -thick / 2);
      hShape.lineTo( halfW - wallT, -totalWallH);
      hShape.lineTo( halfW, -totalWallH);
      hShape.lineTo( halfW, totalWallH);
      hShape.lineTo( halfW - wallT, totalWallH);
      hShape.lineTo( halfW - wallT, thick / 2);
      hShape.lineTo(-halfW + wallT, thick / 2);
      hShape.lineTo(-halfW + wallT, totalWallH);
    }
    hShape.closePath();

    if (bendAxis === 'horizontal') {
      // XZ平面上で曲がる (面の法線 Y に垂直な方向)
      curve.getPoint = (t) => {
        const a = angleRad * t;
        const x = (Math.cos(a) - 1) * radius * sign; // sign=1(左)で-X, sign=-1(右)で+X
        const z = Math.sin(a) * radius;
        return new THREE.Vector3(x, 0, z);
      };
    } else {
      // YZ平面上で曲がる (面の法線 X に垂直な方向)
      curve.getPoint = (t) => {
        const a = angleRad * t;
        const y = (1 - Math.cos(a)) * radius * sign; // sign=1(上)で+Y, sign=-1(下)で-Y
        const z = Math.sin(a) * radius;
        return new THREE.Vector3(0, y, z);
      };
    }

    const extrudeSettings = {
      steps: Math.max(12, Math.floor(angle / 4)),
      extrudePath: curve,
      bevelEnabled: false,
    };
    return new THREE.ExtrudeGeometry(hShape, extrudeSettings);
  }, [radius, angle, width, bendAxis, bendDirection]);

  return (
    <group position={position} rotation={rotation}>
      <RigidBody type={rbType} mass={mass} friction={0.5} restitution={0.1} colliders="trimesh">
        <mesh geometry={geometry} receiveShadow castShadow>
          <meshStandardMaterial color={properties.color || "#92400e"} roughness={0.85} metalness={0.05} />
        </mesh>
      </RigidBody>
    </group>
  );
}
