import { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { expandCourse } from '../utils/courseData';

/**
 * 直線レールセグメント1本分のコンポーネント
 * - 床板 + 左右ガイドレール壁
 */
function RailSegment({ start, end, width = 0.6, wallHeight = 0.18 }) {
  const s = new THREE.Vector3(...start);
  const e = new THREE.Vector3(...end);
  const dir = e.clone().sub(s);
  const length = dir.length();
  const center = s.clone().add(e).multiplyScalar(0.5);

  // 向きをクォータニオンで計算
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    const forward = dir.clone().normalize();
    // Three.jsのCubeはZ軸正方向が前なのでLookRotation
    const up = new THREE.Vector3(0, 1, 0);
    const matrix = new THREE.Matrix4().lookAt(new THREE.Vector3(0, 0, 0), forward, up);
    q.setFromRotationMatrix(matrix);
    return q;
  }, [dir]);

  const qArr = [quaternion.x, quaternion.y, quaternion.z, quaternion.w];
  const thickness = 0.08;
  const wallThick = 0.04;

  // ガイドレールのオフセット（レール幅方向）
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion);

  return (
    <group>
      {/* 床板 */}
      <RigidBody type="fixed" friction={0.5} restitution={0.1}>
        <mesh
          position={[center.x, center.y, center.z]}
          quaternion={qArr}
          receiveShadow
        >
          <boxGeometry args={[width, thickness, length]} />
          <meshStandardMaterial
            color="#8B5E3C"
            roughness={0.8}
            metalness={0.05}
          />
        </mesh>
      </RigidBody>

      {/* 左ガイド壁 */}
      <RigidBody type="fixed" friction={0.3} restitution={0.05}>
        <mesh
          position={[
            center.x + right.x * (width / 2 + wallThick / 2),
            center.y + wallHeight / 2,
            center.z + right.z * (width / 2 + wallThick / 2),
          ]}
          quaternion={qArr}
          receiveShadow
        >
          <boxGeometry args={[wallThick, wallHeight, length]} />
          <meshStandardMaterial color="#6B4226" roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* 右ガイド壁 */}
      <RigidBody type="fixed" friction={0.3} restitution={0.05}>
        <mesh
          position={[
            center.x - right.x * (width / 2 + wallThick / 2),
            center.y + wallHeight / 2,
            center.z - right.z * (width / 2 + wallThick / 2),
          ]}
          quaternion={qArr}
          receiveShadow
        >
          <boxGeometry args={[wallThick, wallHeight, length]} />
          <meshStandardMaterial color="#6B4226" roughness={0.9} />
        </mesh>
      </RigidBody>
    </group>
  );
}

/**
 * コース全体のレールを描画するコンポーネント
 */
export default function RailCourse({ course }) {
  const expanded = useMemo(() => expandCourse(course.segments), [course]);

  return (
    <group>
      {expanded.map((seg, i) => (
        <RailSegment
          key={i}
          start={seg.start}
          end={seg.end}
          width={seg.width ?? 0.6}
          wallHeight={seg.wallHeight ?? 0.18}
        />
      ))}
    </group>
  );
}
