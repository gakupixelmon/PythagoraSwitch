import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, BallCollider } from '@react-three/rapier';
import { Trail } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';

/**
 * ピタゴラスイッチのボールコンポーネント
 * - Rapierの物理演算で動く球体
 * - 光沢のある青いマテリアル + 発光
 * - Trail（軌跡）付き
 */
export default function Ball({ startPosition, cameraRef }) {
  const rbRef = useRef();
  const meshRef = useRef();
  const fellRef = useRef(false); // 連続呼び出し防止
  const { state, onFell } = useGameStore();

  // ボールのマテリアル（メモ化）
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#00b4ff'),
    emissive: new THREE.Color('#0044aa'),
    emissiveIntensity: 0.6,
    roughness: 0.1,
    metalness: 0.8,
  }), []);

  // Trailのカラー（再生成しない）
  const trailColor = useMemo(() => new THREE.Color('#00e5ff'), []);

  // ゲーム状態の変化を監視してボールを制御
  useEffect(() => {
    if (!rbRef.current) return;

    if (state === 'ready' || state === 'goal' || state === 'fell') {
      fellRef.current = false;
      // 静止状態にリセット
      try {
        rbRef.current.setTranslation(
          { x: startPosition[0], y: startPosition[1], z: startPosition[2] },
          true
        );
        rbRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rbRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
        // Kinematic に切り替え
        rbRef.current.setBodyType(1, true);
      } catch (e) {
        // RigidBodyがまだ初期化されていない場合は無視
      }
    } else if (state === 'running') {
      fellRef.current = false;
      try {
        // Dynamic に切り替え（重力有効）
        rbRef.current.setBodyType(0, true);
      } catch (e) {}
    }
  }, [state, startPosition]);

  // フレームごとにボールの落下を監視
  useFrame(() => {
    if (!rbRef.current || state !== 'running') return;

    const pos = rbRef.current.translation();

    // 落下検知
    if (pos.y < -12 && !fellRef.current) {
      fellRef.current = true;
      onFell();
    }

    // カメラ追従用に位置を更新
    if (cameraRef) {
      cameraRef.current.set(pos.x, pos.y, pos.z);
    }
  });

  return (
    <RigidBody
      ref={rbRef}
      type="kinematic"
      position={startPosition}
      mass={0.5}
      restitution={0.2}
      friction={0.6}
      linearDamping={0.3}
      angularDamping={0.1}
      colliders={false}
      name="ball"
    >
      <BallCollider args={[0.12]} />
      <Trail
        width={0.5}
        length={10}
        color={trailColor}
        attenuation={(t) => t * t}
        target={meshRef}
      />
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[0.12, 32, 32]} />
        <primitive object={material} />
      </mesh>

      {/* 発光ポイントライト */}
      <pointLight
        color="#00ccff"
        intensity={state === 'running' ? 6 : 0}
        distance={3}
        decay={2}
      />
    </RigidBody>
  );
}
