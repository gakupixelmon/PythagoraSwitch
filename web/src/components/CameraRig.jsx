import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';

export default function CameraRig({ ballPosRef }) {
  const { camera } = useThree();
  const { cameraMode, state } = useGameStore();
  const velRef = useRef(new THREE.Vector3());
  const smoothPos = useRef(new THREE.Vector3(3, 12, -6));
  const smoothTgt = useRef(new THREE.Vector3(0, 1, 4));

  const OVERVIEW_POS = useMemo(() => new THREE.Vector3(3, 14, -6), []);
  const OVERVIEW_TGT = useMemo(() => new THREE.Vector3(0, 1, 6), []);

  useEffect(() => {
    camera.position.copy(OVERVIEW_POS);
    camera.lookAt(OVERVIEW_TGT);
    smoothPos.current.copy(OVERVIEW_POS);
    smoothTgt.current.copy(OVERVIEW_TGT);
  }, []);

  useFrame((_, dt) => {
    if (cameraMode === 'orbit') return;

    const ballPos = ballPosRef?.current ?? OVERVIEW_TGT;
    let wantPos, wantTgt;

    if (cameraMode === 'follow' && state === 'running') {
      wantPos = ballPos.clone().add(new THREE.Vector3(2.5, 3.5, -5.5));
      wantTgt = ballPos.clone().add(new THREE.Vector3(0, 0, 2));
    } else {
      wantPos = OVERVIEW_POS.clone();
      wantTgt = OVERVIEW_TGT.clone();
    }

    const k = Math.min(1, dt * 4);
    smoothPos.current.lerp(wantPos, k);
    smoothTgt.current.lerp(wantTgt, k);
    camera.position.copy(smoothPos.current);
    camera.lookAt(smoothTgt.current);
  });

  return cameraMode === 'orbit'
    ? <OrbitControls enableDamping dampingFactor={0.08} target={[0, 1, 6]} />
    : null;
}
