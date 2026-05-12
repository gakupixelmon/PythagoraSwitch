import { useRef, useMemo } from 'react';
import { RigidBody, useRevoluteJoint } from '@react-three/rapier';
import * as THREE from 'three';
import { applyHoles } from '../../utils/applyHoles';

/**
 * シーソーオブジェクト
 * properties:
 *   length      : 板の長さ (default 6)
 *   width       : 板の幅 (default 0.65)
 *   pivotHeight : 支点の高さ (default 1.2)
 *   holes       : 穴の配列 (default [])
 */
function SeesawJoint({ pivotRef, boardRef, baseH, thick }) {
  const hingeY = baseH + 0.04; // シリンダーの中心の高さ
  useRevoluteJoint(pivotRef, boardRef, [
    [0, hingeY, 0],    // pivotのローカルアンカー（ヒンジの中心）
    [0, -thick / 2, 0], // boardのローカルアンカー（板の底面）
    [1, 0, 0]          // X軸周りに回転
  ]);
  return null;
}

export default function SeesawObj({ object, isEditMode }) {
  const { position, rotation, mass, properties } = object;
  const { length = 6, width = 0.65, pivotHeight = 1.2, holes = [] } = properties || {};

  const pivotRef  = useRef();
  const boardRef  = useRef();

  const thick = 0.06;
  const baseW = 0.3;
  const baseH = pivotHeight;

  // ヒンジの中心高さ
  const hingeY = baseH + 0.04;
  // 板の初期Y位置：ヒンジの中心 ＋ 板の厚みの半分
  const boardY = hingeY + thick / 2;

  // 穴あきボードジオメトリ
  const boardGeo = useMemo(() => {
    const base = new THREE.BoxGeometry(width, thick, length);
    return applyHoles(base, holes);
  }, [width, thick, length, holes]);

  return (
    <group position={position} rotation={rotation}>
      {/* 支点（ベース台座のみ物理判定あり） */}
      <RigidBody ref={pivotRef} type="fixed">
        <mesh position={[0, baseH / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[baseW, baseH, baseW]} />
          <meshStandardMaterial color="#374151" roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* 頂点のヒンジシリンダー（見た目のみ、衝突判定なし） */}
      <mesh position={[0, hingeY, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.08, 12]} />
        <meshStandardMaterial color="#6b7280" metalness={0.6} />
      </mesh>

      {/* 板（dynamic ＝ 回転する） */}
      <RigidBody
        ref={boardRef}
        type={isEditMode ? 'fixed' : 'dynamic'}
        position={[0, boardY, 0]}
        mass={mass}
        linearDamping={0.5}
        angularDamping={2.0}
      >
        <mesh castShadow receiveShadow geometry={boardGeo}>
          <meshStandardMaterial color="#92400e" roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
        {/* 左壁 */}
        <mesh position={[ width/2 - 0.03, thick/2 + 0.09, 0]} castShadow>
          <boxGeometry args={[0.04, 0.18, length]} />
          <meshStandardMaterial color="#78350f" roughness={0.9} />
        </mesh>
        {/* 右壁 */}
        <mesh position={[-width/2 + 0.03, thick/2 + 0.09, 0]} castShadow>
          <boxGeometry args={[0.04, 0.18, length]} />
          <meshStandardMaterial color="#78350f" roughness={0.9} />
        </mesh>


      </RigidBody>

      {!isEditMode && <SeesawJoint pivotRef={pivotRef} boardRef={boardRef} baseH={baseH} thick={thick} />}
    </group>
  );
}
