import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';

/**
 * カメラコントローラー
 * - 'follow': ボールを追いかける
 * - 'overview': コース全体を俯瞰
 * - 'orbit': マウスで自由操作
 */
export default function CameraRig({ ballPosRef, courseCenter }) {
  const { camera } = useThree();
  const { cameraMode, state } = useGameStore();
  const smoothPos = useRef(new THREE.Vector3());
  const smoothTarget = useRef(new THREE.Vector3());
  const orbitRef = useRef();

  const OVERVIEW_POS = new THREE.Vector3(
    courseCenter[0],
    courseCenter[1] + 14,
    courseCenter[2] - 8
  );
  const OVERVIEW_TARGET = new THREE.Vector3(courseCenter[0], courseCenter[1], courseCenter[2] + 2);

  useEffect(() => {
    // 初期カメラ位置（俯瞰）
    camera.position.copy(OVERVIEW_POS);
    camera.lookAt(OVERVIEW_TARGET);
    smoothPos.current.copy(OVERVIEW_POS);
    smoothTarget.current.copy(OVERVIEW_TARGET);
  }, [courseCenter]);

  useFrame((_, delta) => {
    if (cameraMode === 'orbit') return;

    let targetPos, targetLookAt;
    const ballPos = ballPosRef.current
      ? ballPosRef.current
      : new THREE.Vector3(...courseCenter);

    if (cameraMode === 'follow' && state === 'running') {
      // ボール追従: 後ろ上方から見る
      targetPos = ballPos.clone().add(new THREE.Vector3(2, 3.5, -5));
      targetLookAt = ballPos.clone().add(new THREE.Vector3(0, 0, 2));
    } else {
      // 俯瞰
      targetPos = OVERVIEW_POS.clone();
      targetLookAt = OVERVIEW_TARGET.clone();
    }

    const lerpFactor = Math.min(1, delta * 4);
    smoothPos.current.lerp(targetPos, lerpFactor);
    smoothTarget.current.lerp(targetLookAt, lerpFactor);

    camera.position.copy(smoothPos.current);
    camera.lookAt(smoothTarget.current);
  });

  return cameraMode === 'orbit' ? (
    <OrbitControls
      ref={orbitRef}
      enableDamping
      dampingFactor={0.08}
      target={[courseCenter[0], courseCenter[1], courseCenter[2]]}
    />
  ) : null;
}
