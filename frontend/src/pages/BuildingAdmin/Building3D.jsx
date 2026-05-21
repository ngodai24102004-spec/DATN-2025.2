import React, { useRef, useState, useMemo, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
    OrbitControls, Html, ContactShadows,
    Environment, Edges, RoundedBox, Cylinder, Sphere
} from '@react-three/drei';
import * as THREE from 'three';
import {
    AlertTriangle, Snowflake, Fan, Power, X,
    Activity, Wind, Droplets, Layout
} from 'lucide-react';
import { io } from 'socket.io-client';

// --- COMPONENT CÂY VĂN PHÒNG ---
function OfficePlant({ position }) {
    return (
        <group position={position}>
            {/* Chậu cây */}
            <mesh position={[0, 0.2, 0]}>
                <cylinderGeometry args={[0.2, 0.15, 0.4, 12]} />
                <meshStandardMaterial color="#e5e5e5" roughness={0.3} />
            </mesh>
            {/* Thân/Lá cây giả lập bằng Cone */}
            <mesh position={[0, 0.6, 0]}>
                <coneGeometry args={[0.3, 0.8, 8]} />
                <meshStandardMaterial color="#2e7d32" roughness={0.6} />
            </mesh>
        </group>
    );
}

// --- COMPONENT CỤM BÀN LÀM VIỆC (Gồm Bàn, Ghế, Máy tính, Đèn thả trần) ---
function DeskStation({ position, rotationY = 0 }) {
    return (
        <group position={position} rotation={[0, rotationY, 0]}>
            {/* 1. MẶT BÀN */}
            <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.6, 0.04, 0.8]} />
                <meshStandardMaterial color="#d7ccc8" roughness={0.5} /> {/* Màu gỗ nhạt */}
            </mesh>
            {/* Chân bàn */}
            <mesh position={[-0.75, 0.375, -0.35]}>
                <boxGeometry args={[0.05, 0.75, 0.05]} />
                <meshStandardMaterial color="#424242" />
            </mesh>
            <mesh position={[0.75, 0.375, -0.35]}>
                <boxGeometry args={[0.05, 0.75, 0.05]} />
                <meshStandardMaterial color="#424242" />
            </mesh>
            <mesh position={[-0.75, 0.375, 0.35]}>
                <boxGeometry args={[0.05, 0.75, 0.05]} />
                <meshStandardMaterial color="#424242" />
            </mesh>
            <mesh position={[0.75, 0.375, 0.35]}>
                <boxGeometry args={[0.05, 0.75, 0.05]} />
                <meshStandardMaterial color="#424242" />
            </mesh>

            {/* 2. MÁY TÍNH (Màn hình + Case) */}
            <group position={[0, 0.77, -0.1]}>
                {/* Đế màn hình */}
                <mesh position={[0, 0.02, 0]}>
                    <boxGeometry args={[0.2, 0.02, 0.15]} />
                    <meshStandardMaterial color="#212121" />
                </mesh>
                {/* Trục đỡ */}
                <mesh position={[0, 0.15, -0.05]}>
                    <boxGeometry args={[0.04, 0.2, 0.03]} />
                    <meshStandardMaterial color="#212121" />
                </mesh>
                {/* Màn hình phẳng */}
                <mesh position={[0, 0.25, -0.05]}>
                    <boxGeometry args={[0.6, 0.35, 0.03]} />
                    <meshStandardMaterial color="#111111" roughness={0.2} />
                </mesh>
                {/* Mặt màn hình sáng nhẹ (giả lập đang bật) */}
                <mesh position={[0, 0.25, -0.034]}>
                    <planeGeometry args={[0.58, 0.33]} />
                    <meshBasicMaterial color="#80deea" transparent opacity={0.7} />
                </mesh>
            </group>

            {/* 3. GHẾ VĂN PHÒNG */}
            <group position={[0, 0, 0.5]}>
                {/* Đệm ngồi */}
                <mesh position={[0, 0.45, 0]} castShadow>
                    <boxGeometry args={[0.45, 0.05, 0.45]} />
                    <meshStandardMaterial color="#37474f" roughness={0.7} />
                </mesh>
                {/* Tựa lưng */}
                <mesh position={[0, 0.75, 0.2]} castShadow>
                    <boxGeometry args={[0.42, 0.5, 0.05]} />
                    <meshStandardMaterial color="#37474f" roughness={0.7} />
                </mesh>
                {/* Chân ghế */}
                <mesh position={[0, 0.225, 0]}>
                    <cylinderGeometry args={[0.03, 0.03, 0.45, 8]} />
                    <meshStandardMaterial color="#212121" />
                </mesh>
            </group>

            {/* 4. ĐÈN THẢ TRẦN VÀ ÁNH SÁNG PHÒNG */}
            {/* Vỏ đèn tuýp thả trần */}
            <mesh position={[0, 2.3, 0]}>
                <boxGeometry args={[1.4, 0.05, 0.15]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
            </mesh>
            {/* Nguồn sáng thực tế chiếu xuống bàn */}
            <pointLight
                position={[0, 2.2, 0]}
                intensity={1.5}
                distance={6}
                decay={2}
                color="#fff4e5" // Ánh sáng trắng ấm nhẹ văn phòng
                castShadow
            />
        </group>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// VẬT LIỆU ĐƯỜNG ỐNG
// ─────────────────────────────────────────────────────────────────────────────
const PIPE_MATS = {
    'chw-s': new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#38bdf8', emissiveIntensity: 0.4, metalness: 0.3, roughness: 0.4 }), // Cấp lạnh
    'chw-r': new THREE.MeshStandardMaterial({ color: '#1d4ed8', emissive: '#1d4ed8', emissiveIntensity: 0.2, metalness: 0.3, roughness: 0.4 }), // Hồi lạnh
    'cw-s': new THREE.MeshStandardMaterial({ color: '#f97316', emissive: '#f97316', emissiveIntensity: 0.4, metalness: 0.3, roughness: 0.4 }),
    'cw-r': new THREE.MeshStandardMaterial({ color: '#991b1b', emissive: '#b91c1c', emissiveIntensity: 0.2, metalness: 0.3, roughness: 0.4 }),
};

function Pipe({ start, end, type = 'chw-s', r = 0.09 }) {
    const s = useMemo(() => new THREE.Vector3(...start), [start]);
    const e = useMemo(() => new THREE.Vector3(...end), [end]);
    if (s.distanceTo(e) < 0.01) return null;

    const direction = new THREE.Vector3().subVectors(e, s);
    const length = direction.length();
    const midpoint = new THREE.Vector3().addVectors(s, e).multiplyScalar(0.5);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());

    return (
        <mesh position={midpoint} quaternion={quaternion} castShadow>
            <cylinderGeometry args={[r, r, length, 12]} />
            <primitive object={PIPE_MATS[type]} attach="material" />
        </mesh>
    );
}

