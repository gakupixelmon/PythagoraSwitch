import { useCallback, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, TransformControls, Hud, OrthographicCamera } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { useMemo } from 'react';
import * as THREE from 'three';
import { useCourseStore } from '../../store/courseStore';
import { useGameStore } from '../../store/gameStore';

import StraightRailObj from '../objects/StraightRailObj';
import CurvedRailObj from '../objects/CurvedRailObj';
import SphereObj from '../objects/SphereObj';
import MainBallObj from '../objects/MainBallObj';
import GoalZoneObj from '../objects/GoalZoneObj';
import SeesawObj from '../objects/SeesawObj';
import CupObj from '../objects/CupObj';
import FunnelObj from '../objects/FunnelObj';
import HolePlateObj from '../objects/HolePlateObj';

const _vec3 = new THREE.Vector3();

/** ホバー中オブジェクトの画面座標をZustandに送信するヘルパー */
function HoverTracker({ objectId, groupRef }) {
  const { camera, size } = useThree();
  const setHoveredInfo = useGameStore(s => s.setHoveredInfo);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.getWorldPosition(_vec3);
    _vec3.project(camera);
    const x = (_vec3.x * 0.5 + 0.5) * size.width;
    const y = (1 - (_vec3.y * 0.5 + 0.5)) * size.height;
    setHoveredInfo(objectId, { x, y });
  });

  return null;
}

function EditableObject({ object }) {
  const { selectedId, select, updateObject, addHole } = useCourseStore();
  const transformMode = useGameStore(s => s.transformMode);
  const setHoveredInfo = useGameStore(s => s.setHoveredInfo);
  const clearHovered = useGameStore(s => s.clearHovered);
  const hoveredId = useGameStore(s => s.hoveredId);
  const holeMode = useGameStore(s => s.holeMode);
  const holeConfig = useGameStore(s => s.holeConfig);

  const isSelected = selectedId === object.id;
  const isHovered = hoveredId === object.id;
  const groupRef = useRef();

  let Content = null;
  if (object.type === 'straight_rail') Content = StraightRailObj;
  if (object.type === 'curved_rail')   Content = CurvedRailObj;
  if (object.type === 'sphere')        Content = SphereObj;
  if (object.type === 'main_ball')     Content = MainBallObj;
  if (object.type === 'goal_zone')     Content = GoalZoneObj;
  if (object.type === 'seesaw')        Content = SeesawObj;
  if (object.type === 'cup')           Content = CupObj;
  if (object.type === 'funnel')        Content = FunnelObj;
  if (object.type === 'hole_plate')    Content = HolePlateObj;

  if (!Content) return null;

  const innerObject = { ...object, position: [0, 0, 0], rotation: [0, 0, 0] };

  // 穴開けハンドラ
  const handlePointerDown = (e) => {
    if (holeMode && isSelected) {
      e.stopPropagation();
      if (!groupRef.current) return;
      const point = e.point.clone();
      groupRef.current.worldToLocal(point);
      const normal = e.face ? e.face.normal.clone() : new THREE.Vector3(0, 1, 0);
      
      addHole(object.id, {
        localX: point.x, localY: point.y, localZ: point.z,
        normalX: normal.x, normalY: normal.y, normalZ: normal.z,
        shape: holeConfig.shape,
        radius: holeConfig.radius
      });
    }
  };

  if (isSelected) {
    return (
      <>
        <TransformControls
          mode={transformMode}
          position={object.position}
          rotation={object.rotation}
          onMouseUp={(e) => {
            if (e.target.object) {
              const p = e.target.object.position;
              const r = e.target.object.rotation;
              updateObject(object.id, {
                position: [p.x, p.y, p.z],
                rotation: [r.x, r.y, r.z]
              });
            }
          }}
        >
          <group ref={groupRef} onClick={(e) => { if(!holeMode) e.stopPropagation(); }} onPointerDown={handlePointerDown}>
            <Content object={innerObject} isEditMode={true} />
          </group>
        </TransformControls>
        {isHovered && !holeMode && <HoverTracker objectId={object.id} groupRef={groupRef} />}
      </>
    );
  }

  return (
    <group
      ref={groupRef}
      position={object.position}
      rotation={object.rotation}
      onClick={(e) => {
        if (holeMode) return;
        e.stopPropagation();
        select(object.id);
      }}
      onPointerDown={handlePointerDown}
      onPointerOver={(e) => {
        if (holeMode) return;
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
        // 画面座標を計算してストアへ
        if (groupRef.current) {
          const worldPos = new THREE.Vector3();
          groupRef.current.getWorldPosition(worldPos);
          setHoveredInfo(object.id, null); // まず ID だけセット（frame で座標更新）
        }
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
        clearHovered();
      }}
    >
      <Content object={innerObject} isEditMode={true} />
      {isHovered && !holeMode && <HoverTracker objectId={object.id} groupRef={groupRef} />}
    </group>
  );
}

