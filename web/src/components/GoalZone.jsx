import { useRef } from 'react';
import { RigidBody } from '@react-three/rapier';
import { useGameStore } from '../store/gameStore';

/**
 * ゴールゾーンコンポーネント
 * - センサー（isTrigger）でボールを検出
 * - 半透明の緑色エリア
 */
export default function GoalZone({ position }) {
  const triggered = useRef(false);
  const { state, onGoal } = useGameStore();

  const handleCollision = ({ other }) => {
    if (triggered.current) return;
    if (state !== 'running') return;

    triggered.current = true;
    onGoal();

    // リセット時にフラグをリセット
    setTimeout(() => { triggered.current = false; }, 3000);
  };

  return (
    <group position={position}>
      {/* センサーコライダー */}
      <RigidBody
        type="fixed"
        sensor
        onIntersectionEnter={handleCollision}
      >
        <mesh>
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <meshStandardMaterial
            color="#4ade80"
            transparent
            opacity={0.25}
            emissive="#4ade80"
            emissiveIntensity={0.4}
          />
        </mesh>
      </RigidBody>

      {/* ゴールリング（装飾） */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.7, 0.04, 12, 48]} />
        <meshStandardMaterial
          color="#4ade80"
          emissive="#4ade80"
          emissiveIntensity={1}
        />
      </mesh>

      {/* 下のプラットフォーム */}
      <RigidBody type="fixed" friction={0.6}>
        <mesh position={[0, -0.7, 0]} receiveShadow>
          <cylinderGeometry args={[0.8, 0.8, 0.1, 32]} />
          <meshStandardMaterial color="#1a4d2a" roughness={0.6} />
        </mesh>
      </RigidBody>

      {/* ゴール点滅ライト */}
      <pointLight
        color="#4ade80"
        intensity={4}
        distance={4}
        decay={2}
      />
    </group>
  );
}