function PolyPipe({ pts, type, r = 0.09 }) {
    if (!pts || pts.length < 2) return null;
    return <>{pts.slice(0, -1).map((p, i) => <Pipe key={i} start={p} end={pts[i + 1]} type={type} r={r} />)}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// KIẾN TRÚC HÀNH LANG CHỮ THẬP & CỬA PHÒNG
// ─────────────────────────────────────────────────────────────────────────────
function OfficeDoor({ position, rotation = [0, 0, 0] }) {
    return (
        <group position={position} rotation={rotation}>
            <mesh position={[0, 1.1, 0]} castShadow>
                <boxGeometry args={[1.3, 2.2, 0.08]} />
                <meshStandardMaterial color="#475569" metalness={0.2} roughness={0.5} />
            </mesh>
            <mesh position={[-0.05, 1.05, 0.01]} castShadow>
                <boxGeometry args={[1.15, 2.1, 0.04]} />
                <meshStandardMaterial color="#78350f" roughness={0.7} />
            </mesh>
        </group>
    );
}

function BuildingArchitecture({ W, D }) {
    const wallColor = "#38bdf8";
    const opacity = 0.12;
    const wallH = 6;
    const wallY = -3;

    return (
        <group>
            <mesh position={[-1.5, wallY, 0]}><boxGeometry args={[0.08, wallH, D]} /><meshStandardMaterial color={wallColor} transparent opacity={opacity} /></mesh>
            <mesh position={[1.5, wallY, 0]}><boxGeometry args={[0.08, wallH, D]} /><meshStandardMaterial color={wallColor} transparent opacity={opacity} /></mesh>
            <mesh position={[0, wallY, -1.5]}><boxGeometry args={[W, wallH, 0.08]} /><meshStandardMaterial color={wallColor} transparent opacity={opacity} /></mesh>
            <mesh position={[0, wallY, 1.5]}><boxGeometry args={[W, wallH, 0.08]} /><meshStandardMaterial color={wallColor} transparent opacity={opacity} /></mesh>

            <OfficeDoor position={[-1.5, -6, -5]} rotation={[0, Math.PI / 2, 0]} />
            <OfficeDoor position={[1.5, -6, -5]} rotation={[0, -Math.PI / 2, 0]} />
            <OfficeDoor position={[-1.5, -6, 5]} rotation={[0, Math.PI / 2, 0]} />
            <OfficeDoor position={[1.5, -6, 5]} rotation={[0, -Math.PI / 2, 0]} />
        </group>
    );
}

function OfficeWorkspace({ position }) {
    const tableY = -5.3;
    return (
        <group position={[position[0], tableY, position[2]]}>
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.9, 0.05, 0.9]} />
                <meshStandardMaterial color="#ba906a" roughness={0.6} />
            </mesh>
            {[[-0.85, -0.35, 0.35], [0.85, -0.35, 0.35], [-0.85, -0.35, -0.35], [0.85, -0.35, -0.35]].map((p, i) => (
                <mesh key={i} position={[p[0], -0.35, p[2]]} castShadow>
                    <cylinderGeometry args={[0.02, 0.02, 0.65]} />
                    <meshStandardMaterial color="#475569" metalness={0.5} />
                </mesh>
            ))}
        </group>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// KHỐI MÔ HÌNH 3D THIẾT BỊ
// ─────────────────────────────────────────────────────────────────────────────
const ChillerModel = ({ clr }) => (
    <group>
        <RoundedBox args={[5.5, 2.6, 3.0]} radius={0.1} castShadow>
            <meshStandardMaterial color={clr} metalness={0.7} roughness={0.3} />
        </RoundedBox>
        <mesh position={[0, -0.5, 1.5]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.35, 0.35, 5.5, 16]} /><meshStandardMaterial color="#0ea5e9" metalness={0.6} /></mesh>
        <mesh position={[0, -0.5, -1.5]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.35, 0.35, 5.5, 16]} /><meshStandardMaterial color="#ea580c" metalness={0.6} /></mesh>
    </group>
);

