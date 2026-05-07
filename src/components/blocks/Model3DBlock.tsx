import React, { useEffect, useRef, useState } from 'react';
import { useDocument } from '../../context/DocumentContext';
import { Block } from '../../types';

type ShapeType = 'cube' | 'sphere' | 'torus' | 'cylinder' | 'cone' | 'knot';

const SHAPES: { name: string; type: ShapeType }[] = [
  { name: '立方体', type: 'cube' },
  { name: '球体', type: 'sphere' },
  { name: '圆环', type: 'torus' },
  { name: '圆柱', type: 'cylinder' },
  { name: '圆锥', type: 'cone' },
  { name: '环面纽结', type: 'knot' },
];

export default function Model3DBlock({ block }: { block: Block }) {
  const { updateBlock } = useDocument();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderer, setRenderer] = useState<any>(null);

  const shape = (block.content || 'knot') as ShapeType;

  useEffect(() => {
    if (!canvasRef.current) return;

    let cancelled = false;

    import('three').then(THREE => {
      if (cancelled || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const w = canvas.parentElement!.clientWidth;
      const h = 360;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1b23);

      const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
      camera.position.set(0, 1.5, 4);

      const r = new THREE.WebGLRenderer({ canvas, antialias: true });
      r.setSize(w, h);
      r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      setRenderer(r);

      // lights
      scene.add(new THREE.AmbientLight(0x404060, 1.5));
      const dir = new THREE.DirectionalLight(0xffffff, 1.2);
      dir.position.set(3, 5, 4);
      scene.add(dir);
      const point = new THREE.PointLight(0x6c63ff, 1, 20);
      point.position.set(-3, 2, -2);
      scene.add(point);

      // grid
      const grid = new THREE.GridHelper(10, 20, 0x2e303a, 0x2e303a);
      scene.add(grid);

      // build geometry
      let geo: THREE.BufferGeometry;
      switch (shape) {
        case 'cube': geo = new THREE.BoxGeometry(1.6, 1.6, 1.6, 4, 4, 4); break;
        case 'sphere': geo = new THREE.SphereGeometry(1.2, 64, 64); break;
        case 'torus': geo = new THREE.TorusGeometry(1, 0.4, 32, 100); break;
        case 'cylinder': geo = new THREE.CylinderGeometry(0.8, 0.8, 2, 64); break;
        case 'cone': geo = new THREE.ConeGeometry(1, 2, 64); break;
        default: geo = new THREE.TorusKnotGeometry(0.8, 0.3, 128, 32);
      }

      const mat = new THREE.MeshStandardMaterial({
        color: 0x6c63ff,
        metalness: 0.3,
        roughness: 0.4,
        emissive: 0x1a1050,
        emissiveIntensity: 0.2,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = 1.2;
      scene.add(mesh);

      // wireframe overlay
      const wire = new THREE.LineSegments(
        new THREE.WireframeGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0x8b83ff, transparent: true, opacity: 0.08 })
      );
      wire.position.copy(mesh.position);
      scene.add(wire);

      // mouse drag rotation
      let isDragging = false;
      let prevX = 0, prevY = 0;
      let rotX = 0, rotY = 0;

      const onDown = (e: MouseEvent) => { isDragging = true; prevX = e.clientX; prevY = e.clientY; };
      const onUp = () => { isDragging = false; };
      const onMove = (e: MouseEvent) => {
        if (!isDragging) return;
        rotY += (e.clientX - prevX) * 0.01;
        rotX += (e.clientY - prevY) * 0.01;
        prevX = e.clientX; prevY = e.clientY;
      };
      canvas.addEventListener('mousedown', onDown);
      canvas.addEventListener('mouseup', onUp);
      canvas.addEventListener('mouseleave', onUp);
      canvas.addEventListener('mousemove', onMove);

      // touch support
      const onTouchStart = (e: TouchEvent) => { isDragging = true; prevX = e.touches[0].clientX; prevY = e.touches[0].clientY; };
      const onTouchEnd = () => { isDragging = false; };
      const onTouchMove = (e: TouchEvent) => {
        if (!isDragging) return;
        rotY += (e.touches[0].clientX - prevX) * 0.01;
        rotX += (e.touches[0].clientY - prevY) * 0.01;
        prevX = e.touches[0].clientX; prevY = e.touches[0].clientY;
      };
      canvas.addEventListener('touchstart', onTouchStart);
      canvas.addEventListener('touchend', onTouchEnd);
      canvas.addEventListener('touchmove', onTouchMove);

      let autoAngle = 0;
      const animate = () => {
        if (cancelled) return;
        requestAnimationFrame(animate);
        if (!isDragging) autoAngle += 0.008;
        mesh.rotation.x = rotX + Math.sin(autoAngle * 0.5) * 0.2;
        mesh.rotation.y = rotY + autoAngle;
        wire.rotation.copy(mesh.rotation);
        r.render(scene, camera);
      };
      animate();
    });

    return () => {
      cancelled = true;
      renderer?.dispose();
    };
  }, [shape]);

  return (
    <div className="model3d-block">
      <div className="model3d-header">
        <span className="model3d-title">🌐 3D 模型</span>
        <span className="model3d-hint">鼠标拖拽旋转</span>
      </div>
      <div className="model3d-config">
        <label>形状：</label>
        <select value={shape} onChange={e => updateBlock(block.id, { content: e.target.value })}>
          {SHAPES.map(s => <option key={s.type} value={s.type}>{s.name}</option>)}
        </select>
        <label>颜色：</label>
        <select value={block.output || 'purple'} onChange={e => updateBlock(block.id, { output: e.target.value })}>
          <option value="purple">紫色</option>
          <option value="blue">蓝色</option>
          <option value="cyan">青色</option>
          <option value="green">绿色</option>
          <option value="orange">橙色</option>
          <option value="red">红色</option>
        </select>
      </div>
      <canvas ref={canvasRef} className="model3d-canvas" />
    </div>
  );
}
