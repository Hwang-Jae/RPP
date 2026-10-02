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
  RotateCcw,
  Upload,
  FileText,
  Server,
  Wifi,
  WifiOff,
  CheckCircle2
} from 'lucide-react';

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

const defaultProjectTree = {
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

const RobotVisualizer = ({ joints }) => {
  const mountRef = useRef(null);
  const robotRefs = useRef({});

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.async = true;

    script.onload = () => {
      if (!mountRef.current) return;
      const THREE = window.THREE;

      const container = mountRef.current;
      const width = container.clientWidth || 500;
      const height = container.clientHeight || 350;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0f172a);

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(25, 20, 30);
      camera.lookAt(0, 8, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;

      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0x00f0ff, 0.8);
      dirLight.position.set(20, 40, 20);
      dirLight.castShadow = true;
      scene.add(dirLight);

      const gridHelper = new THREE.GridHelper(40, 20, 0x38bdf8, 0x334155);
      scene.add(gridHelper);

      const matBase = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
      const matJoint = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5, roughness: 0.2 });
      const matArm = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.3, roughness: 0.3 });
      const matTool = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8 });

      const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(4, 5, 2, 32), matBase);
      baseMesh.position.y = 1;
      scene.add(baseMesh);

      const j1Group = new THREE.Group();
      j1Group.position.y = 2;
      scene.add(j1Group);

      const j1Body = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 3, 24), matJoint);
      j1Body.position.y = 1.5;
      j1Group.add(j1Body);

      const j2Group = new THREE.Group();
      j2Group.position.y = 3;
      j1Group.add(j2Group);

      const arm1 = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 2), matArm);
      arm1.position.y = 4;
      j2Group.add(arm1);

      const j3Group = new THREE.Group();
      j3Group.position.y = 8;
      j2Group.add(j3Group);

      const arm2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 7, 1.6), matArm);
      arm2.position.y = 3.5;
      j3Group.add(arm2);

      const j4Group = new THREE.Group();
      j4Group.position.y = 7;
      j3Group.add(j4Group);

      const j5Group = new THREE.Group();
      j4Group.add(j5Group);

      const j6Group = new THREE.Group();
      j6Group.position.y = 1.5;
      j5Group.add(j6Group);

      const toolMesh = new THREE.Mesh(new THREE.ConeGeometry(1, 2.5, 16), matTool);
      toolMesh.rotation.x = Math.PI;
      j6Group.add(toolMesh);

      robotRefs.current = { j1: j1Group, j2: j2Group, j3: j3Group, j4: j4Group, j5: j5Group, j6: j6Group, renderer, scene, camera };

      let isDragging = false;
      let prevMouseX = 0, prevMouseY = 0;

      const handleMouseDown = (e) => { isDragging = true; prevMouseX = e.clientX; prevMouseY = e.clientY; };
      const handleMouseMove = (e) => {
        if (!isDragging) return;
        scene.rotation.y += (e.clientX - prevMouseX) * 0.008;
        camera.position.y = Math.max(5, Math.min(50, camera.position.y - (e.clientY - prevMouseY) * 0.2));
        prevMouseX = e.clientX; prevMouseY = e.clientY;
      };
      const handleMouseUp = () => { isDragging = false; };

      const dom = renderer.domElement;
      dom.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      let animationFrameId;
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };
      animate();

      return () => {
        cancelAnimationFrame(animationFrameId);
        dom.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    };

    document.head.appendChild(script);
    return () => { if (document.head.contains(script)) document.head.removeChild(script); };
  }, []);

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
        3D Robot Kinematics Visualizer (Interactive)
      </div>
    </div>
  );
};

