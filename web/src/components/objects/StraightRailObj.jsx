import { RigidBody } from '@react-three/rapier';

export default function StraightRailObj({ object, isEditMode }) {
  const { position, rotation, isStatic, mass, properties } = object;
  const { length = 4, width = 0.65 } = properties;
  const thick = 0.08;
  const wallH = 0.18;
  const wallT = 0.04;
  const halfW = width / 2;

  const rbType = isEditMode ? 'fixed' : (isStatic ? 'fixed' : 'dynamic');

  return (
    <group position={position} rotation={rotation}>
      <RigidBody type={rbType} mass={mass} friction={0.5} restitution={0.1}>
        {/* 床板 */}
        <mesh receiveShadow castShadow position={[0, thick/2, 0]}>
          <boxGeometry args={[width, thick, length]} />
          <meshStandardMaterial color="#92400e" roughness={0.85} metalness={0.05} />
        </mesh>
        {/* 左壁 */}
        <mesh receiveShadow castShadow position={[halfW - wallT/2, thick + wallH/2, 0]}>
          <boxGeometry args={[wallT, wallH, length]} />
          <meshStandardMaterial color="#78350f" roughness={0.9} />
        </mesh>
        {/* 右壁 */}
        <mesh receiveShadow castShadow position={[-halfW + wallT/2, thick + wallH/2, 0]}>
          <boxGeometry args={[wallT, wallH, length]} />
          <meshStandardMaterial color="#78350f" roughness={0.9} />
        </mesh>
      </RigidBody>
    </group>
  );
}
