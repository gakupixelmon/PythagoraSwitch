import { useRef, useMemo, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useCourseStore } from '../../store/courseStore';
import { useGameStore } from '../../store/gameStore';

// 色定義
const COL_DEFAULT  = new THREE.Color('#f97316');  // オレンジ
const COL_SELECTED = new THREE.Color('#facc15');  // 黄
const COL_START    = new THREE.Color('#a78bfa');  // 紫
const COL_END      = new THREE.Color('#4ade80');  // 緑
const COL_RAIL     = new THREE.Color('#92400e');  // 茶

/** ノード1個 */
function NodeSphere({ node, index, total }) {
  const { selectedId, select, moveNode } = useCourseStore();
  const { camera, gl, raycaster } = useThree();
  const dragging = useRef(false);
  const dragPlane = useRef(new THREE.Plane());
  const hit = useRef(new THREE.Vector3());
  const meshRef = useRef();

  const isSelected = selectedId === node.id;
  const color = index === 0 ? COL_START : index === total - 1 ? COL_END : isSelected ? COL_SELECTED : COL_DEFAULT;

  const onPointerDown = useCallback((e) => {
    e.stopPropagation();
    select(node.id);
    dragging.current = true;
    // ドラッグ平面: ノードのY高さの水平面
    dragPlane.current.set(new THREE.Vector3(0, 1, 0), -node.y);
    gl.domElement.style.cursor = 'grabbing';
  }, [node, select, gl]);

  const onPointerMove = useCallback((e) => {
    if (!dragging.current) return;
    e.stopPropagation();
    raycaster.setFromCamera(e.pointer, camera);
    if (raycaster.ray.intersectPlane(dragPlane.current, hit.current)) {
      moveNode(node.id, hit.current.x, hit.current.z);
    }
  }, [node.id, camera, raycaster, moveNode]);

  const onPointerUp = useCallback((e) => {
    e.stopPropagation();
    dragging.current = false;
    gl.domElement.style.cursor = '';
  }, [gl]);

  return (
    <mesh
      ref={meshRef}
      position={[node.x, node.y, node.z]}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <sphereGeometry args={[isSelected ? 0.22 : 0.18, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isSelected ? 0.8 : 0.3} />
    </mesh>
  );
}

/** ノード間の線とレールプレビュー */
function RailPreview({ nodes }) {
  const points = useMemo(
    () => nodes.map(n => new THREE.Vector3(n.x, n.y, n.z)),
    [nodes]
  );
  if (points.length < 2) return null;

  return (
    <group>
      {/* 接続線 */}
      <Line points={points} color="#f97316" lineWidth={2} dashed dashScale={2} />
      {/* レール幅プレビュー（フラットボックス） */}
      {nodes.map((a, i) => {
        if (i >= nodes.length - 1) return null;
        const b = nodes[i + 1];
        const s = new THREE.Vector3(a.x, a.y, a.z);
        const e = new THREE.Vector3(b.x, b.y, b.z);
        const dir = e.clone().sub(s);
        const len = dir.length();
        const center = s.clone().add(e).multiplyScalar(0.5);
        const q = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          dir.normalize()
        );
        return (
          <mesh key={i} position={center} quaternion={q}>
            <boxGeometry args={[0.6, 0.06, len]} />
            <meshStandardMaterial color={COL_RAIL} roughness={0.8} transparent opacity={0.75} />
          </mesh>
        );
      })}
    </group>
  );
}

/** グリッドの床（クリックでノード追加） */
function FloorGrid() {
  const { addNode, deselect } = useCourseStore();
  const nodes = useCourseStore(s => s.nodes);

  const onClick = useCallback((e) => {
    e.stopPropagation();
    const last = nodes[nodes.length - 1];
    // 既存ノードに近い場合は無視（誤クリック防止）
    const px = e.point.x, pz = e.point.z;
    const tooClose = nodes.some(n => Math.hypot(n.x - px, n.z - pz) < 0.5);
    if (tooClose) { deselect(); return; }
    addNode(px, pz);
  }, [nodes, addNode, deselect]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -6, 5]}
      onClick={onClick}
      onPointerDown={e => { if (e.button === 0) e.stopPropagation(); }}
    >
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial color="#111827" transparent opacity={0.01} />
    </mesh>
  );
}

/** 作成モードの3Dシーン */
export default function CreationScene() {
  const { nodes, selectedId } = useCourseStore();
  const dragMode = useGameStore(s => s.dragMode);

  return (
    <>
      <ambientLight intensity={0.6} color="#334466" />
      <directionalLight position={[10, 20, 5]} intensity={1.5} color="#fff5e0" />
      <pointLight position={[-5, 10, -5]} intensity={0.8} color="#4488ff" decay={2} />

      {/* グリッド */}
      <Grid
        position={[0, -6.05, 5]}
        args={[40, 40]}
        cellSize={1}
        cellThickness={0.4}
        cellColor="#1e3a5f"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#1e5f8f"
        fadeDistance={60}
        fadeStrength={1}
        infiniteGrid
      />

      {/* 床（クリック判定） */}
      <FloorGrid />

      {/* レールプレビュー */}
      <RailPreview nodes={nodes} />

      {/* ノード */}
      {nodes.map((node, i) => (
        <NodeSphere key={node.id} node={node} index={i} total={nodes.length} />
      ))}

      {/* スタート・ゴールラベル用発光 */}
      {nodes.length > 0 && (
        <pointLight position={[nodes[0].x, nodes[0].y + 0.5, nodes[0].z]} color="#a78bfa" intensity={3} distance={2} decay={2} />
      )}
      {nodes.length > 1 && (
        <pointLight position={[nodes[nodes.length-1].x, nodes[nodes.length-1].y + 0.5, nodes[nodes.length-1].z]} color="#4ade80" intensity={3} distance={2} decay={2} />
      )}

      {/* カメラ */}
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        target={[0, 1, 5]}
        maxPolarAngle={Math.PI * 0.85}
        mouseButtons={{
          LEFT: dragMode === 'rotate' ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: dragMode === 'rotate' ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE
        }}
      />
    </>
  );
}
