import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Cpu, 
  Settings, 
  Sliders, 
  Terminal, 
  LayoutDashboard,
  AlertCircle,
  Play,
  Square,
  RefreshCcw,
  Zap,
  Box,
  Power,
  ChevronRight,
  FolderTree,
  FileCode,
  Database,
  Layers,
  RotateCcw
} from 'lucide-react';

// 미쓰비시 GX Works2 XML (Simple Project_13UDV.prj) 파싱 및 연동 데이터
const initialPlcTags = [
  { id: 'X001', name: 'Start Switch', value: true, type: 'BOOL', desc: 'System Auto Start' },
  { id: 'X002', name: 'Stop Switch', value: false, type: 'BOOL', desc: 'System Emergency Stop' },
  { id: 'Y001', name: 'Tower Lamp Green', value: true, type: 'BOOL', desc: 'Run Status Lamp (99_TS)' },
  { id: 'Y002', name: 'Tower Lamp Red', value: false, type: 'BOOL', desc: 'Alarm Status Lamp' },
  { id: 'M100', name: 'UMODE1_RUN', value: true, type: 'BOOL', desc: 'Unit 1 Auto Mode (00_UNIT)' },
  { id: 'M101', name: 'STEP16_INC', value: false, type: 'BOOL', desc: 'Step Sequence Shift Pulse' },
  { id: 'D100', name: 'Speed Command', value: 1500, type: 'INT', desc: 'Conveyor Motor Target Speed' },
  { id: 'D101', name: 'Q64AD_CH1_VAL', value: 3840, type: 'INT', desc: 'A/D Converter Read Value (01_DATA)' },
  { id: 'D102', name: 'AD_SCL_TEMP', value: 45.8, type: 'REAL', desc: 'Scaled Temperature (°C)' },
  { id: 'D200', name: 'QD75_AXIS1_PV', value: 450.5, type: 'REAL', desc: 'Axis 1 Present Pos (02_QD75)' },
  { id: 'D202', name: 'QD75_AXIS2_PV', value: -120.2, type: 'REAL', desc: 'Axis 2 Present Pos (02_QD75)' },
  { id: 'D300', name: 'CURR_RECIPE_NO', value: 1, type: 'INT', desc: 'Current Active Recipe ID (RECIPE)' },
];

const melsecProjectTree = {
  projectName: "Simple Project_13UDV.prj",
  plcType: "MELSEC-Q (Q13UDV / QD75MH)",
  pous: [
    { id: '00_MAIN', type: 'MAIN', desc: 'Main Scan Loop & System Status' },
    { id: '00_UNIT', type: 'POU', desc: 'Unit Sequence (UMODE, STEP16_SEQ, STEP08_SEQ)' },
    { id: '01_DATA', type: 'POU', desc: 'Analog A/D (Q64AD), Scaling & Recipe Manager' },
    { id: '02_QD75', type: 'POU', desc: 'Motion Controller (QD75MH_MONITOR, M+D75_StartPosi)' },
    { id: '99_TS', type: 'POU', desc: 'Signal Tower & Troubleshooting' },
  ]
};

const initialLogs = [
  { time: '16:00:01', type: 'info', msg: 'System initialized successfully.' },
  { time: '16:02:45', type: 'info', msg: 'GX Works2 Project [Simple Project_13UDV.prj] parsed & linked.' },
  { time: '16:05:12', type: 'info', msg: 'MELSEC Q13UDV + QD75MH Motion Module Connected.' },
  { time: '16:15:30', type: 'warning', msg: 'D101 (Q64AD_CH1) Analog input voltage scaling active.' },
];