/** グリッドの床（クリックで選択解除） */
function FloorGrid() {
  const { deselect } = useCourseStore();
  const clearHovered = useGameStore(s => s.clearHovered);

  const onClick = useCallback((e) => {
    e.stopPropagation();
    deselect();
  }, [deselect]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -6, 5]}
      onClick={onClick}
      onPointerDown={e => { if (e.button === 0) e.stopPropagation(); }}
      onPointerOver={() => { document.body.style.cursor = 'auto'; clearHovered(); }}
    >
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#111827" transparent opacity={0.01} />
    </mesh>
  );
}

function ViewCube({ mainCamera, setView }) {
  const { size } = useThree();
  const cubeRef = useRef();

  const materials = useMemo(() => {
    const createFace = (text, color) => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 128, 128);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, 128, 128);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 64, 64);
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      return new THREE.MeshBasicMaterial({ map: tex });
    };
    return [
      createFace('右', '#3b82f6'),
      createFace('左', '#3b82f6'),
      createFace('上', '#10b981'),
      createFace('下', '#10b981'),
      createFace('前', '#ef4444'),
      createFace('後', '#ef4444'),
    ];
  }, []);

  useFrame(() => {
    if (cubeRef.current && mainCamera) {
      cubeRef.current.quaternion.copy(mainCamera.quaternion).invert();
    }
  });

  const handleFaceClick = (e) => {
    e.stopPropagation();
    const faceIndex = e.face?.materialIndex;
    const dist = 6;
    switch (faceIndex) {
      case 0: setView(dist, 0, 0); break; // right
      case 1: setView(-dist, 0, 0); break; // left
      case 2: setView(0, dist, 0); break; // top
      case 3: setView(0, -dist, 0); break; // bottom
      case 4: setView(0, 0, dist); break; // front
      case 5: setView(0, 0, -dist); break; // back
      default: break;
    }
  };

  const handleCornerClick = (x, y, z) => (e) => {
    e.stopPropagation();
    const dist = 6;
    setView(Math.sign(x) * dist, Math.sign(y) * dist, Math.sign(z) * dist);
  };

  return (
    <Hud renderPriority={1}>
      <OrthographicCamera makeDefault position={[0, 0, 100]} zoom={1} />
      <ambientLight intensity={1} />
      <group position={[size.width / 2 - 80, size.height / 2 - 80, 0]}>
        <mesh 
          ref={cubeRef} 
          onClick={handleFaceClick}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => document.body.style.cursor = 'auto'}
          material={materials}
        >
          <boxGeometry args={[60, 60, 60]} />
          {[-30, 30].map(x => 
            [-30, 30].map(y => 
              [-30, 30].map(z => (
                <mesh key={`${x}${y}${z}`} position={[x, y, z]} onClick={handleCornerClick(x, y, z)}>
                  <sphereGeometry args={[10, 16, 16]} />
                  <meshBasicMaterial color="#fcd34d" />
                </mesh>
              ))
            )
          )}
        </mesh>
      </group>
    </Hud>
  );
}

