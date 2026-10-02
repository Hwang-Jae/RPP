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
  ChevronRight
} from 'lucide-react';

// 초기 PLC 태그 데이터
const initialPlcTags = [
  { id: 'X001', name: 'Start Button', value: false, type: 'BOOL', desc: 'Main conveyor start' },
  { id: 'X002', name: 'Stop Button', value: false, type: 'BOOL', desc: 'Main conveyor stop' },
  { id: 'Y001', name: 'Motor Run', value: true, type: 'BOOL', desc: 'Conveyor motor status' },
  { id: 'Y002', name: 'Error Lamp', value: false, type: 'BOOL', desc: 'System error indicator' },
  { id: 'D100', name: 'Speed Command', value: 1500, type: 'INT', desc: 'Motor speed (RPM)' },
  { id: 'D101', name: 'Current Temp', value: 45, type: 'INT', desc: 'Motor temperature (C)' },
  { id: 'D102', name: 'Target Pos X', value: 250, type: 'REAL', desc: 'Target X coordinate' },
];

// 초기 시스템 로그
const initialLogs = [
  { time: '16:00:01', type: 'info', msg: 'System initialized successfully.' },
  { time: '16:02:45', type: 'info', msg: 'PLC [192.168.1.10] connected.' },
  { time: '16:05:12', type: 'info', msg: 'Robot [Yaskawa GP8] connected.' },
  { time: '16:15:30', type: 'warning', msg: 'D101 (Temp) is slightly high.' },
];

