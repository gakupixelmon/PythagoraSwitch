import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useRef, useMemo } from 'react';

import Ball from './Ball';
import RailCourse from './RailCourse';
import GoalZone from './GoalZone';
import CameraRig from './CameraRig';
import { useGameStore } from '../store/gameStore';
import { ALL_COURSES } from '../utils/courseData';

/**
 * メイン3Dシーン
 */
function PythagoraScene({ course }) {
  const ballPosRef = useRef(new THREE.Vector3());
  const { state } = useGameStore();

  // 物理エンジンをPauseするか
  // ボールが静止状態のとき物理をオフにする（Kinematicで制御するため）
  const physicsPaused = state === 'ready' || state === 'goal' || state === 'fell';

  // コースの中心座標を計算（カメラ基準）
  const courseCenter = useMemo(() => {
    const segs = course.segments;
    let sumX = 0, sumY = 0, sumZ = 0;
    segs.forEach(s => {
      sumX += s.start[0] + s.end[0];
      sumY += s.start[1] + s.end[1];
      sumZ += s.start[2] + s.end[2];
    });
    const n = segs.length * 2;
    return [sumX / n, sumY / n, sumZ / n];
  }, [course]);

  return (
    <>
      {/* 環境光 */}
      <ambientLight intensity={0.5} color="#445577" />
      <directionalLight
        position={[10, 20, 5]}
        intensity={1.8}
        color="#fff5e0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={50}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
      />
      <pointLight position={[-8, 8, -5]} intensity={1.0} color="#3366ff" decay={2} />

      {/* 空 */}
      <Sky sunPosition={[100, 20, 100]} turbidity={6} rayleigh={1.5} mieCoefficient={0.005} />
      <Stars radius={120} depth={50} count={2000} factor={4} saturation={0.3} fade speed={0.3} />

      {/* カメラリグ */}
      <CameraRig ballPosRef={ballPosRef} courseCenter={courseCenter} />

      {/* 物理ワールド */}
      <Physics
        gravity={[0, -9.81, 0]}
        paused={physicsPaused}
        timeStep="vary"
      >
        {/* ボール */}
        <Ball
          startPosition={course.ballStart}
          cameraRef={ballPosRef}
        />

        {/* レール */}
        <RailCourse course={course} />

        {/* ゴールゾーン */}
        <GoalZone position={course.goalPos} />
      </Physics>

      {/* 地面 */}
      <mesh position={[0, -14, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#0d1117" roughness={1} />
      </mesh>

      {/* スタートマーカー（紫） */}
      <group position={course.ballStart}>
        <mesh position={[0, -0.18, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.04, 32]} />
          <meshStandardMaterial
            color="#a78bfa"
            emissive="#a78bfa"
            emissiveIntensity={1.2}
            roughness={0.2}
            metalness={0.5}
          />
        </mesh>
        <pointLight color="#a78bfa" intensity={4} distance={2} decay={2} />
      </group>
    </>
  );
}

/**
 * Canvas ラッパー
 */
export default function Scene() {
  const { activeCourse } = useGameStore();
  const course = ALL_COURSES.find(c => c.id === activeCourse) ?? ALL_COURSES[0];

  return (
    <Canvas
      shadows
      camera={{ fov: 55, near: 0.1, far: 500, position: [0, 14, -8] }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
      }}
      style={{ width: '100vw', height: '100vh' }}
    >
      <Suspense fallback={null}>
        <PythagoraScene key={activeCourse} course={course} />
      </Suspense>
    </Canvas>
  );
}