/** 穴開け専用の隔離されたシーン */
function IsolatedHoleScene({ object }) {
  const { camera } = useThree();
  const { addHole } = useCourseStore();
  const holeConfig = useGameStore(s => s.holeConfig);
  const dragMode = useGameStore(s => s.dragMode);
  const groupRef = useRef();
  const downPos = useRef({ x: 0, y: 0 });

  const setView = (x, y, z) => {
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
  };

  let Content = null;
  if (object.type === 'straight_rail') Content = StraightRailObj;
  if (object.type === 'curved_rail')   Content = CurvedRailObj;
  if (object.type === 'sphere')        Content = SphereObj;
  if (object.type === 'main_ball')     Content = MainBallObj;
  if (object.type === 'goal_zone')     Content = GoalZoneObj;
  if (object.type === 'seesaw')        Content = SeesawObj;
  if (object.type === 'cup')           Content = CupObj;
  if (object.type === 'funnel')        Content = FunnelObj;
  if (object.type === 'hole_plate')    Content = HolePlateObj;

  if (!Content) return null;

  const handlePointerDown = (e) => {
    downPos.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
  };

  const handlePointerUp = (e) => {
    e.stopPropagation();
    
    // ドラッグ距離を計算し、視点移動と区別する
    const dx = e.nativeEvent.clientX - downPos.current.x;
    const dy = e.nativeEvent.clientY - downPos.current.y;
    if (Math.sqrt(dx * dx + dy * dy) > 5) return; // 5px以上移動した場合はドラッグとみなす

    if (!groupRef.current) return;
    const point = e.point.clone();
    groupRef.current.worldToLocal(point);
    const normal = e.face ? e.face.normal.clone() : new THREE.Vector3(0, 1, 0);
    
    addHole(object.id, {
      localX: point.x, localY: point.y, localZ: point.z,
      normalX: normal.x, normalY: normal.y, normalZ: normal.z,
      shape: holeConfig.shape,
      radius: holeConfig.radius
    });
  };

  const innerObject = { ...object, position: [0, 0, 0], rotation: [0, 0, 0] };

  return (
    <>
      <color attach="background" args={['#0f172a']} />
      <ambientLight intensity={0.9} color="#e2e8f0" />
      <directionalLight position={[10, 20, 10]} intensity={1.5} color="#ffffff" />
      
      <Grid
        position={[0, -1.5, 0]}
        args={[20, 20]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#334155"
        sectionSize={2.5}
        sectionThickness={1}
        sectionColor="#475569"
        fadeDistance={20}
        infiniteGrid
      />

      <Physics paused={true}>
        <group ref={groupRef} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'crosshair'; }} onPointerOut={() => { document.body.style.cursor = 'auto'; }}>
          <Content object={innerObject} isEditMode={true} />
        </group>
      </Physics>

      <ViewCube mainCamera={camera} setView={setView} />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        target={[0, 0, 0]}
        mouseButtons={{
          LEFT:   dragMode === 'rotate' ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT:  dragMode === 'rotate' ? THREE.MOUSE.PAN   : THREE.MOUSE.ROTATE
        }}
      />
    </>
  );
}

/** 作成モードの3Dシーン */
export default function CreationScene() {
  const { camera } = useThree();
  const { objects, selectedId } = useCourseStore();
  const dragMode = useGameStore(s => s.dragMode);
  const holeMode = useGameStore(s => s.holeMode);

  const setView = (x, y, z) => {
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
  };

  if (holeMode && selectedId) {
    const selectedObj = objects.find(o => o.id === selectedId);
    if (selectedObj) {
      return <IsolatedHoleScene object={selectedObj} />;
    }
  }

  return (
    <>
      <ambientLight intensity={0.6} color="#334466" />
      <directionalLight position={[10, 20, 5]} intensity={1.5} color="#fff5e0" />
      <pointLight position={[-5, 10, -5]} intensity={0.8} color="#4488ff" decay={2} />

      {/* グリッド */}
      <Grid
        position={[0, -6.05, 5]}
        args={[100, 100]}
        cellSize={1}
        cellThickness={0.4}
        cellColor="#1e3a5f"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#1e5f8f"
        fadeDistance={80}
        fadeStrength={1}
        infiniteGrid
      />

      <FloorGrid />

      <Physics paused={true}>
        {objects.map(obj => (
          <EditableObject key={obj.id} object={obj} />
        ))}
      </Physics>

      <ViewCube mainCamera={camera} setView={setView} />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        target={[0, 1, 5]}
        maxPolarAngle={Math.PI * 0.85}
        mouseButtons={{
          LEFT:   dragMode === 'rotate' ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT:  dragMode === 'rotate' ? THREE.MOUSE.PAN   : THREE.MOUSE.ROTATE
        }}
      />
    </>
  );
}
