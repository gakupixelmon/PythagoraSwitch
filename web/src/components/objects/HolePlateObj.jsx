import { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';

/**
 * 穴あきプレート（CSG差分演算で静的な穴を実現）
 * properties:
 *   width       : プレートの幅 (default 2)
 *   depth       : プレートの奥行き (default 2)
 *   thickness   : プレートの厚さ (default 0.15)
 *   holeShape   : 'circle' | 'square' (default 'circle')
 *   holeSize    : 穴の大きさ (半径 or 辺の半分, default 0.4)
 *   holeOffsetX : 穴の横オフセット (default 0)
 *   holeOffsetZ : 穴の縦オフセット (default 0)
 */
export default function HolePlateObj({ object, isEditMode }) {
  const { position, rotation, isStatic, mass, properties } = object;
  const {
    width       = 2,
    depth       = 2,
    thickness   = 0.15,
    holeShape   = 'circle',
    holeSize    = 0.4,
    holeOffsetX = 0,
    holeOffsetZ = 0,
  } = properties;

  const rbType = isEditMode ? 'fixed' : (isStatic ? 'fixed' : 'dynamic');

  const csgGeo = useMemo(() => {
    const evaluator = new Evaluator();

    // ベースプレート
    const baseBrush = new Brush(new THREE.BoxGeometry(width, thickness, depth));
    baseBrush.updateMatrixWorld();

    // 穴のブラシ（プレートより少し厚くして完全に切り抜く）
    let holeGeo;
    if (holeShape === 'circle') {
      holeGeo = new THREE.CylinderGeometry(holeSize, holeSize, thickness + 0.02, 32);
    } else {
      holeGeo = new THREE.BoxGeometry(holeSize * 2, thickness + 0.02, holeSize * 2);
    }
    const holeBrush = new Brush(holeGeo);
    holeBrush.position.set(holeOffsetX, 0, holeOffsetZ);
    holeBrush.updateMatrixWorld();

    try {
      const result = evaluator.evaluate(baseBrush, holeBrush, SUBTRACTION);
      return result.geometry;
    } catch {
      // CSG失敗時はプレーンなジオメトリにフォールバック
      return new THREE.BoxGeometry(width, thickness, depth);
    }
  }, [width, depth, thickness, holeShape, holeSize, holeOffsetX, holeOffsetZ]);

  return (
    <group position={position} rotation={rotation}>
      <RigidBody type={rbType} mass={mass} friction={0.5} restitution={0.1} colliders="trimesh">
        <mesh geometry={csgGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#4b5563" roughness={0.6} metalness={0.3} side={THREE.DoubleSide} />
        </mesh>
      </RigidBody>
    </group>
  );
}
