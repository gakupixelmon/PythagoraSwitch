import { useRef } from 'react';
import { RigidBody } from '@react-three/rapier';
import { useGameStore } from '../store/gameStore';

export default function GoalZone({ position }) {
  const triggered = useRef(false);
  const { state, onGoal } = useGameStore();

  const onIntersect = () => {
    if (triggered.current || state !== 'running') return;
    triggered.current = true;
    onGoal();
    setTimeout(() => { triggered.current = false; }, 4000);
  };

  return (
    <group position={position}>
      <RigidBody type="fixed" sensor onIntersectionEnter={onIntersect}>
        <mesh>
          <boxGeometry args={[1.4, 1.4, 1.4]} />
          <meshStandardMaterial color="#4ade80" transparent opacity={0.2} emissive="#4ade80" emissiveIntensity={0.5} />
        </mesh>
      </RigidBody>

      {/* ゴールリング */}
      <mesh rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[0.75, 0.045, 12, 48]} />
        <meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={1.2} />
      </mesh>

      <RigidBody type="fixed" friction={0.6}>
        <mesh position={[0, -0.75, 0]} receiveShadow>
          <cylinderGeometry args={[0.9, 0.9, 0.1, 32]} />
          <meshStandardMaterial color="#14532d" roughness={0.6} />
        </mesh>
      </RigidBody>
      <pointLight color="#4ade80" intensity={5} distance={4} decay={2} />
    </group>
  );
}