// 로봇 2D 시뮬레이터 컴포넌트
const RobotVisualizer = ({ joints }) => {
  return (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-slate-800 rounded-lg border border-slate-700 overflow-hidden relative">
      <div className="absolute top-4 left-4 text-slate-400 text-sm font-mono">
        LIVE RENDER: J1-J6 Kinematics View
      </div>
      <svg width="300" height="300" viewBox="-150 -150 300 300">
        <defs>
          <linearGradient id="metal" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
          <linearGradient id="joint" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
        </defs>
        
        {/* Base */}
        <path d="M -40 120 L 40 120 L 30 80 L -30 80 Z" fill="url(#metal)" />
        <rect x="-20" y="60" width="40" height="20" fill="#334155" />
        
        {/* J1 Rotation Effect (Base rotation) - represented visually by width changes if we were true 3D, keeping static for side profile */}
        
        {/* Shoulder & J2 */}
        <g transform={`translate(0, 60) rotate(${joints.j2}, 0, 0)`}>
          <circle cx="0" cy="0" r="18" fill="url(#joint)" />
          <circle cx="0" cy="0" r="8" fill="#1e293b" />
          
          {/* Upper Arm */}
          <path d="M -15 0 L 15 0 L 10 -80 L -10 -80 Z" fill="url(#metal)" />
          
          {/* Elbow & J3 */}
          <g transform={`translate(0, -80) rotate(${joints.j3}, 0, 0)`}>
            <circle cx="0" cy="0" r="15" fill="url(#joint)" />
            <circle cx="0" cy="0" r="6" fill="#1e293b" />
            
            {/* Lower Arm */}
            <path d="M -10 0 L 10 0 L 6 -70 L -6 -70 Z" fill="url(#metal)" />
            
            {/* Wrist & J5 */}
            <g transform={`translate(0, -70) rotate(${joints.j5}, 0, 0)`}>
              <circle cx="0" cy="0" r="10" fill="url(#joint)" />
              <path d="M -8 0 L 8 0 L 12 -20 L -12 -20 Z" fill="#cbd5e1" />
              {/* Tool Center Point (TCP) */}
              <circle cx="0" cy="-25" r="4" fill="#ef4444" className="animate-pulse" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
};

// 래더 로직 시뮬레이터 컴포넌트
const LadderLogicViewer = ({ tags }) => {
  const getTagValue = (id) => tags.find(t => t.id === id)?.value;
  const startBtn = getTagValue('X001');
  const stopBtn = getTagValue('X002');
  const motor = getTagValue('Y001');

  return (
    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 font-mono text-sm overflow-x-auto">
      <div className="flex justify-between text-slate-500 mb-2">
        <span>POWER (L)</span>
        <span>NEUTRAL (N)</span>
      </div>
      <div className="relative border-l-2 border-r-2 border-cyan-500 min-h-[200px] py-4 px-2">
        
        {/* Rung 001 */}
        <div className="flex items-center w-full mb-8 relative">
          <div className="w-12 h-0.5 bg-slate-600"></div>
          {/* Normally Open Contact (Start) */}
          <div className="flex flex-col items-center mx-2">
            <span className="text-xs text-slate-400 mb-1">X001 (START)</span>
            <div className={`flex items-center gap-1 ${startBtn ? 'text-green-500' : 'text-slate-500'}`}>
              <div className={`w-1 h-6 ${startBtn ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-slate-500'}`}></div>
              <div className="w-4 h-0.5 bg-current"></div>
              <div className={`w-1 h-6 ${startBtn ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-slate-500'}`}></div>
            </div>
          </div>
          <div className="w-8 h-0.5 bg-slate-600"></div>
          
          {/* Normally Closed Contact (Stop) */}
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
          
          {/* Coil (Motor) */}
          <div className="flex flex-col items-center mx-2">
            <span className="text-xs text-slate-400 mb-1">Y001 (MOTOR)</span>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${motor ? 'border-green-500 text-green-500 shadow-[0_0_12px_#22c55e]' : 'border-slate-500 text-slate-500'}`}>
              ( )
            </div>
          </div>
          <div className="w-12 h-0.5 bg-slate-600"></div>
          
          {/* Self-holding circuit branch */}
          <div className="absolute left-[3.5rem] top-1/2 w-0.5 h-16 bg-slate-600"></div>
          <div className="absolute left-[3.5rem] top-[calc(50%+4rem)] w-16 h-0.5 bg-slate-600"></div>
          <div className="absolute left-[7.5rem] top-[calc(50%+3.2rem)] flex items-center gap-1 text-green-500">
             <div className="w-1 h-6 bg-green-500"></div>
             <div className="w-4 h-0.5 bg-current"></div>
             <div className="w-1 h-6 bg-green-500"></div>
          </div>
          <div className="absolute left-[9.2rem] top-[calc(50%+4rem)] w-4 h-0.5 bg-slate-600"></div>
          <div className="absolute left-[10.2rem] top-1/2 w-0.5 h-16 bg-slate-600"></div>
          <span className="absolute left-[7.8rem] top-[calc(50%+4.8rem)] text-xs text-slate-400">Y001</span>
        </div>

        {/* Rung 002 */}
        <div className="flex items-center w-full relative">
          <div className="w-12 h-0.5 bg-slate-600"></div>
          <div className="flex flex-col items-center mx-2">
             <span className="text-xs text-slate-400 mb-1">END</span>
             <div className="w-8 h-6 border-2 border-slate-500 flex items-center justify-center text-slate-500 text-xs">
               END
             </div>
          </div>
          <div className="flex-1 h-0.5 bg-slate-600"></div>
        </div>

      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // State for PLC
  const [tags, setTags] = useState(initialPlcTags);
  const [plcStatus, setPlcStatus] = useState('RUN');
  
  // State for Robot
  const [robotJoints, setRobotJoints] = useState({ j1: 0, j2: 30, j3: -60, j4: 0, j5: 30, j6: 0 });
  const [robotCoords, setRobotCoords] = useState({ x: 450.5, y: -120.2, z: 320.8, rx: 180.0, ry: 45.0, rz: 0.0 });
  const [servoOn, setServoOn] = useState(true);

  const [logs, setLogs] = useState(initialLogs);

  // 시뮬레이션용 데이터 업데이트 타이머
  useEffect(() => {
    const timer = setInterval(() => {
      setTags(prev => prev.map(tag => {
        if (tag.type === 'INT' && tag.id === 'D101') {
          // 온도는 40~50 사이 변동
          return { ...tag, value: Math.floor(Math.random() * 10) + 40 };
        }
        if (tag.type === 'REAL' && tag.id === 'D102') {
          // 목표 좌표 미세 변동
          return { ...tag, value: (250 + Math.random() * 5).toFixed(2) };
        }
        return tag;
      }));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const addLog = (msg, type = 'info') => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setLogs(prev => [{ time, type, msg }, ...prev].slice(0, 50));
  };

  const handleJointChange = (joint, value) => {
    if(!servoOn) return;
    setRobotJoints(prev => ({ ...prev, [joint]: parseFloat(value) }));
    // 간단한 역기구학/정기구학 효과 시뮬레이션 (X, Z 좌표 연동)
    if(joint === 'j2' || joint === 'j3') {
       setRobotCoords(prev => ({
         ...prev,
         x: +(450 + parseFloat(value)).toFixed(1),
         z: +(320 - parseFloat(value) * 0.5).toFixed(1)
       }));
    }
  };

  const handleTagToggle = (id) => {
    setTags(prev => prev.map(t => t.id === id ? { ...t, value: !t.value } : t));
    addLog(`Tag ${id} state manually changed.`);
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

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 font-semibold text-sm">SYSTEM STATUS</h3>
            <Activity className="text-green-400 w-5 h-5 animate-pulse" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">ONLINE</div>
          <p className="text-slate-500 text-sm">All main nodes connected</p>
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
          <p className="text-slate-500 text-sm">Welding R3 Offline</p>
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
              3D Workcell Overview (Map)
           </h3>
           <div className="w-full h-[250px] bg-slate-900 rounded border border-slate-700 relative overflow-hidden flex items-center justify-center">
              {/* Mock Map Layout */}
              <div className="absolute top-1/4 left-1/4 w-12 h-12 bg-cyan-900 border border-cyan-500 rounded flex items-center justify-center text-xs text-cyan-300">PLC 1</div>
              <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-purple-900 border border-purple-500 rounded-full flex items-center justify-center text-xs text-purple-300">R1</div>
              <div className="absolute bottom-1/4 right-1/4 w-16 h-16 bg-purple-900 border border-purple-500 rounded-full flex items-center justify-center text-xs text-purple-300">R2</div>
              <div className="w-full h-0.5 bg-slate-700 absolute top-1/2 -z-10 shadow-[0_0_10px_rgba(255,255,255,0.1)]"></div>
              <span className="absolute bottom-2 right-2 text-slate-600 text-xs">Cell: Assembly Line A</span>
           </div>
        </div>
      </div>
    </div>
  );

  const renderPLC = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white">Master PLC (Mitsubishi Q-Series)</h2>
          <p className="text-slate-400 text-sm">IP: 192.168.10.100 | Scan Time: 1.2ms</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2 mr-4">
            <div className={`w-3 h-3 rounded-full ${plcStatus === 'RUN' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-slate-300 font-bold">{plcStatus}</span>
          </div>
          <button onClick={handlePlcState} className={`px-4 py-2 rounded font-semibold flex items-center gap-2 ${plcStatus === 'RUN' ? 'bg-red-900/50 text-red-400 hover:bg-red-900' : 'bg-green-900/50 text-green-400 hover:bg-green-900'}`}>
            {plcStatus === 'RUN' ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {plcStatus === 'RUN' ? 'STOP' : 'START'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg flex flex-col">
          <div className="p-4 border-b border-slate-700 flex justify-between items-center">
             <h3 className="font-semibold text-white">Memory Monitor (I/O & Registers)</h3>
             <button className="p-1 hover:bg-slate-700 rounded text-slate-400"><RefreshCcw className="w-4 h-4" /></button>
          </div>
          <div className="p-0 flex-1 overflow-auto max-h-[400px]">
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
                        <span className={`px-2 py-1 rounded text-xs font-bold ${tag.value ? 'bg-green-900 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
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

        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg flex flex-col">
          <div className="p-4 border-b border-slate-700">
             <h3 className="font-semibold text-white">Logic Programming View</h3>
          </div>
          <div className="p-4 flex-1">
             <LadderLogicViewer tags={tags} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderRobot = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white">Robot Arm (Yaskawa GP-Series)</h2>
          <p className="text-slate-400 text-sm">Controller: YRC1000 | IP: 192.168.10.101</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2 mr-4">
             <span className="text-slate-400 text-sm font-medium">SERVO</span>
             <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${servoOn ? 'bg-green-500' : 'bg-slate-600'}`} onClick={handleServo}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${servoOn ? 'translate-x-6' : 'translate-x-0'}`}></div>
             </div>
          </div>
          <button className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded font-semibold flex items-center gap-2 transition-colors">
            <Power className="w-4 h-4" />
            RESET ALARM
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Joint Controls */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-6 lg:col-span-1">
          <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Joint Coordinates (deg)
          </h3>
          <div className="space-y-5">
            {['j1', 'j2', 'j3', 'j4', 'j5', 'j6'].map((joint, idx) => (
              <div key={joint}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300 font-medium uppercase">{joint}</span>
                  <span className="text-cyan-400 font-mono">{robotJoints[joint].toFixed(2)}°</span>
                </div>
                <input 
                  type="range" 
                  min="-180" 
                  max="180" 
                  step="0.1"
                  value={robotJoints[joint]}
                  onChange={(e) => handleJointChange(joint, e.target.value)}
                  disabled={!servoOn}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${servoOn ? 'bg-slate-600 accent-cyan-500' : 'bg-slate-700 accent-slate-500 opacity-50 cursor-not-allowed'}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Cartesian & Visualization */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          {/* Visualizer */}
          <div className="flex-1">
            <RobotVisualizer joints={robotJoints} />
          </div>

          {/* Cartesian Coordinates */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-white mb-4">Cartesian Coordinates (World)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(robotCoords).map(([axis, val]) => (
                <div key={axis} className="bg-slate-900 p-3 rounded border border-slate-700 flex justify-between items-center">
                  <span className="text-slate-400 uppercase font-bold">{axis}</span>
                  <span className="text-green-400 font-mono text-lg">{val.toFixed(2)} <span className="text-xs text-slate-500">{['rx','ry','rz'].includes(axis)?'deg':'mm'}</span></span>
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
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-800/50' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('plc')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'plc' ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-800/50' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
          >
            <Cpu className="w-5 h-5" />
            <span className="font-medium">PLC Programming</span>
          </button>

          <button 
            onClick={() => setActiveTab('robot')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'robot' ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-800/50' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
          >
            <Zap className="w-5 h-5" />
            <span className="font-medium">Robot Control</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:bg-slate-900 hover:text-slate-300 transition-colors">
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 text-slate-400">
            <span>Workspace</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-200 font-medium capitalize">{activeTab}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-slate-300">Server Connected</span>
            </div>
            <button className="text-slate-400 hover:text-white transition-colors">
              <AlertCircle className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Dynamic View Area */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'plc' && renderPLC()}
          {activeTab === 'robot' && renderRobot()}
        </div>
      </main>

    </div>
  );
}