const TowerModel = ({ clr, on }) => {
    const fanRef = useRef();
    useFrame((_, dt) => { if (fanRef.current && on) fanRef.current.rotation.y += dt * 8; });
    return (
        <group>
            <Cylinder args={[1.8, 2.2, 4.5, 16]} position={[0, 2.25, 0]} castShadow>
                <meshStandardMaterial color={clr} metalness={0.3} roughness={0.6} />
            </Cylinder>
            <group ref={fanRef} position={[0, 4.5, 0]}>
                {[0, 60, 120, 180, 240, 300].map(deg => (
                    <mesh key={deg} rotation={[0, (deg * Math.PI) / 180, 0]}><boxGeometry args={[3.2, 0.04, 0.25]} /><meshStandardMaterial color="#0f172a" /></mesh>
                ))}
            </group>
        </group>
    );
};

const PumpModel = ({ clr }) => (
    <group rotation={[0, Math.PI / 2, 0]}>
        <Cylinder args={[0.35, 0.35, 1.3, 16]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <meshStandardMaterial color={clr} metalness={0.8} roughness={0.2} />
        </Cylinder>
        <Sphere args={[0.5]}><meshStandardMaterial color="#0f172a" /></Sphere>
    </group>
);

const ValveModel = ({ clr }) => (
    <group>
        <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.22, 0.22, 1.1, 16]} /><meshStandardMaterial color={clr} metalness={0.7} /></mesh>
        <mesh position={[0, 0.35, 0]}><boxGeometry args={[0.4, 0.4, 0.4]} /><meshStandardMaterial color="#1e293b" /></mesh>
    </group>
);

const PipeSensorModel = ({ clr }) => (
    <group>
        <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.2, 0.2, 1.3, 16]} /><meshStandardMaterial color="#334155" /></mesh>
        <mesh position={[0, 0.35, 0]}><cylinderGeometry args={[0.12, 0.12, 0.35, 12]} /><meshStandardMaterial color={clr} /></mesh>
    </group>
);

