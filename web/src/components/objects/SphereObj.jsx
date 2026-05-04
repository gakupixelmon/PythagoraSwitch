import { RigidBody, BallCollider } from '@react-three/rapier';

export default function SphereObj({ object, isEditMode }) {
  const { position, rotation, isStatic, mass, properties } = object;
  const radius = properties.radius || 0.2;
  const color = properties.color || '#f97316';

  const rbType = isEditMode ? 'fixed' : (isStatic ? 'fixed' : 'dynamic');

  return (
    <group position={position} rotation={rotation}>
      <RigidBody type={rbType} mass={mass} restitution={0.3} friction={0.5} colliders={false}>
        <BallCollider args={[radius]} />
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[radius, 32, 32]} />
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
        </mesh>
      </RigidBody>
    </group>
  );
}
