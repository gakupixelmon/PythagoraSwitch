import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import * as THREE from 'three';

const evaluator = new Evaluator();

/**
 * ベースジオメトリに穴を差し引いた新しいジオメトリを返す。
 * @param {THREE.BufferGeometry} baseGeo
 * @param {Array} holes  [{ localX, localY, localZ, normalX, normalY, normalZ, shape, radius }]
 * @returns {THREE.BufferGeometry}
 */
export function applyHoles(baseGeo, holes) {
  if (!holes || holes.length === 0) return baseGeo;

  let baseBrush = new Brush(baseGeo.clone());
  baseBrush.updateMatrixWorld();

  for (const hole of holes) {
    const {
      localX = 0, localY = 0, localZ = 0,
      normalX = 0, normalY = 1, normalZ = 0,
      shape = 'circle',
      radius = 0.25,
    } = hole;

    // 穴のジオメトリ（法線方向に十分長い円柱/箱）
    const depth = 6; // 貫通するのに十分な長さ
    let holeGeo;
    if (shape === 'square') {
      holeGeo = new THREE.BoxGeometry(radius * 2, depth, radius * 2);
    } else {
      holeGeo = new THREE.CylinderGeometry(radius, radius, depth, 24);
    }

    const holeBrush = new Brush(holeGeo);

    // 穴の向きを法線に合わせる
    const normal = new THREE.Vector3(normalX, normalY, normalZ).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, normal);
    holeBrush.quaternion.copy(quat);
    holeBrush.position.set(localX, localY, localZ);
    holeBrush.updateMatrixWorld();

    try {
      baseBrush = evaluator.evaluate(baseBrush, holeBrush, SUBTRACTION);
    } catch (e) {
      console.warn('[applyHoles] CSG failed for hole:', hole, e);
    }
  }

  return baseBrush.geometry;
}