const RobotVisualizer = ({ joints }) => {
  const mountRef = useRef(null);
  const robotRefs = useRef({});

  useEffect(() => {
    // Three.js 스크립트 동적 로드
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.async = true;

    script.onload = () => {
      if (!mountRef.current) return;
      const THREE = window.THREE;

      const container = mountRef.current;
      const width = container.clientWidth || 500;
      const height = container.clientHeight || 350;

      // 1. Scene, Camera, Renderer 설정
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0f172a);

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(25, 20, 30);
      camera.lookAt(0, 8, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;

      // 기존 자식 노드 정리 후 추가
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      // 2. 조명 설정
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0x00f0ff, 0.8);
      dirLight.position.set(20, 40, 20);
      dirLight.castShadow = true;
      scene.add(dirLight);

      const pointLight = new THREE.PointLight(0x38bdf8, 1, 50);
      pointLight.position.set(-10, 20, -10);
      scene.add(pointLight);

      // 3. 바닥 및 그리드
      const gridHelper = new THREE.GridHelper(40, 20, 0x38bdf8, 0x334155);
      scene.add(gridHelper);

      // 4. 로봇 6축 메쉬 구축
      const matBase = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
      const matJoint = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5, roughness: 0.2 });
      const matArm = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.3, roughness: 0.3 });
      const matTool = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8 });

      // 베이스
      const baseGeo = new THREE.CylinderGeometry(4, 5, 2, 32);
      const baseMesh = new THREE.Mesh(baseGeo, matBase);
      baseMesh.position.y = 1;
      scene.add(baseMesh);

      // J1 (Base Rotation)
      const j1Group = new THREE.Group();
      j1Group.position.y = 2;
      scene.add(j1Group);

      const j1Body = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 3, 24), matJoint);
      j1Body.position.y = 1.5;
      j1Group.add(j1Body);

      // J2 (Shoulder)
      const j2Group = new THREE.Group();
      j2Group.position.y = 3;
      j1Group.add(j2Group);

      const arm1 = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 2), matArm);
      arm1.position.y = 4;
      j2Group.add(arm1);

      // J3 (Elbow)
      const j3Group = new THREE.Group();
      j3Group.position.y = 8;
      j2Group.add(j3Group);

      const j3JointMesh = new THREE.Mesh(new THREE.SphereGeometry(2, 16, 16), matJoint);
      j3Group.add(j3JointMesh);

      const arm2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 7, 1.6), matArm);
      arm2.position.y = 3.5;
      j3Group.add(arm2);

      // J4 (Wrist Roll)
      const j4Group = new THREE.Group();
      j4Group.position.y = 7;
      j3Group.add(j4Group);

      // J5 (Wrist Pitch)
      const j5Group = new THREE.Group();
      j4Group.add(j5Group);

      const j5JointMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 2, 16), matJoint);
      j5JointMesh.rotation.z = Math.PI / 2;
      j5Group.add(j5JointMesh);

      // J6 (End Effector / Tool)
      const j6Group = new THREE.Group();
      j6Group.position.y = 1.5;
      j5Group.add(j6Group);

      const toolGeo = new THREE.ConeGeometry(1, 2.5, 16);
      const toolMesh = new THREE.Mesh(toolGeo, matTool);
      toolMesh.rotation.x = Math.PI;
      j6Group.add(toolMesh);

      robotRefs.current = {
        j1: j1Group,
        j2: j2Group,
        j3: j3Group,
        j4: j4Group,
        j5: j5Group,
        j6: j6Group,
        renderer,
        scene,
        camera
      };

      // 마우스 드래그 조작 (Orbit)
      let isDragging = false;
      let prevMouseX = 0;
      let prevMouseY = 0;

      const handleMouseDown = (e) => {
        isDragging = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      };

      const handleMouseMove = (e) => {
        if (!isDragging) return;
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;

        scene.rotation.y += deltaX * 0.008;
        camera.position.y = Math.max(5, Math.min(50, camera.position.y - deltaY * 0.2));

        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      };

      const handleMouseUp = () => { isDragging = false; };

      const dom = renderer.domElement;
      dom.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      // 애니메이션 루프
      let animationFrameId;
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };
      animate();

      // 리사이즈 처리
      const handleResize = () => {
        if (!mountRef.current) return;
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', handleResize);

      return () => {
        cancelAnimationFrame(animationFrameId);
        dom.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('resize', handleResize);
      };
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Joints 변경 시 3D 회전 각도 업데이트
  useEffect(() => {
    const { j1, j2, j3, j4, j5, j6 } = robotRefs.current;
    const deg2rad = Math.PI / 180;

    if (j1) j1.rotation.y = joints.j1 * deg2rad;
    if (j2) j2.rotation.z = joints.j2 * deg2rad;
    if (j3) j3.rotation.z = joints.j3 * deg2rad;
    if (j4) j4.rotation.y = joints.j4 * deg2rad;
    if (j5) j5.rotation.z = joints.j5 * deg2rad;
    if (j6) j6.rotation.y = joints.j6 * deg2rad;
  }, [joints]);

  return (
    <div className="relative w-full h-[360px] bg-slate-950 rounded-xl overflow-hidden border border-cyan-900/60 shadow-inner">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-md border border-cyan-800/40 text-xs font-mono text-cyan-300 flex items-center gap-2 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
        3D Interactive Simulator (Drag mouse to rotate view)
      </div>
    </div>
  );
};