const AHUModel = ({ clr, on }) => {
    const fanRef = useRef();
    useFrame((_, dt) => { if (fanRef.current && on) fanRef.current.rotation.z += dt * 6; });
    return (
        <group>
            <RoundedBox args={[2.4, 1.4, 1.6]} radius={0.05} castShadow>
                <meshStandardMaterial color={clr} metalness={0.5} roughness={0.4} />
            </RoundedBox>
            <group ref={fanRef} position={[0, 0, 0.81]}>
                {[0, 45, 90, 135].map(deg => (
                    <mesh key={deg} rotation={[0, 0, (deg * Math.PI) / 180]}><boxGeometry args={[1.2, 0.06, 0.05]} /><meshStandardMaterial color="#1d4ed8" /></mesh>
                ))}
            </group>
        </group>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// ĐIỀU HƯỚNG NODE THIẾT BỊ HOẠT ĐỘNG
// ─────────────────────────────────────────────────────────────────────────────
function DeviceNode({ device, onSelect, isSelected }) {
    const hasFault = device.fault === 1;
    const isRunning = device.type === 'VALVE' ? device.state === 1 : device.type === 'PIPE' ? device.flow_status === 1 : device.power === 1;

    const clr = hasFault ? '#ef4444' : isSelected ? '#a855f7' : isRunning ? '#10b981' : '#64748b';

    const icon = hasFault ? <AlertTriangle size={12} className="text-white" />
        : ({
            CHILLER: <Snowflake size={12} className="text-white" />,
            COOLINGTOWER: <Fan size={12} className="text-white" />,
            PIPE: <Droplets size={12} className="text-white" />,
            AHU: <Wind size={12} className="text-white" />,
            VALVE: <Activity size={12} className="text-white" />
        })[device.type] ?? <Power size={12} className="text-white" />;

    const modelMap = {
        CHILLER: <ChillerModel clr={clr} />, COOLINGTOWER: <TowerModel clr={clr} on={isRunning} />,
        COOLINGPUMP: <PumpModel clr={clr} />, COLDPUMP: <PumpModel clr={clr} />,
        VALVE: <ValveModel clr={clr} />, PIPE: <PipeSensorModel clr={clr} />, AHU: <AHUModel clr={clr} on={isRunning} />
    };

    return (
        <group position={device.position}>
            <group onClick={(e) => { e.stopPropagation(); onSelect(device); }} style={{ cursor: 'pointer' }}>
                {modelMap[device.type]}
            </group>

            <Html position={[0, device.badgeY ?? 1.1, 0]} center pointerEvents="auto">
                <button
                    onClick={(e) => { e.stopPropagation(); onSelect(device); }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center border-2 cursor-pointer transition-all shadow-md active:scale-90 hover:scale-110 pointer-events-auto ${hasFault ? 'bg-red-500 border-white animate-pulse' : isSelected ? 'bg-purple-500 border-white ring-4 ring-purple-500/30' : isRunning ? 'bg-emerald-500 border-emerald-100 shadow-emerald-500/40' : 'bg-slate-600 border-slate-400'}`}
                >
                    {icon}
                </button>
            </Html>
        </group>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT CHÍNH KẾT NỐI WEBSOCKET
// ─────────────────────────────────────────────────────────────────────────────
export default function Building3D() {
    const [selectedDeviceCode, setSelectedDeviceCode] = useState(null);

    // Khởi tạo State với 4 AHU cho 4 phòng làm việc riêng biệt
    const [liveData, setLiveData] = useState({
        "chiller-001": { code: "chiller-001", type: "CHILLER", name: "Máy làm lạnh nước Chiller Trung Tâm", power: 1, "auto-mode": 1, fault: 0 },
        "COOLINGTOWER-001": { code: "COOLINGTOWER-001", type: "COOLINGTOWER", name: "Tháp giải nhiệt khí ngoài trời", power: 1, "auto-mode": 1, fault: 0 },
        "COOLINGPUMP-001": { code: "COOLINGPUMP-001", type: "COOLINGPUMP", name: "Bơm tuần hoàn nước giải nhiệt tháp", power: 1, "auto-mode": 1, fault: 0, speed: "45.2" },
        "COLDPUMP-001": { code: "COLDPUMP-001", type: "COLDPUMP", name: "Bơm nước lạnh cấp tầng biến tần", power: 1, "auto-mode": 1, fault: 0, speed: "42.8" },
        "PIPE-001": { code: "PIPE-001", type: "PIPE", name: "Cảm biến lưu lượng trục ống chính", flow_status: 1, temperature: "12.40", flow_rate: "23.40", pressure: "1.60" },
        "VALVE-001": { code: "VALVE-001", type: "VALVE", name: "Van chặn Motorized tuyến trung tâm", state: 1 },

        // Cập nhật cấu hình 4 AHU tương ứng cho 4 phòng
        "AHU-ROOM-A": { code: "AHU-ROOM-A", type: "AHU", name: "Bộ xử lý không khí AHU - Phòng Đông Bắc (101)", power: 1, "auto-mode": 1, fault: 0, temperature: "22.4", frequency: "45.0" },
        "AHU-ROOM-B": { code: "AHU-ROOM-B", type: "AHU", name: "Bộ xử lý không khí AHU - Phòng Tây Bắc (102)", power: 1, "auto-mode": 1, fault: 0, temperature: "21.8", frequency: "47.5" },
        "AHU-ROOM-C": { code: "AHU-ROOM-C", type: "AHU", name: "Bộ xử lý không khí AHU - Phòng Đông Nam (103)", power: 1, "auto-mode": 1, fault: 0, temperature: "23.1", frequency: "44.2" },
        "AHU-ROOM-D": { code: "AHU-ROOM-D", type: "AHU", name: "Bộ xử lý không khí AHU - Phòng Tây Nam (104)", power: 1, "auto-mode": 1, fault: 0, temperature: "22.0", frequency: "46.0" }
    });

    // EFFECT LẮNG NGHE REALTIME TỪ SOCKET.IO SERVER
    useEffect(() => {
        const socket = io("http://localhost:3000");

        socket.on("connect", () => {
            console.log("✅ SCADA 3D Connected to Socket.io Server");
            socket.emit("join-super-admin");
        });

        socket.on("device-update", (payload) => {
            console.log("⚡ 3D View nhận data Real-time:", payload.code);

            setLiveData(prev => {
                const nextState = { ...prev };
                const deviceCode = payload.code;

                if (nextState[deviceCode]) {
                    nextState[deviceCode] = {
                        ...nextState[deviceCode],
                        ...payload.latest_state,
                        type: payload.type || nextState[deviceCode].type
                    };
                } else {
                    nextState[deviceCode] = {
                        code: deviceCode,
                        type: payload.type,
                        ...payload.latest_state
                    };
                }
                return nextState;
            });
        });

        socket.on("disconnect", () => console.log("❌ SCADA 3D Disconnected"));

        return () => socket.disconnect();
    }, []);

    const W = 42, D = 26;
    const Y_PUMP_VALVE_PIPE = 0.9, Y_ROOF_FLOOR = 8.0, Y_AHU_CEILING = -0.75;

    // Phân bổ vị trí 4 AHU cố định đều vào 4 góc phòng
    const finalDevices3D = useMemo(() => {
        const positionsMap = {
            "chiller-001": { pos: [0, 1.4, 0], badgeY: 2.0 },
            "COOLINGTOWER-001": { pos: [0, Y_ROOF_FLOOR, -7.5], badgeY: 5.0 },
            "COOLINGPUMP-001": { pos: [-10, 2.0, -4], badgeY: 1.1 },
            "COLDPUMP-001": { pos: [7, Y_PUMP_VALVE_PIPE, 4], badgeY: 1.1 },
            "PIPE-001": { pos: [0, Y_PUMP_VALVE_PIPE, 7.5], badgeY: 1.1 },
            "VALVE-001": { pos: [-5, Y_PUMP_VALVE_PIPE, 7.5], badgeY: 1.1 },

            // Tọa độ 4 AHU tại trung tâm cơ điện của 4 phòng riêng biệt
            "AHU-ROOM-A": { pos: [-11, Y_AHU_CEILING, -7.5], badgeY: 1.1 }, // Phòng 1 - Trên Trái
            "AHU-ROOM-B": { pos: [11, Y_AHU_CEILING, -7.5], badgeY: 1.1 },  // Phòng 2 - Trên Phải
            "AHU-ROOM-C": { pos: [-11, Y_AHU_CEILING, 7.5], badgeY: 1.1 },  // Phòng 3 - Dưới Trái
            "AHU-ROOM-D": { pos: [11, Y_AHU_CEILING, 7.5], badgeY: 1.1 }   // Phòng 4 - Dưới Phải
        };

        return Object.keys(liveData).map(key => ({
            ...liveData[key],
            position: positionsMap[key]?.pos || [0, 0, 0],
            badgeY: positionsMap[key]?.badgeY || 1.0
        }));
    }, [liveData]);

    const selectedDevice = liveData[selectedDeviceCode] || null;

    // HỆ THỐNG ĐƯỜNG ỐNG ĐỒNG BỘ: VAN CHIA 4 ỐNG ĐI 4 AHU -> 4 ỐNG QUAY VỀ CHILLER
    const pipesGeometry = useMemo(() => {
        const Y_CHW_S = 0.9;
        const Y_CHW_R_HIGH = 2.8;

        // Cao độ mới cho tuyến ống qua cụm Bơm giải nhiệt (Né va chạm hạ tầng dưới)
        const Y_CW_PUMP_HIGH = 2.0;

        // --- [Giữ nguyên] Các tuyến CHW_S và CHW_R đã cấu hình ở bước trước ---
        const chiller_Out = [0, Y_CHW_S, 1.6];
        const to_ColdPump = [chiller_Out, [7, Y_CHW_S, 1.6], [7, Y_CHW_S, 4]];
        const to_Sensors = [[7, Y_CHW_S, 4], [7, Y_CHW_S, 7.5], [0, Y_CHW_S, 7.5]];
        const to_Valve = [[0, Y_CHW_S, 7.5], [-5, Y_CHW_S, 7.5]];

        const branch_AHU_A_S = [[-5, Y_CHW_S, 7.5], [-5, Y_CHW_S, -5.5], [-11, Y_CHW_S, -5.5], [-11, Y_AHU_CEILING, -5.5], [-11, Y_AHU_CEILING, -6.5]];
        const branch_AHU_B_S = [[-5, Y_CHW_S, 7.5], [5, Y_CHW_S, 7.5], [5, Y_CHW_S, -5.5], [11, Y_CHW_S, -5.5], [11, Y_AHU_CEILING, -5.5], [11, Y_AHU_CEILING, -6.6]];
        const branch_AHU_C_S = [[-5, Y_CHW_S, 7.5], [-11, Y_CHW_S, 7.5], [-11, Y_AHU_CEILING, 7.5], [-11, Y_AHU_CEILING, 6.7]];
        const branch_AHU_D_S = [[-5, Y_CHW_S, 7.5], [5, Y_CHW_S, 7.5], [11, Y_CHW_S, 7.5], [11, Y_AHU_CEILING, 7.5], [11, Y_AHU_CEILING, 6.7]];

        const branch_AHU_A_R = [[-11, Y_AHU_CEILING, -8.3], [-11, Y_CHW_R_HIGH, -8.3], [-2, Y_CHW_R_HIGH, -8.3], [-2, Y_CHW_R_HIGH, -1.6], [0, Y_CHW_R_HIGH, -1.6], [0, 0.9, -1.6]];
        const branch_AHU_B_R = [[11, Y_AHU_CEILING, -8.3], [11, Y_CHW_R_HIGH, -8.3], [2, Y_CHW_R_HIGH, -8.3], [2, Y_CHW_R_HIGH, -1.6], [0, Y_CHW_R_HIGH, -1.6], [0, 0.9, -1.6]];
        const branch_AHU_C_R = [[-11, Y_AHU_CEILING, 8.3], [-11, Y_CHW_R_HIGH, 8.3], [-3, Y_CHW_R_HIGH, 8.3], [-3, Y_CHW_R_HIGH, -1.6], [0, Y_CHW_R_HIGH, -1.6], [0, 0.9, -1.6]];
        const branch_AHU_D_R = [[11, Y_AHU_CEILING, 8.3], [11, Y_CHW_R_HIGH, 8.3], [3, Y_CHW_R_HIGH, 8.3], [3, Y_CHW_R_HIGH, -1.6], [0, Y_CHW_R_HIGH, -1.6], [0, 0.9, -1.6]];


        // --- 3. CẬP NHẬT: Tuyến nước cấp Giải nhiệt (CW_S) đi cao qua Bơm ---
        const CW_S = [
            [-2.0, 0.9, -1.6],           // Từ cổng ngõ ra Chiller
            [-2.0, Y_CW_PUMP_HIGH, -1.6], // Giật đứng lên cao độ 2.0
            [-10, Y_CW_PUMP_HIGH, -1.6],  // Đi ngang trên cao hướng về phía dãy bơm
            [-10, Y_CW_PUMP_HIGH, -4],    // Đi xuyên qua khớp nối trên của COOLINGPUMP ở cao độ 2.0
            [-10, Y_CW_PUMP_HIGH, -7.5],  // Chạy thẳng ra trục biên không gian ngoài trời
            [-0.8, Y_CW_PUMP_HIGH, -7.5], // Co góc vuông ôm sát sàn hành lang ngoài
            [-0.8, Y_ROOF_FLOOR + 2.2, -7.5] // Bắn thẳng đứng lên đỉnh Tháp giải nhiệt trên mái tầng thượng
        ];

        // Tuyến nước hồi giải nhiệt từ tháp về lại Chiller (CW_R)
        const CW_R = [
            [0.8, Y_ROOF_FLOOR + 0.3, -7.5],
            [0.8, 0.9, -7.5],
            [0, 0.9, -7.5],
            [0, 0.9, -1.6]
        ];

        return {
            to_ColdPump, to_Sensors, to_Valve,
            branch_AHU_A_S, branch_AHU_B_S, branch_AHU_C_S, branch_AHU_D_S,
            branch_AHU_A_R, branch_AHU_B_R, branch_AHU_C_R, branch_AHU_D_R,
            CW_S, CW_R
        };
    }, []);

    // Render bố cục các mô hình nội thất phòng
    const officeDesks = useMemo(() => {
        const desks = [];
        const roomsConfig = [
            { xRange: [-18, -5], zRange: [-11, -4] },
            { xRange: [5, 18], zRange: [-11, -4] },
            { xRange: [-18, -5], zRange: [4, 11] },
            { xRange: [5, 18], zRange: [4, 11] }
        ];
        roomsConfig.forEach(room => {
            for (let x = room.xRange[0]; x <= room.xRange[1]; x += 4.5) {
                for (let z = room.zRange[0]; z <= room.zRange[1]; z += 4.0) {
                    desks.push([x, z]);
                }
            }
        });
        return desks;
    }, []);

    return (
        <div className="w-full h-[840px] rounded-[1.8rem] overflow-hidden bg-slate-950 border border-slate-800 relative font-sans text-white antialiased shadow-2xl">

            {/* CANVAS KHÔNG GIAN ĐỒ HỌA 3D */}
            <Canvas shadows camera={{ position: [35, 22, 35], fov: 38 }} gl={{ logarithmicDepthBuffer: true }}>
                <OrbitControls enableDamping maxPolarAngle={Math.PI / 2.05} />
                <ambientLight intensity={0.55} />
                <directionalLight position={[25, 40, 20]} intensity={1.4} castShadow shadow-mapSize={[2048, 2048]} />
                <Environment preset="city" />

                {/* KHỐI SÀN CÁC TẦNG */}
                <mesh position={[0, -6.0, 0]} receiveShadow><boxGeometry args={[W, 0.15, D]} /><meshStandardMaterial color="#0f172a" /><Edges color="#334155" /></mesh>
                <mesh position={[0, 0, 0]} receiveShadow><boxGeometry args={[W, 0.15, D]} /><meshStandardMaterial color="#020617" /><Edges color="#1e3a5f" /></mesh>
                <mesh position={[0, Y_ROOF_FLOOR, 0]} receiveShadow><boxGeometry args={[W, 0.15, D]} /><meshStandardMaterial color="#022c22" /><Edges color="#059669" /></mesh>

                {/* HẠ TẦNG HÀNH LANG CHỮ THẬP VÀ CỬA RA VÀO */}
                <BuildingArchitecture W={W} D={D} />

                {/* BÀN LÀM VIỆC NỘI THẤT */}
                {officeDesks.map((pos, idx) => <OfficeWorkspace key={idx} position={[pos[0], 0, pos[1]]} />)}

                {/* VẼ ĐƯỜNG ỐNG TUẦN HOÀN KẾT NỐI KÍN KHÔNG GIAN */}
                {/* Tuyến nước cấp lạnh chính */}
                <PolyPipe pts={pipesGeometry.to_ColdPump} type="chw-s" />
                <PolyPipe pts={pipesGeometry.to_Sensors} type="chw-s" />
                <PolyPipe pts={pipesGeometry.to_Valve} type="chw-s" />
                {/* Tuyến rẽ 4 ống từ sau Van tới 4 AHU */}
                <PolyPipe pts={pipesGeometry.branch_AHU_A_S} type="chw-s" />
                <PolyPipe pts={pipesGeometry.branch_AHU_B_S} type="chw-s" />
                <PolyPipe pts={pipesGeometry.branch_AHU_C_S} type="chw-s" />
                <PolyPipe pts={pipesGeometry.branch_AHU_D_S} type="chw-s" />
                {/* Tuyến gom 4 ống nước hồi từ 4 AHU về lại Chiller */}
                <PolyPipe pts={pipesGeometry.branch_AHU_A_R} type="chw-r" />
                <PolyPipe pts={pipesGeometry.branch_AHU_B_R} type="chw-r" />
                <PolyPipe pts={pipesGeometry.branch_AHU_C_R} type="chw-r" />
                <PolyPipe pts={pipesGeometry.branch_AHU_D_R} type="chw-r" />
                {/* Tuyến nước giải nhiệt tháp */}
                <PolyPipe pts={pipesGeometry.CW_S} type="cw-s" />
                <PolyPipe pts={pipesGeometry.CW_R} type="cw-r" />

                {/* RENDER CÁC THIẾT BỊ ĐIỀU KHIỂN DỮ LIỆU ĐỘNG */}
                {finalDevices3D.map(d => (
                    <DeviceNode
                        key={d.code}
                        device={d}
                        onSelect={(dev) => setSelectedDeviceCode(dev.code)}
                        isSelected={selectedDeviceCode === d.code}
                    />
                ))}

                <ContactShadows position={[0, -5.92, 0]} opacity={0.4} scale={45} blur={2.2} />
            </Canvas>

            {/* SIDEBAR SCADA - HIỂN THỊ CHI TIẾT THÔNG SỐ REALTIME */}
            <div className="absolute top-6 right-6 w-86 bg-slate-900/90 backdrop-blur-lg border border-slate-700/80 rounded-2xl p-5 shadow-2xl pointer-events-auto z-50">
                {selectedDevice ? (
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-700/50 pb-3 mb-4">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${selectedDevice.fault === 1 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 animate-ping'}`} />
                                <h3 className="font-mono font-bold text-sm text-sky-400 tracking-wider uppercase">{selectedDevice.code}</h3>
                            </div>
                            <button onClick={() => setSelectedDeviceCode(null)} className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="mb-4">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Tên hệ thống Scada:</span>
                            <h4 className="text-xs font-bold text-slate-200 mt-0.5 leading-relaxed">{selectedDevice.name}</h4>
                        </div>

                        <div className="space-y-2.5 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
                            {selectedDevice["auto-mode"] !== undefined && (
                                <div className="flex justify-between items-center text-xs pb-1.5 border-b border-slate-900">
                                    <span className="text-slate-400 font-medium">Chế độ kiểm soát:</span>
                                    <span className={`font-mono px-2 py-0.5 rounded text-[10px] font-bold border ${selectedDevice["auto-mode"] === 1 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                        {selectedDevice["auto-mode"] === 1 ? 'TỰ ĐỘNG (AUTO)' : 'CƠ TAY (MANUAL)'}
                                    </span>
                                </div>
                            )}

                            {selectedDevice.type === 'PIPE' && (
                                <>
                                    <ScadaDataRow label="Lưu lượng dòng chảy tức thời" value={selectedDevice.flow_rate} unit="m³/h" color="text-cyan-400" />
                                    <ScadaDataRow label="Áp suất thủy lực đường ống" value={selectedDevice.pressure} unit="bar" color="text-emerald-400" />
                                    <ScadaDataRow label="Nhiệt độ nước cảm biến hồi" value={selectedDevice.temperature} unit="°C" color="text-sky-400" />
                                    <ScadaDataRow label="Trạng thái dòng chảy (Flow)" value={selectedDevice.flow_status === 1 ? "CÓ DÒNG" : "ĐỨNG YÊN"} unit="" color="text-teal-400" />
                                </>
                            )}

                            {(selectedDevice.type === 'COOLINGPUMP' || selectedDevice.type === 'COLDPUMP') && (
                                <>
                                    <ScadaDataRow label="Tốc độ tần số biến tần (VFD)" value={selectedDevice.speed} unit="Hz" color="text-amber-400" />
                                    <ScadaDataRow label="Tải làm việc động cơ" value={selectedDevice.power === 1 ? "100%" : "0%"} unit="" color="text-slate-300" />
                                </>
                            )}

                            {selectedDevice.type === 'CHILLER' && (
                                <>
                                    <ScadaDataRow label="Trạng thái máy nén" value={selectedDevice.power === 1 ? "RUNNING" : "STOP"} unit="" color="text-emerald-400" />
                                    <ScadaDataRow label="Hiệu suất tải lạnh trung tâm" value="320 RT" unit="" color="text-sky-400" />
                                    <ScadaDataRow label="Chỉ số năng lượng COP" value="5.65" unit="" color="text-yellow-500" />
                                </>
                            )}

                            {selectedDevice.type === 'COOLINGTOWER' && (
                                <>
                                    <ScadaDataRow label="Trạng thái Motor quạt tháp" value={selectedDevice.power === 1 ? "ON" : "OFF"} unit="" color="text-emerald-400" />
                                    <ScadaDataRow label="Tốc độ quạt giải nhiệt" value={selectedDevice.power === 1 ? "950" : "0"} unit="RPM" color="text-teal-400" />
                                </>
                            )}

                            {selectedDevice.type === 'VALVE' && (
                                <>
                                    <ScadaDataRow label="Trạng thái đóng mở Van" value={selectedDevice.state === 1 ? "MỞ HOÀN TOÀN" : "ĐÓNG KÍN"} unit="" color={selectedDevice.state === 1 ? "text-emerald-400" : "text-rose-400"} />
                                    <ScadaDataRow label="Độ mở điều tiết góc hành trình" value={selectedDevice.state === 1 ? "100" : "0"} unit="%" color="text-slate-300" />
                                </>
                            )}

                            {selectedDevice.type === 'AHU' && (
                                <>
                                    <ScadaDataRow label="Tần số quạt cấp biến tần" value={selectedDevice.frequency} unit="Hz" color="text-sky-400" />
                                    <ScadaDataRow label="Nhiệt độ phòng hiện tại" value={selectedDevice.temperature} unit="°C" color="text-rose-400" />
                                </>
                            )}

                            <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800/60">
                                <span className="text-slate-400">Trạng thái vận hành:</span>
                                <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${selectedDevice.fault === 1 ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                                    {selectedDevice.fault === 1 ? 'CẢNH BÁO LỖI (FAULT)' : 'HOẠT ĐỘNG ỔN ĐỊNH'}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10 text-slate-400 text-xs flex flex-col items-center gap-3">
                        <Layout size={28} className="text-slate-600 animate-pulse mb-1" />
                        <p className="font-bold text-slate-300 text-sm">Hệ Thống Trung Tâm SCADA</p>
                        <p className="text-[11px] text-slate-500 max-w-[240px] leading-relaxed">
                            Dữ liệu đang được đồng bộ trực tuyến qua **Socket.io**. Vui lòng click chọn thiết bị cơ điện trên mô hình để giám sát thông số vận hành tức thời.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function ScadaDataRow({ label, value, unit, color }) {
    return (
        <div className="flex justify-between items-baseline py-0.5 border-b border-slate-900/40 last:border-0">
            <span className="text-slate-400 text-[11px] font-medium">{label}:</span>
            <div className="font-mono text-right">
                <span className={`font-black text-xs ${color}`}>{value ?? "---"}</span>
                {unit && <span className="text-[10px] text-slate-500 ml-1 font-sans font-bold">{unit}</span>}
            </div>
        </div>
    );
}