const LadderLogicViewer = ({ tags, selectedPou, onTriggerPosi }) => {
  const getTagValue = (id) => tags.find(t => t.id === id)?.value;
  const startBtn = getTagValue('X001');
  const stopBtn = getTagValue('X002');
  const motor = getTagValue('Y001');

  return (
    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 font-mono text-sm overflow-x-auto space-y-4">
      <div className="flex justify-between items-center bg-slate-800 p-2.5 rounded border border-slate-700 text-xs">
        <span className="text-cyan-400 font-bold flex items-center gap-2">
          <FileCode className="w-4 h-4" /> Selected POU: {selectedPou}
        </span>
        <span className="text-slate-400">IEC 61131-3 Standard Compliant</span>
      </div>

      {selectedPou === '02_QD75' ? (
        <div className="p-4 bg-slate-950 rounded border border-cyan-800/60 space-y-4">
          <div className="text-xs text-cyan-300 font-bold border-b border-slate-800 pb-2 flex justify-between items-center">
            <span>FB: M+D75_StartPosi (Positioning Command)</span>
            <span className="text-green-400">STATUS: READY</span>
          </div>
          <button 
            onClick={onTriggerPosi}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded shadow flex items-center justify-center gap-2 transition-colors text-xs"
          >
            <Play className="w-3.5 h-3.5" /> TRIGGER POSITIONING START (M+D75_StartPosi)
          </button>
        </div>
      ) : (
        <div className="relative border-l-2 border-r-2 border-cyan-500 min-h-[140px] py-4 px-2">
          <div className="flex items-center w-full mb-8 relative">
            <div className="w-12 h-0.5 bg-slate-600"></div>
            <div className="flex flex-col items-center mx-2">
              <span className="text-xs text-slate-400 mb-1">X001 (START)</span>
              <div className={`flex items-center gap-1 ${startBtn ? 'text-green-500' : 'text-slate-500'}`}>
                <div className={`w-1 h-6 ${startBtn ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                <div className="w-4 h-0.5 bg-current"></div>
                <div className={`w-1 h-6 ${startBtn ? 'bg-green-500' : 'bg-slate-500'}`}></div>
              </div>
            </div>
            <div className="flex-1 h-0.5 bg-slate-600"></div>
            <div className="flex flex-col items-center mx-2">
              <span className="text-xs text-slate-400 mb-1">Y001 (RUN)</span>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${motor ? 'border-green-500 text-green-500' : 'border-slate-500 text-slate-500'}`}>
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
  const [activeTab, setActiveTab] = useState('plc');
  const [projectTree, setProjectTree] = useState(defaultProjectTree);
  const [selectedPou, setSelectedPou] = useState('02_QD75');
  const [tags, setTags] = useState(initialPlcTags);
  const [plcStatus, setPlcStatus] = useState('RUN');
  
  const [robotJoints, setRobotJoints] = useState({ j1: 0, j2: 25, j3: -40, j4: 0, j5: 15, j6: 0 });
  const [robotCoords, setRobotCoords] = useState({ x: 450.5, y: -120.2, z: 320.8, rx: 180.0, ry: 45.0, rz: 0.0 });
  const [servoOn, setServoOn] = useState(true);

  const [useBackend, setUseBackend] = useState(false);
  const [uploadFileName, setUploadFileName] = useState(null);
  const [logs, setLogs] = useState([
    { time: '09:00:00', type: 'info', msg: 'System initialized. Upload GX Works2 file or connect backend.' }
  ]);

  const addLog = (msg, type = 'info') => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setLogs(prev => [{ time, type, msg }, ...prev].slice(0, 50));
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadFileName(file.name);
    addLog(`Loading and parsing file: ${file.name}...`);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");

        // Parse POU Names from Diffgram / XML
        const pouNodes = xmlDoc.querySelectorAll("szProjectdataName, szName");
        const detectedPous = new Set();
        let detectedProject = file.name;

        pouNodes.forEach(node => {
          const val = node.textContent;
          if (val.endsWith('.pou') || val.endsWith('.lh') || val.endsWith('.res')) {
            const pouName = val.split('.')[0];
            if (pouName && !pouName.includes('01010000')) {
              detectedPous.add(pouName);
            }
          }
        });

        const parsedPous = Array.from(detectedPous).map(pName => ({
          id: pName,
          type: 'POU',
          desc: `Parsed from uploaded project [${pName}]`
        }));

        if (parsedPous.length > 0) {
          setProjectTree({
            projectName: file.name,
            plcType: "MELSEC-Q Series (Parsed)",
            pous: parsedPous
          });
          setSelectedPou(parsedPous[0].id);
          addLog(`Successfully parsed ${parsedPous.length} POUs from ${file.name}`, 'info');
        } else {
          addLog(`Parsed ${file.name}, used fallback structure.`, 'warning');
        }
      } catch (err) {
        addLog(`Error parsing file: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleTriggerPosi = () => {
    if (!servoOn) {
      addLog('Servo is OFF! Motion command rejected.', 'error');
      return;
    }
    addLog('QD75 Motion Start Command Triggered (M+D75_StartPosi)');
    const targetJ1 = Math.round(Math.random() * 80 - 40);
    const targetJ2 = Math.round(Math.random() * 40 + 10);
    setRobotJoints(prev => ({ ...prev, j1: targetJ1, j2: targetJ2 }));
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-200 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan-600 rounded flex items-center justify-center shadow-[0_0_15px_rgba(8,145,178,0.5)]">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            OmniControl
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('plc')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'plc' ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-800/50 font-medium' : 'text-slate-400 hover:bg-slate-900'}`}
          >
            <Cpu className="w-5 h-5" />
            <span>PLC & File Loader</span>
          </button>

          <button 
            onClick={() => setActiveTab('robot')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'robot' ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-800/50 font-medium' : 'text-slate-400 hover:bg-slate-900'}`}
          >
            <Zap className="w-5 h-5" />
            <span>3D Robot Control</span>
          </button>
        </nav>

        {/* Backend Switch Control */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded border border-slate-800">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-cyan-400" /> Python API
            </span>
            <button 
              onClick={() => {
                setUseBackend(!useBackend);
                addLog(`Switched to ${!useBackend ? 'Python FastAPI Server Mode' : 'Client In-Memory Mode'}`);
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${useBackend ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400'}`}
            >
              {useBackend ? 'ONLINE' : 'LOCAL'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <span>Workspace</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-200 font-semibold capitalize">{activeTab}</span>
          </div>

          <div className="flex items-center gap-3">
            {useBackend ? (
              <span className="text-xs bg-green-950 text-green-400 border border-green-800 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5" /> FastAPI Server Connected
              </span>
            ) : (
              <span className="text-xs bg-slate-800 text-slate-400 border border-slate-700 px-3 py-1 rounded-full flex items-center gap-1.5">
                <WifiOff className="w-3.5 h-3.5" /> Browser Parser Mode
              </span>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'plc' && (
            <>
              {/* File Upload Banner */}
              <div className="bg-slate-800 border-2 border-dashed border-cyan-800/80 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-3 hover:border-cyan-500 transition-colors">
                <Upload className="w-8 h-8 text-cyan-400 animate-bounce" />
                <div>
                  <h3 className="font-bold text-white text-base">GX Works2 / PLC Project File Loader</h3>
                  <p className="text-slate-400 text-xs mt-1">Upload `.prj`, `.xml`, `.diffgram`, or `.pji` file to parse POU architecture dynamically</p>
                </div>
                <label className="cursor-pointer bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-4 py-2 rounded shadow transition-colors flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Select PLC Project File
                  <input type="file" onChange={handleFileUpload} accept=".prj,.xml,.diffgram,.pji,.pou" className="hidden" />
                </label>
                {uploadFileName && (
                  <div className="flex items-center gap-1.5 text-xs text-green-400 font-mono mt-2">
                    <CheckCircle2 className="w-4 h-4" /> Active File: {uploadFileName}
                  </div>
                )}
              </div>

              {/* POU Tree */}
              <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center gap-4 overflow-x-auto">
                <span className="text-xs text-slate-400 font-bold shrink-0 flex items-center gap-1.5">
                  <FolderTree className="w-4 h-4 text-cyan-400" /> POU Explorer:
                </span>
                <div className="flex gap-2">
                  {projectTree.pous.map(pou => (
                    <button
                      key={pou.id}
                      onClick={() => setSelectedPou(pou.id)}
                      className={`px-3 py-1.5 rounded text-xs font-mono transition-colors flex items-center gap-1.5 ${
                        selectedPou === pou.id ? 'bg-cyan-600 text-white font-bold shadow' : 'bg-slate-900 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      {pou.id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logic & Memory Monitor */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-4">
                  <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-400" /> Memory Register Table
                  </h3>
                  <div className="overflow-x-auto max-h-[300px]">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-900">
                        <tr>
                          <th className="p-2 border-b border-slate-700">Device</th>
                          <th className="p-2 border-b border-slate-700">Name</th>
                          <th className="p-2 border-b border-slate-700">Type</th>
                          <th className="p-2 border-b border-slate-700">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {tags.map(tag => (
                          <tr key={tag.id}>
                            <td className="p-2 font-mono text-cyan-400">{tag.id}</td>
                            <td className="p-2">{tag.name}</td>
                            <td className="p-2 text-slate-500">{tag.type}</td>
                            <td className="p-2 font-mono text-yellow-400">{String(tag.value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-4">
                  <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" /> Ladder Logic ({selectedPou})
                  </h3>
                  <LadderLogicViewer tags={tags} selectedPou={selectedPou} onTriggerPosi={handleTriggerPosi} />
                </div>
              </div>
            </>
          )}

          {activeTab === 'robot' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 lg:col-span-1 space-y-4">
                <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" /> Joint Angle Control (deg)
                </h3>
                {['j1', 'j2', 'j3', 'j4', 'j5', 'j6'].map(j => (
                  <div key={j}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="uppercase text-slate-300">{j} Angle</span>
                      <span className="text-cyan-400 font-mono font-bold">{robotJoints[j]}°</span>
                    </div>
                    <input 
                      type="range" min="-180" max="180" value={robotJoints[j]} 
                      onChange={(e) => setRobotJoints({ ...robotJoints, [j]: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-500"
                    />
                  </div>
                ))}
              </div>

              <div className="lg:col-span-2 space-y-6">
                <RobotVisualizer joints={robotJoints} />
              </div>
            </div>
          )}

          {/* Event Log Display */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h3 className="font-semibold text-white text-xs mb-2 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-400" /> Event Logs
            </h3>
            <div className="font-mono text-xs space-y-1 max-h-[120px] overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-4">
                  <span className="text-slate-500">{log.time}</span>
                  <span className={log.type === 'error' ? 'text-red-400' : log.type === 'warning' ? 'text-yellow-400' : 'text-slate-300'}>{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}