const LadderLogicViewer = ({ tags, selectedPou, onTriggerPosi }) => {
  const getTagValue = (id) => tags.find(t => t.id === id)?.value;
  const startBtn = getTagValue('X001');
  const stopBtn = getTagValue('X002');
  const motor = getTagValue('Y001');
  const adVal = getTagValue('D101');
  const adScl = getTagValue('D102');

  return (
    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 font-mono text-sm overflow-x-auto space-y-4">
      {/* POU Header */}
      <div className="flex justify-between items-center bg-slate-800 p-2.5 rounded border border-slate-700 text-xs">
        <span className="text-cyan-400 font-bold flex items-center gap-2">
          <FileCode className="w-4 h-4" /> POU: {selectedPou}
        </span>
        <span className="text-slate-400">Language: Ladder / Function Block (IEC 61131-3)</span>
      </div>

      {selectedPou === '02_QD75' ? (
        /* QD75 Motion Block Simulation */
        <div className="p-4 bg-slate-950 rounded border border-cyan-800/60 space-y-4">
          <div className="text-xs text-cyan-300 font-bold border-b border-slate-800 pb-2 flex justify-between items-center">
            <span>FB: M+D75_StartPosi (Positioning Start)</span>
            <span className="text-green-400">STATUS: READY</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2 bg-slate-900 p-3 rounded border border-slate-800">
              <div className="text-slate-400">IN_W: i_Start_IO_No : <span className="text-yellow-400">H0000</span></div>
              <div className="text-slate-400">IN_W: i_Axis : <span className="text-yellow-400">1 (Axis 1)</span></div>
              <div className="text-slate-400">IN_W: i_StartNo : <span className="text-yellow-400">1 (Pos #1)</span></div>
            </div>
            <div className="space-y-2 bg-slate-900 p-3 rounded border border-slate-800">
              <div className="text-slate-400">OUT_B: FB_OK : <span className="text-green-400">TRUE</span></div>
              <div className="text-slate-400">OUT_W: ERROR_ID : <span className="text-cyan-400">0</span></div>
              <div className="text-slate-400">OUT_D: PV_SPEED : <span className="text-yellow-400">1200 mm/min</span></div>
            </div>
          </div>
          <button 
            onClick={onTriggerPosi}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded shadow flex items-center justify-center gap-2 transition-colors text-xs"
          >
            <Play className="w-3.5 h-3.5" /> TRIGGER POSITIONING START (M+D75_StartPosi)
          </button>
        </div>
      ) : selectedPou === '01_DATA' ? (
        /* Q64AD Analog Scaling FB */
        <div className="p-4 bg-slate-950 rounded border border-slate-800 space-y-3">
          <div className="text-xs text-yellow-400 font-bold border-b border-slate-800 pb-2">
            FB: M+Q64AD_ReadADVal & AD_SCL (Analog Input Scaling)
          </div>
          <div className="flex items-center justify-between text-xs bg-slate-900 p-3 rounded border border-slate-800">
            <div>
              <span className="text-slate-400">CH1 Raw Digit: </span>
              <span className="text-yellow-400 font-bold">{adVal} (0~4000)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <div>
              <span className="text-slate-400">Scaled Value: </span>
              <span className="text-green-400 font-bold">{adScl} °C</span>
            </div>
          </div>
        </div>
      ) : (
        /* Default Ladder View (00_MAIN / 00_UNIT) */
        <div className="relative border-l-2 border-r-2 border-cyan-500 min-h-[160px] py-4 px-2">
          <div className="flex justify-between text-slate-500 text-xs mb-2">
            <span>POWER (L)</span>
            <span>NEUTRAL (N)</span>
          </div>

          {/* Rung 001 */}
          <div className="flex items-center w-full mb-8 relative">
            <div className="w-12 h-0.5 bg-slate-600"></div>
            <div className="flex flex-col items-center mx-2">
              <span className="text-xs text-slate-400 mb-1">X001 (START)</span>
              <div className={`flex items-center gap-1 ${startBtn ? 'text-green-500' : 'text-slate-500'}`}>
                <div className={`w-1 h-6 ${startBtn ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-slate-500'}`}></div>
                <div className="w-4 h-0.5 bg-current"></div>
                <div className={`w-1 h-6 ${startBtn ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-slate-500'}`}></div>
              </div>
            </div>
            <div className="w-8 h-0.5 bg-slate-600"></div>
            
            <div className="flex flex-col items-center mx-2">
              <span className="text-xs text-slate-400 mb-1">X002 (STOP)</span>
              <div className={`flex items-center gap-1 ${!stopBtn ? 'text-green-500' : 'text-slate-500'}`}>
                <div className={`w-1 h-6 ${!stopBtn ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                <div className="relative w-4">
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-current -rotate-45"></div>
                </div>
                <div className={`w-1 h-6 ${!stopBtn ? 'bg-green-500' : 'bg-slate-500'}`}></div>
              </div>
            </div>
            <div className="flex-1 h-0.5 bg-slate-600"></div>
            
            <div className="flex flex-col items-center mx-2">
              <span className="text-xs text-slate-400 mb-1">Y001 (MOTOR)</span>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${motor ? 'border-green-500 text-green-500 shadow-[0_0_12px_#22c55e]' : 'border-slate-500 text-slate-500'}`}>
                ( )
              </div>
            </div>
            <div className="w-12 h-0.5 bg-slate-600"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPou, setSelectedPou] = useState('02_QD75');
  
  // State for PLC
  const [tags, setTags] = useState(initialPlcTags);
  const [plcStatus, setPlcStatus] = useState('RUN');
  
  // State for Robot Joints
  const [robotJoints, setRobotJoints] = useState({ j1: 0, j2: 25, j3: -40, j4: 0, j5: 15, j6: 0 });
  const [robotCoords, setRobotCoords] = useState({ x: 450.5, y: -120.2, z: 320.8, rx: 180.0, ry: 45.0, rz: 0.0 });
  const [servoOn, setServoOn] = useState(true);

  const [logs, setLogs] = useState(initialLogs);

  const addLog = (msg, type = 'info') => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setLogs(prev => [{ time, type, msg }, ...prev].slice(0, 50));
  };

  // QD75 위치결정 시작 트리거 시 3D 로봇 모션 시뮬레이션
  const handleTriggerPosi = () => {
    if (!servoOn) {
      addLog('Servo is OFF! Cannot perform positioning.', 'error');
      return;
    }
    addLog('QD75 Axis #1 Positioning Command Triggered (M+D75_StartPosi)');
    const targetJ1 = Math.round(Math.random() * 80 - 40);
    const targetJ2 = Math.round(Math.random() * 40 + 10);
    const targetJ3 = Math.round(-Math.random() * 50 - 10);

    setRobotJoints(prev => ({ ...prev, j1: targetJ1, j2: targetJ2, j3: targetJ3 }));
    setRobotCoords(prev => ({
      ...prev,
      x: +(450 + targetJ1 * 2).toFixed(1),
      y: +(100 + targetJ2 * 1.5).toFixed(1),
      z: +(300 + targetJ3).toFixed(1),
    }));

    setTags(prev => prev.map(t => {
      if (t.id === 'D200') return { ...t, value: +(450 + targetJ1 * 2).toFixed(1) };
      return t;
    }));
  };

  // 타이머 기반 아날로그 레지스터 주기적 변경
  useEffect(() => {
    const timer = setInterval(() => {
      setTags(prev => prev.map(tag => {
        if (tag.id === 'D101') {
          const raw = 3800 + Math.floor(Math.random() * 80);
          return { ...tag, value: raw };
        }
        if (tag.id === 'D102') {
          return { ...tag, value: +(45 + Math.random() * 2).toFixed(1) };
        }
        return tag;
      }));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const handleJointChange = (joint, value) => {
    if (!servoOn) return;
    const val = parseFloat(value);
    setRobotJoints(prev => {
      const next = { ...prev, [joint]: val };
      setRobotCoords({
        x: +(450 + next.j1 * 2 + next.j2).toFixed(1),
        y: +(-120 + next.j4 * 1.2).toFixed(1),
        z: +(320 + next.j3 * 1.5).toFixed(1),
        rx: +(180 + next.j5).toFixed(1),
        ry: +(45 + next.j6).toFixed(1),
        rz: 0.0
      });
      return next;
    });
  };

  const handleTagToggle = (id) => {
    setTags(prev => prev.map(t => t.id === id ? { ...t, value: !t.value } : t));
    addLog(`Tag ${id} state manually toggled.`);
  };

  const handlePlcState = () => {
    const nextState = plcStatus === 'RUN' ? 'STOP' : 'RUN';
    setPlcStatus(nextState);
    addLog(`PLC Mode changed to ${nextState}`, nextState === 'STOP' ? 'warning' : 'info');
  };

  const handleServo = () => {
    setServoOn(!servoOn);
    addLog(`Robot Servo ${!servoOn ? 'ON' : 'OFF'}`);
  };

  const handleResetJoints = () => {
    setRobotJoints({ j1: 0, j2: 25, j3: -40, j4: 0, j5: 15, j6: 0 });
    setRobotCoords({ x: 450.5, y: -120.2, z: 320.8, rx: 180.0, ry: 45.0, rz: 0.0 });
    addLog('Robot joint positions reset to Home Pose.');
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 font-semibold text-sm">SYSTEM STATUS</h3>
            <Activity className="text-green-400 w-5 h-5 animate-pulse" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">ONLINE</div>
          <p className="text-slate-500 text-sm">MELSEC Q13UDV & YRC1000 Connected</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 font-semibold text-sm">ACTIVE PLCs</h3>
            <Cpu className="text-cyan-400 w-5 h-5" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">3 / 3</div>
          <p className="text-slate-500 text-sm">Line A, Line B, Packaging</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 font-semibold text-sm">ACTIVE ROBOTS</h3>
            <Zap className="text-purple-400 w-5 h-5" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">5 / 6</div>
          <p className="text-slate-500 text-sm">Welding R3 Standby</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-400" />
              Event Logs
            </h3>
          </div>
          <div className="p-4 flex-1 overflow-y-auto max-h-[300px] font-mono text-sm space-y-2">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-4">
                <span className="text-slate-500">{log.time}</span>
                <span className={`
                  ${log.type === 'error' ? 'text-red-400' : ''}
                  ${log.type === 'warning' ? 'text-yellow-400' : ''}
                  ${log.type === 'info' ? 'text-slate-300' : ''}
                `}>
                  {log.msg}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-6">
           <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Box className="w-4 h-4 text-slate-400" />
              Workcell Map Overview
           </h3>
           <div className="w-full h-[250px] bg-slate-900 rounded border border-slate-700 relative overflow-hidden flex items-center justify-center">
              <div className="absolute top-1/4 left-1/4 w-14 h-12 bg-cyan-900/80 border border-cyan-500 rounded flex items-center justify-center text-xs text-cyan-300 font-mono">Q13UDV</div>
              <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-purple-900/80 border border-purple-500 rounded-full flex items-center justify-center text-xs text-purple-300 font-mono">ROBOT1</div>
              <div className="absolute bottom-1/4 right-1/4 w-16 h-16 bg-purple-900/80 border border-purple-500 rounded-full flex items-center justify-center text-xs text-purple-300 font-mono">ROBOT2</div>
              <div className="w-full h-0.5 bg-slate-700 absolute top-1/2 -z-10 shadow-[0_0_10px_rgba(255,255,255,0.1)]"></div>
              <span className="absolute bottom-2 right-2 text-slate-600 text-xs font-mono">Cell: Assembly Line A</span>
           </div>
        </div>
      </div>
    </div>
  );

  const renderPLC = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-lg">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">Master PLC ({melsecProjectTree.plcType})</h2>
            <span className="text-xs bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 px-2 py-0.5 rounded font-mono">
              Project: {melsecProjectTree.projectName}
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">IP: 192.168.10.100 | Scan Time: 1.2ms | QD75MH Motion Link Active</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2 mr-4">
            <div className={`w-3 h-3 rounded-full ${plcStatus === 'RUN' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-slate-300 font-bold">{plcStatus}</span>
          </div>
          <button onClick={handlePlcState} className={`px-4 py-2 rounded font-semibold flex items-center gap-2 transition-colors ${plcStatus === 'RUN' ? 'bg-red-900/50 text-red-400 hover:bg-red-900' : 'bg-green-900/50 text-green-400 hover:bg-green-900'}`}>
            {plcStatus === 'RUN' ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {plcStatus === 'RUN' ? 'STOP' : 'START'}
          </button>
        </div>
      </div>

      {/* POU Tree Explorer */}
      <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-lg flex items-center gap-4 overflow-x-auto">
        <div className="flex items-center gap-2 text-slate-400 font-semibold text-xs shrink-0">
          <FolderTree className="w-4 h-4 text-cyan-400" />
          POU Explorer:
        </div>
        <div className="flex gap-2">
          {melsecProjectTree.pous.map(pou => (
            <button
              key={pou.id}
              onClick={() => setSelectedPou(pou.id)}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-colors flex items-center gap-1.5 ${
                selectedPou === pou.id 
                  ? 'bg-cyan-600 text-white font-bold shadow' 
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              {pou.id}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Memory Table */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg flex flex-col">
          <div className="p-4 border-b border-slate-700 flex justify-between items-center">
             <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
                <Database className="w-4 h-4 text-cyan-400" />
                MELSEC Device Memory Monitor (I/O & Registers)
             </h3>
             <button className="p-1 hover:bg-slate-700 rounded text-slate-400"><RefreshCcw className="w-4 h-4" /></button>
          </div>
          <div className="p-0 flex-1 overflow-auto max-h-[380px]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-900/50 sticky top-0">
                <tr>
                  <th className="p-3 border-b border-slate-700 text-slate-400 font-medium text-sm">Device ID</th>
                  <th className="p-3 border-b border-slate-700 text-slate-400 font-medium text-sm">Name</th>
                  <th className="p-3 border-b border-slate-700 text-slate-400 font-medium text-sm">Type</th>
                  <th className="p-3 border-b border-slate-700 text-slate-400 font-medium text-sm">Value</th>
                  <th className="p-3 border-b border-slate-700 text-slate-400 font-medium text-sm">Force</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {tags.map(tag => (
                  <tr key={tag.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="p-3 font-mono text-cyan-400 text-sm">{tag.id}</td>
                    <td className="p-3 text-slate-300 text-sm">{tag.name}</td>
                    <td className="p-3 text-slate-500 text-sm">{tag.type}</td>
                    <td className="p-3 font-mono text-sm">
                      {tag.type === 'BOOL' ? (
                        <span className={`px-2 py-1 rounded text-xs font-bold ${tag.value ? 'bg-green-900/80 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                          {tag.value ? 'ON' : 'OFF'}
                        </span>
                      ) : (
                        <span className="text-yellow-400">{tag.value}</span>
                      )}
                    </td>
                    <td className="p-3">
                      {tag.type === 'BOOL' && (
                        <button onClick={() => handleTagToggle(tag.id)} className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-slate-300 transition-colors">
                          Toggle
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Logic Viewer */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg flex flex-col">
          <div className="p-4 border-b border-slate-700 flex justify-between items-center">
             <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
                <Layers className="w-4 h-4 text-cyan-400" />
                Logic Programming View ({selectedPou})
             </h3>
          </div>
          <div className="p-4 flex-1">
             <LadderLogicViewer 
               tags={tags} 
               selectedPou={selectedPou} 
               onTriggerPosi={handleTriggerPosi}
             />
          </div>
        </div>
      </div>
    </div>
  );

  const renderRobot = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white">Robot Arm (Yaskawa GP-Series 6-Axis)</h2>
          <p className="text-slate-400 text-sm">Controller: YRC1000 | IP: 192.168.10.101 | Motion Link: MELSEC QD75MH</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2 mr-4">
             <span className="text-slate-400 text-sm font-medium">SERVO</span>
             <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${servoOn ? 'bg-green-500' : 'bg-slate-600'}`} onClick={handleServo}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${servoOn ? 'translate-x-6' : 'translate-x-0'}`}></div>
             </div>
          </div>
          <button onClick={handleResetJoints} className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded font-medium flex items-center gap-1.5 transition-colors text-xs">
            <RotateCcw className="w-3.5 h-3.5" />
            RESET POSE
          </button>
          <button className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded font-semibold flex items-center gap-2 transition-colors text-xs">
            <Power className="w-4 h-4" />
            RESET ALARM
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Joint Controls */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-6 lg:col-span-1">
          <h3 className="font-semibold text-white mb-6 flex items-center gap-2 text-sm">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Joint Angle Control (deg)
          </h3>
          <div className="space-y-4">
            {['j1', 'j2', 'j3', 'j4', 'j5', 'j6'].map((joint) => (
              <div key={joint}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-semibold uppercase">{joint} Angle</span>
                  <span className="text-cyan-400 font-mono font-bold">{robotJoints[joint].toFixed(1)}°</span>
                </div>
                <input 
                  type="range" 
                  min="-180" 
                  max="180" 
                  step="0.5"
                  value={robotJoints[joint]}
                  onChange={(e) => handleJointChange(joint, e.target.value)}
                  disabled={!servoOn}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${servoOn ? 'bg-slate-700 accent-cyan-500' : 'bg-slate-800 accent-slate-600 opacity-50 cursor-not-allowed'}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 3D Visualizer & Cartesian Coordinates */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          {/* 3D Visualizer Canvas */}
          <RobotVisualizer joints={robotJoints} />

          {/* Cartesian Coordinates Display */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-white mb-4 text-sm">Cartesian World Coordinates</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(robotCoords).map(([axis, val]) => (
                <div key={axis} className="bg-slate-900 p-3 rounded border border-slate-700 flex justify-between items-center">
                  <span className="text-slate-400 uppercase font-bold text-xs">{axis}</span>
                  <span className="text-green-400 font-mono text-base font-bold">
                    {val.toFixed(1)} <span className="text-xs text-slate-500 font-normal">{['rx','ry','rz'].includes(axis) ? 'deg' : 'mm'}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-900 text-slate-200 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan-600 rounded flex items-center justify-center shadow-[0_0_15px_rgba(8,145,178,0.5)]">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            OmniControl
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-800/50 font-medium' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('plc')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'plc' ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-800/50 font-medium' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
          >
            <Cpu className="w-5 h-5" />
            <span>PLC Programming</span>
          </button>

          <button 
            onClick={() => setActiveTab('robot')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'robot' ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-800/50 font-medium' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
          >
            <Zap className="w-5 h-5" />
            <span>Robot Control (3D)</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:bg-slate-900 hover:text-slate-300 transition-colors">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <span>Workspace</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-200 font-semibold capitalize">{activeTab}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-slate-300 font-mono">GX Works2 Link: Connected</span>
            </div>
            <button className="text-slate-400 hover:text-white transition-colors">
              <AlertCircle className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Dynamic Tab View */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'plc' && renderPLC()}
          {activeTab === 'robot' && renderRobot()}
        </div>
      </main>
    </div>
  );
}