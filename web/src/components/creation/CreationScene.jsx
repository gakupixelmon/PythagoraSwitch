import { useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls, Grid, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { useCourseStore } from '../../store/courseStore';
import { useGameStore } from '../../store/gameStore';

import StraightRailObj from '../objects/StraightRailObj';
import CurvedRailObj from '../objects/CurvedRailObj';
import SphereObj from '../objects/SphereObj';
import MainBallObj from '../objects/MainBallObj';
import GoalZoneObj from '../objects/GoalZoneObj';

function EditableObject({ object }) {
  const { selectedId, select, updateObject } = useCourseStore();
  const dragMode = useGameStore(s => s.dragMode); // 'rotate' | 'pan' -> we map this to TransformControls mode
  const isSelected = selectedId === object.id;
  
  let Content = null;
  if (object.type === 'straight_rail') Content = StraightRailObj;
  if (object.type === 'curved_rail') Content = CurvedRailObj;
  if (object.type === 'sphere') Content = SphereObj;
  if (object.type === 'main_ball') Content = MainBallObj;
  if (object.type === 'goal_zone') Content = GoalZoneObj;

  if (!Content) return null;

  // We pass zeroed position/rotation to the Content because the wrapper group handles the transform
  const innerObject = { ...object, position: [0, 0, 0], rotation: [0, 0, 0] };
  const mode = dragMode === 'rotate' ? 'rotate' : 'translate';

  if (isSelected) {
    return (
      <TransformControls
        mode={mode}
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
        <group onClick={(e) => e.stopPropagation()}>
          <Content object={innerObject} isEditMode={true} />
        </group>
      </TransformControls>
    );
  }

  return (
    <group 
      position={object.position} 
      rotation={object.rotation}
      onClick={(e) => {
        e.stopPropagation();
        select(object.id);
      }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <Content object={innerObject} isEditMode={true} />
    </group>
  );
}

/** グリッドの床（クリックで選択解除） */
function FloorGrid() {
  const { deselect } = useCourseStore();
  
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
    >
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#111827" transparent opacity={0.01} />
    </mesh>
  );
}

/** 作成モードの3Dシーン */
export default function CreationScene() {
  const { objects } = useCourseStore();
  const dragMode = useGameStore(s => s.dragMode);

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

      {objects.map(obj => (
        <EditableObject key={obj.id} object={obj} />
      ))}

      <OrbitControls
        makeDefault
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
