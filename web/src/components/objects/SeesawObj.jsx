import { useRef, useEffect } from 'react';
import { RigidBody, useRapier } from '@react-three/rapier';

/**
 * シーソーオブジェクト
 * properties:
 *   length : 板の長さ (default 6)
 *   width  : 板の幅 (default 0.65)
 *   height : 支点の高さ (default 1.5)
 */
export default function SeesawObj({ object, isEditMode }) {
  const { position, rotation, mass, properties } = object;
  const { length = 6, width = 0.65, pivotHeight = 1.2 } = properties;

  const pivotRef  = useRef();
  const boardRef  = useRef();
  const { world, rapier } = useRapier();
  const jointRef  = useRef();

  const thick = 0.06;
  const baseW = 0.3;
  const baseH = pivotHeight;

  // ヒンジジョイントを接続
  useEffect(() => {
    if (isEditMode) return;
    if (!pivotRef.current || !boardRef.current) return;

    // @react-three/rapier v1.x/v2.x exposes the body via .current directly, or .current.raw() depending on version.
    // If .raw() exists, we use it, otherwise we assume .current is the body.
    const pivot = typeof pivotRef.current.raw === 'function' ? pivotRef.current.raw() : pivotRef.current;
    const board = typeof boardRef.current.raw === 'function' ? boardRef.current.raw() : boardRef.current;
    if (!pivot || !board) return;

    // 支点（fixed）と板（dynamic）をXローテーション軸ヒンジで繋ぐ
    const params = rapier.JointData.revolute(
      { x: 0, y: baseH, z: 0 },   // pivot上端
      { x: 0, y: 0,  z: 0 },       // board中心
      { x: 1, y: 0, z: 0 }         // X軸周りに回転
    );
    jointRef.current = world.createImpulseJoint(params, pivot, board, true);

    return () => {
      if (jointRef.current) {
        // eslint-disable-next-line no-empty
        try { world.removeImpulseJoint(jointRef.current, true); } catch {}
        jointRef.current = null;
      }
    };
  }, [isEditMode, world, rapier, baseH]);

  const boardY = isEditMode ? pivotHeight : pivotHeight;

  return (
    <group position={position} rotation={rotation}>
      {/* 支点（くさび形） */}
      <RigidBody ref={pivotRef} type="fixed">
        {/* ベース台座 */}
        <mesh position={[0, baseH / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[baseW, baseH, baseW]} />
          <meshStandardMaterial color="#374151" roughness={0.7} />
        </mesh>
        {/* 頂点 */}
        <mesh position={[0, baseH + 0.04, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.08, 12]} />
          <meshStandardMaterial color="#6b7280" metalness={0.6} />
        </mesh>
      </RigidBody>

      {/* 板（dynamic ＝ 回転する） */}
      <RigidBody
        ref={boardRef}
        type={isEditMode ? 'fixed' : 'dynamic'}
        position={[0, boardY + thick / 2, 0]}
        mass={mass}
        linearDamping={0.5}
        angularDamping={2.0}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[width, thick, length]} />
          <meshStandardMaterial color="#92400e" roughness={0.8} />
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
    </group>
  );
}
