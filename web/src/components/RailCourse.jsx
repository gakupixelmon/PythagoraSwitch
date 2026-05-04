import { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

function StraightRail({ start, end, width = 0.65 }) {
  const s = useMemo(() => new THREE.Vector3(...start), [start]);
  const e = useMemo(() => new THREE.Vector3(...end),   [end]);

  const { center, quaternion, length } = useMemo(() => {
    const dir    = e.clone().sub(s);
    const length = dir.length();
    const center = s.clone().add(e).multiplyScalar(0.5);
    const q = new THREE.Quaternion();
    const fwd = dir.normalize();
    const up  = new THREE.Vector3(0, 1, 0);
    const m   = new THREE.Matrix4().lookAt(new THREE.Vector3(), fwd, up);
    q.setFromRotationMatrix(m);
    return { center, quaternion: q, length };
  }, [s, e]);

  const qArr = [quaternion.x, quaternion.y, quaternion.z, quaternion.w];
  const right = useMemo(() => new THREE.Vector3(1,0,0).applyQuaternion(quaternion), [quaternion]);

  const thick = 0.08;
  const wallH = 0.18;
  const wallT = 0.04;
  const halfW = width / 2;

  return (
    <group>
      {/* 床板 */}
      <RigidBody type="fixed" friction={0.5} restitution={0.1}>
        <mesh position={center.toArray()} quaternion={qArr} receiveShadow>
          <boxGeometry args={[width, thick, length]} />
          <meshStandardMaterial color="#92400e" roughness={0.85} metalness={0.05} />
        </mesh>
      </RigidBody>

      {/* 左壁 */}
      <RigidBody type="fixed" friction={0.3} restitution={0.05}>
        <mesh
          position={[center.x + right.x*(halfW+wallT/2), center.y+wallH/2, center.z+right.z*(halfW+wallT/2)]}
          quaternion={qArr}
        >
          <boxGeometry args={[wallT, wallH, length]} />
          <meshStandardMaterial color="#78350f" roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* 右壁 */}
      <RigidBody type="fixed" friction={0.3} restitution={0.05}>
        <mesh
          position={[center.x - right.x*(halfW+wallT/2), center.y+wallH/2, center.z - right.z*(halfW+wallT/2)]}
          quaternion={qArr}
        >
          <boxGeometry args={[wallT, wallH, length]} />
          <meshStandardMaterial color="#78350f" roughness={0.9} />
        </mesh>
      </RigidBody>
    </group>
  );
}

export default function RailCourse({ course }) {
  return (
    <group>
      {course.segments.map((seg, i) => (
        <StraightRail key={i} start={seg.start} end={seg.end} width={seg.width ?? 0.65} />
      ))}
    </group>
  );
}
