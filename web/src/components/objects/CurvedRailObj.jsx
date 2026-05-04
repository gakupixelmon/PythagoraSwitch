import { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

export default function CurvedRailObj({ object, isEditMode }) {
  const { position, rotation, isStatic, mass, properties } = object;
  const { radius = 2, angle = 90, width = 0.65 } = properties;
  const thick = 0.08;
  const wallH = 0.18;
  const wallT = 0.04;

  const rbType = isEditMode ? 'fixed' : (isStatic ? 'fixed' : 'dynamic');

  const { geometry } = useMemo(() => {
    const halfW = width / 2;
    const curve = new THREE.Curve();
    curve.getPoint = (t) => {
      const a = (angle * Math.PI / 180) * t;
      return new THREE.Vector3(Math.cos(a) * radius - radius, 0, Math.sin(a) * radius);
    };

    const uShape = new THREE.Shape();
    uShape.moveTo(-halfW, thick + wallH);
    uShape.lineTo(-halfW, 0);
    uShape.lineTo(halfW, 0);
    uShape.lineTo(halfW, thick + wallH);
    uShape.lineTo(halfW - wallT, thick + wallH);
    uShape.lineTo(halfW - wallT, thick);
    uShape.lineTo(-halfW + wallT, thick);
    uShape.lineTo(-halfW + wallT, thick + wallH);
    uShape.lineTo(-halfW, thick + wallH);

    const extrudeSettings = {
      steps: Math.max(8, Math.floor(angle / 5)),
      extrudePath: curve,
      bevelEnabled: false,
    };
    return { geometry: new THREE.ExtrudeGeometry(uShape, extrudeSettings) };
  }, [radius, angle, width]);

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
