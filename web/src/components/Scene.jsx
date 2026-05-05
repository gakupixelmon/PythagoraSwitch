import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';

import CameraRig from './CameraRig';
import { useCourseStore } from '../store/courseStore';
import { useGameStore } from '../store/gameStore';

import StraightRailObj from './objects/StraightRailObj';
import CurvedRailObj from './objects/CurvedRailObj';
import SphereObj from './objects/SphereObj';
import MainBallObj from './objects/MainBallObj';
import GoalZoneObj from './objects/GoalZoneObj';
import SeesawObj from './objects/SeesawObj';
import CupObj from './objects/CupObj';
import FunnelObj from './objects/FunnelObj';
import HolePlateObj from './objects/HolePlateObj';

function PlaySceneInner({ course }) {
  const ballPosRef = useRef(new THREE.Vector3());
  const gameState = useGameStore(s => s.state);

  return (
    <>
      <ambientLight intensity={0.45} color="#445577" />
      <directionalLight position={[10,20,5]} intensity={1.8} color="#fff5e0" castShadow
        shadow-mapSize={[1024,1024]}
        shadow-camera-far={60} shadow-camera-left={-20} shadow-camera-right={20}
        shadow-camera-top={20} shadow-camera-bottom={-20} />
      <pointLight position={[-8,8,-5]} intensity={1.0} color="#3366ff" decay={2} />

      <Sky sunPosition={[100,20,100]} turbidity={6} rayleigh={1.5} />
      <Stars radius={120} depth={50} count={2000} factor={4} saturation={0.3} fade speed={0.3} />

      <CameraRig ballPosRef={ballPosRef} />

      {/* ─── 物理ワールド ─── */}
      <Physics gravity={[0, -9.81, 0]} timeStep="vary" paused={gameState === 'ready'}>
        {course.objects.map(obj => {
          if (obj.type === 'straight_rail') return <StraightRailObj key={obj.id} object={obj} isEditMode={false} />;
          if (obj.type === 'curved_rail')  return <CurvedRailObj  key={obj.id} object={obj} isEditMode={false} />;
          if (obj.type === 'sphere')       return <SphereObj       key={obj.id} object={obj} isEditMode={false} />;
          if (obj.type === 'main_ball')    return <MainBallObj     key={obj.id} object={obj} ballPosRef={ballPosRef} isEditMode={false} />;
          if (obj.type === 'goal_zone')    return <GoalZoneObj     key={obj.id} object={obj} isEditMode={false} />;
          if (obj.type === 'seesaw')       return <SeesawObj       key={obj.id} object={obj} isEditMode={false} />;
          if (obj.type === 'cup')          return <CupObj          key={obj.id} object={obj} isEditMode={false} />;
          if (obj.type === 'funnel')       return <FunnelObj       key={obj.id} object={obj} isEditMode={false} />;
          if (obj.type === 'hole_plate')   return <HolePlateObj    key={obj.id} object={obj} isEditMode={false} />;
          return null;
        })}
      </Physics>

      {/* 地面 */}
      <mesh position={[0,-16,0]} rotation={[-Math.PI/2,0,0]} receiveShadow>
        <planeGeometry args={[200,200]} />
        <meshStandardMaterial color="#0a0e1a" roughness={1} />
      </mesh>

      {/* スタートマーカー */}
      {course.ballStart && (
        <group position={course.ballStart}>
          <mesh position={[0,-0.2,0]}>
            <cylinderGeometry args={[0.24,0.24,0.04,32]} />
            <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={1.2} />
          </mesh>
          <pointLight color="#a78bfa" intensity={4} distance={2} decay={2} />
        </group>
      )}
    </>
  );
}

export default function PlayScene() {
  const getCourse = useCourseStore(s => s.getCourse);
  const course = getCourse();
  if (!course) return null;

  // Reactのkeyに渡してオブジェクトの構成が変わるたびに再マウント
  const courseKey = JSON.stringify(course.objects.map(o => `${o.id}-${o.position.join(',')}-${o.rotation.join(',')}`));

  return (
    <Canvas
      shadows
      camera={{ fov: 55, near: 0.1, far: 500, position: [3,14,-6] }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      style={{ width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <PlaySceneInner key={courseKey} course={course} />
      </Suspense>
    </Canvas>
  );
}
