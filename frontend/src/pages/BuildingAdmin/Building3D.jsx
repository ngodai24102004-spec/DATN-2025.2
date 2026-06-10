import React, { useRef, useState, useMemo, useEffect, useContext } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
    OrbitControls, Html, ContactShadows,
    Edges, RoundedBox, Cylinder, Sphere
} from '@react-three/drei';
import * as THREE from 'three';
import {
    AlertTriangle, Snowflake, Fan, Power, X,
    Activity, Wind, Droplets, Layout
} from 'lucide-react';
import { io } from 'socket.io-client';
import { AuthContext } from '../../context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// SHARED MATERIALS - module level, tạo 1 lần duy nhất
// ─────────────────────────────────────────────────────────────────────────────
const MAT = {
    colBody: new THREE.MeshLambertMaterial({ color: '#1e293b' }),
    colCap: new THREE.MeshLambertMaterial({ color: '#334155' }),
    roofGlass: new THREE.MeshLambertMaterial({ color: '#38bdf8', transparent: true, opacity: 0.10, side: THREE.DoubleSide }),
    roofFrame: new THREE.MeshLambertMaterial({ color: '#475569' }),
    lightBody: new THREE.MeshBasicMaterial({ color: '#fffde7' }),
    lightFrame: new THREE.MeshLambertMaterial({ color: '#94a3b8' }),
    pot: new THREE.MeshLambertMaterial({ color: '#b45309' }),
    potSoil: new THREE.MeshLambertMaterial({ color: '#78350f' }),
    treeDark: new THREE.MeshLambertMaterial({ color: '#166534' }),
    treeMid: new THREE.MeshLambertMaterial({ color: '#15803d' }),
    treeLite: new THREE.MeshLambertMaterial({ color: '#16a34a' }),
    treeTrunk: new THREE.MeshLambertMaterial({ color: '#92400e' }),
    deskTop: new THREE.MeshLambertMaterial({ color: '#ba906a' }),
    deskLeg: new THREE.MeshLambertMaterial({ color: '#475569' }),
    floorB1: new THREE.MeshLambertMaterial({ color: '#0f172a' }),
    floorB2: new THREE.MeshLambertMaterial({ color: '#020617' }),
    floorRoof: new THREE.MeshLambertMaterial({ color: '#022c22' }),
    pipeChwS: new THREE.MeshLambertMaterial({ color: '#38bdf8' }),
    pipeChwR: new THREE.MeshLambertMaterial({ color: '#1d4ed8' }),
    pipeCwS: new THREE.MeshLambertMaterial({ color: '#f97316' }),
    pipeCwR: new THREE.MeshLambertMaterial({ color: '#991b1b' }),
    dark: new THREE.MeshLambertMaterial({ color: '#0f172a' }),
    dark2: new THREE.MeshLambertMaterial({ color: '#1e293b' }),
    wall: new THREE.MeshLambertMaterial({ color: '#38bdf8', transparent: true, opacity: 0.10 }),
    doorFrame: new THREE.MeshLambertMaterial({ color: '#475569' }),
    doorWood: new THREE.MeshLambertMaterial({ color: '#78350f' }),
    screenBody: new THREE.MeshLambertMaterial({ color: '#111111' }),
    screenGlow: new THREE.MeshBasicMaterial({ color: '#80deea', transparent: true, opacity: 0.7 }),
    screenBase: new THREE.MeshLambertMaterial({ color: '#212121' }),
    chair: new THREE.MeshLambertMaterial({ color: '#37474f' }),
};

// Material cho thiết bị (dùng Lambert thay Standard để tránh texture units)
const PIPE_MATS = {
    'chw-s': MAT.pipeChwS,
    'chw-r': MAT.pipeChwR,
    'cw-s': MAT.pipeCwS,
    'cw-r': MAT.pipeCwR,
};

// Tạo Lambert material với màu tùy chỉnh (dùng cho device nodes)
function makeMat(color) {
    return new THREE.MeshLambertMaterial({ color });
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOM CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const ROOMS = [
    { id: 'A', cx: -11.25, cz: -7.25, w: 19.5, d: 11.5 },
    { id: 'B', cx: 11.25, cz: -7.25, w: 19.5, d: 11.5 },
    { id: 'C', cx: -11.25, cz: 7.25, w: 19.5, d: 11.5 },
    { id: 'D', cx: 11.25, cz: 7.25, w: 19.5, d: 11.5 },
];

// ─────────────────────────────────────────────────────────────────────────────
// CỘT NHÀ
// ─────────────────────────────────────────────────────────────────────────────
function RoomColumn({ position }) {
    return (
        <group position={position}>
            <mesh castShadow material={MAT.colBody}><cylinderGeometry args={[0.22, 0.25, 6.1, 12]} /></mesh>
            <mesh position={[0, 3.2, 0]} material={MAT.colCap}><boxGeometry args={[0.65, 0.22, 0.65]} /></mesh>
            <mesh position={[0, -3.0, 0]} material={MAT.colCap}><boxGeometry args={[0.6, 0.18, 0.6]} /></mesh>
        </group>
    );
}

function RoomColumns({ cx, cz, w, d }) {
    const hw = w / 2 - 0.4, hd = d / 2 - 0.4, colY = -2.95;
    return (
        <>
            <RoomColumn position={[cx - hw, colY, cz - hd]} />
            <RoomColumn position={[cx + hw, colY, cz - hd]} />
            <RoomColumn position={[cx - hw, colY, cz + hd]} />
            <RoomColumn position={[cx + hw, colY, cz + hd]} />
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MÁI CHE
// ─────────────────────────────────────────────────────────────────────────────
function RoomRoof({ centerX, centerZ, width, depth }) {
    return (
        <group position={[centerX, -0.5, centerZ]}>
            <mesh material={MAT.roofGlass}><boxGeometry args={[width, 0.06, depth]} /></mesh>
            <mesh material={MAT.roofFrame}><boxGeometry args={[width, 0.04, 0.06]} /></mesh>
            <mesh position={[0, 0, depth / 2 - 0.03]} material={MAT.roofFrame}><boxGeometry args={[width, 0.04, 0.06]} /></mesh>
            <mesh position={[0, 0, -(depth / 2 - 0.03)]} material={MAT.roofFrame}><boxGeometry args={[width, 0.04, 0.06]} /></mesh>
            <mesh position={[width / 2 - 0.03, 0, 0]} material={MAT.roofFrame}><boxGeometry args={[0.06, 0.04, depth]} /></mesh>
            <mesh position={[-(width / 2 - 0.03), 0, 0]} material={MAT.roofFrame}><boxGeometry args={[0.06, 0.04, depth]} /></mesh>
            {[-depth / 4, depth / 4].map((z, i) => <mesh key={i} position={[0, 0, z]} material={MAT.roofFrame}><boxGeometry args={[width, 0.035, 0.05]} /></mesh>)}
            {[-width / 4, width / 4].map((x, i) => <mesh key={i} position={[x, 0, 0]} material={MAT.roofFrame}><boxGeometry args={[0.05, 0.035, depth]} /></mesh>)}
        </group>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ĐÈN TRẦN - chỉ dùng MeshBasicMaterial (không tốn texture unit)
// Ánh sáng phòng do 1 PointLight ở trung tâm mỗi phòng (không castShadow)
// ─────────────────────────────────────────────────────────────────────────────
function CeilingLightMesh({ position }) {
    return (
        <group position={position}>
            <mesh material={MAT.lightBody}><boxGeometry args={[1.1, 0.06, 0.28]} /></mesh>
            <mesh position={[0, 0.04, 0]} material={MAT.lightFrame}><boxGeometry args={[1.18, 0.04, 0.36]} /></mesh>
        </group>
    );
}

// Mỗi phòng có 6 mesh đèn + 1 PointLight duy nhất ở trung tâm (không castShadow)
function RoomLighting({ cx, cz, w, d }) {
    const lightY = -0.5;
    const cols = 3, rows = 2;
    const meshes = [];
    for (let ci = 0; ci < cols; ci++) {
        for (let ri = 0; ri < rows; ri++) {
            const x = cx - w / 2 + (w / (cols + 1)) * (ci + 1);
            const z = cz - d / 2 + (d / (rows + 1)) * (ri + 1);
            meshes.push(<CeilingLightMesh key={`${ci}-${ri}`} position={[x, lightY, z]} />);
        }
    }
    return (
        <>
            {meshes}
            {/* 1 pointLight duy nhất mỗi phòng, KHÔNG castShadow */}
            <pointLight position={[cx, lightY, cz]} intensity={2.5} distance={14} decay={2} color="#fff8e7" />
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHẬU CÂY
// ─────────────────────────────────────────────────────────────────────────────
function RoomPlant({ position }) {
    const floorY = -6.0;
    return (
        <group position={[position[0], floorY, position[2]]}>
            <mesh position={[0, 0.32, 0]} material={MAT.pot}><cylinderGeometry args={[0.28, 0.20, 0.64, 12]} /></mesh>
            <mesh position={[0, 0.64, 0]} material={MAT.potSoil}><cylinderGeometry args={[0.27, 0.27, 0.05, 8]} /></mesh>
            <mesh position={[0, 1.12, 0]} material={MAT.treeDark}><sphereGeometry args={[0.50, 10, 10]} /></mesh>
            <mesh position={[-0.30, 0.88, 0.22]} material={MAT.treeMid}><sphereGeometry args={[0.32, 8, 8]} /></mesh>
            <mesh position={[0.28, 0.96, -0.18]} material={MAT.treeLite}><sphereGeometry args={[0.28, 8, 8]} /></mesh>
            <mesh position={[0, 0.75, 0]} material={MAT.treeTrunk}><cylinderGeometry args={[0.05, 0.07, 0.22, 6]} /></mesh>
        </group>
    );
}

function RoomPlants({ cx, cz, w, d }) {
    const hw = w / 2 - 1.2, hd = d / 2 - 1.2;
    return (
        <>
            <RoomPlant position={[cx - hw, 0, cz - hd]} />
            <RoomPlant position={[cx + hw, 0, cz - hd]} />
            <RoomPlant position={[cx - hw, 0, cz + hd]} />
            <RoomPlant position={[cx + hw, 0, cz + hd]} />
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// KIẾN TRÚC
// ─────────────────────────────────────────────────────────────────────────────
function OfficeDoor({ position, rotation = [0, 0, 0] }) {
    return (
        <group position={position} rotation={rotation}>
            <mesh position={[0, 1.1, 0]} material={MAT.doorFrame}><boxGeometry args={[1.3, 2.2, 0.08]} /></mesh>
            <mesh position={[-0.05, 1.05, 0.01]} material={MAT.doorWood}><boxGeometry args={[1.15, 2.1, 0.04]} /></mesh>
        </group>
    );
}

function BuildingArchitecture({ W, D }) {
    return (
        <group>
            <mesh position={[-1.5, -3, 0]} material={MAT.wall}><boxGeometry args={[0.08, 6, D]} /></mesh>
            <mesh position={[1.5, -3, 0]} material={MAT.wall}><boxGeometry args={[0.08, 6, D]} /></mesh>
            <mesh position={[0, -3, -1.5]} material={MAT.wall}><boxGeometry args={[W, 6, 0.08]} /></mesh>
            <mesh position={[0, -3, 1.5]} material={MAT.wall}><boxGeometry args={[W, 6, 0.08]} /></mesh>
            <OfficeDoor position={[-1.5, -6, -5]} rotation={[0, Math.PI / 2, 0]} />
            <OfficeDoor position={[1.5, -6, -5]} rotation={[0, -Math.PI / 2, 0]} />
            <OfficeDoor position={[-1.5, -6, 5]} rotation={[0, Math.PI / 2, 0]} />
            <OfficeDoor position={[1.5, -6, 5]} rotation={[0, -Math.PI / 2, 0]} />
        </group>
    );
}

function OfficeWorkspace({ position }) {
    return (
        <group position={[position[0], -5.3, position[2]]}>
            <mesh material={MAT.deskTop}><boxGeometry args={[1.9, 0.05, 0.9]} /></mesh>
            {[[-0.85, -0.35, 0.35], [0.85, -0.35, 0.35], [-0.85, -0.35, -0.35], [0.85, -0.35, -0.35]].map((p, i) => (
                <mesh key={i} position={[p[0], p[1], p[2]]} material={MAT.deskLeg}><cylinderGeometry args={[0.02, 0.02, 0.65, 6]} /></mesh>
            ))}
        </group>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ĐƯỜNG ỐNG
// ─────────────────────────────────────────────────────────────────────────────
function Pipe({ start, end, type = 'chw-s', r = 0.09 }) {
    const s = useMemo(() => new THREE.Vector3(...start), [start]);
    const e = useMemo(() => new THREE.Vector3(...end), [end]);
    if (s.distanceTo(e) < 0.01) return null;
    const dir = new THREE.Vector3().subVectors(e, s);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(s, e).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return (
        <mesh position={mid} quaternion={q} material={PIPE_MATS[type]}>
            <cylinderGeometry args={[r, r, len, 6]} />
        </mesh>
    );
}

function PolyPipe({ pts, type, r = 0.09 }) {
    if (!pts || pts.length < 2) return null;
    return <>{pts.slice(0, -1).map((p, i) => <Pipe key={i} start={p} end={pts[i + 1]} type={type} r={r} />)}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// MÔ HÌNH THIẾT BỊ - dùng MeshLambertMaterial + useMemo
// ─────────────────────────────────────────────────────────────────────────────
const ChillerModel = ({ clr }) => {
    const mat = useMemo(() => makeMat(clr), [clr]);
    return (
        <group>
            <RoundedBox args={[5.5, 2.6, 3.0]} radius={0.1} castShadow><primitive object={mat} attach="material" /></RoundedBox>
            <mesh position={[0, -0.5, 1.5]} rotation={[0, 0, Math.PI / 2]} material={MAT.pipeChwS}><cylinderGeometry args={[0.35, 0.35, 5.5, 10]} /></mesh>
            <mesh position={[0, -0.5, -1.5]} rotation={[0, 0, Math.PI / 2]} material={MAT.pipeCwS}><cylinderGeometry args={[0.35, 0.35, 5.5, 10]} /></mesh>
        </group>
    );
};

const TowerModel = ({ clr, on }) => {
    const fanRef = useRef();
    const mat = useMemo(() => makeMat(clr), [clr]);

    useFrame((_, dt) => {
        if (fanRef.current && on)
            fanRef.current.rotation.y += dt * 8;
    });

    return (
        <group>

            {/* THÂN COOLING TOWER */}
            <Cylinder
                args={[1.8, 2.2, 4.5, 14]}
                position={[0, 2.25, 0]}
                castShadow
            >
                <primitive object={mat} attach="material" />
            </Cylinder>

            {/* QUẠT */}
            <group ref={fanRef} position={[0, 4.5, 0]}>
                {[0, 60, 120, 180, 240, 300].map(deg => (
                    <mesh
                        key={deg}
                        rotation={[0, (deg * Math.PI) / 180, 0]}
                        material={MAT.dark}
                    >
                        <boxGeometry args={[3.2, 0.04, 0.25]} />
                    </mesh>
                ))}
            </group>

            {/* MÁI CHE */}
            <mesh
                position={[0, 5.2, 0]}
                material={MAT.roofFrame}
            >
                <cylinderGeometry args={[2.8, 2.8, 0.15, 20]} />
            </mesh>

            {/* CỘT ĐỠ MÁI */}
            {[
                [1.8, 4.9, 0],
                [-1.8, 4.9, 0],
                [0, 4.9, 1.8],
                [0, 4.9, -1.8],
            ].map((p, i) => (
                <mesh
                    key={i}
                    position={p}
                    material={MAT.colCap}
                >
                    <cylinderGeometry args={[0.05, 0.05, 0.7, 6]} />
                </mesh>
            ))}

        </group>
    );
};
const PumpModel = ({ clr }) => {
    const mat = useMemo(() => makeMat(clr), [clr]);
    return (
        <group rotation={[0, Math.PI / 2, 0]}>
            <Cylinder args={[0.35, 0.35, 1.3, 12]} rotation={[0, 0, Math.PI / 2]} castShadow><primitive object={mat} attach="material" /></Cylinder>
            <Sphere args={[0.5]}><primitive object={MAT.dark} attach="material" /></Sphere>
        </group>
    );
};

const ValveModel = ({ clr }) => {
    const mat = useMemo(() => makeMat(clr), [clr]);
    return (
        <group>
            <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.22, 0.22, 1.1, 12]} /><primitive object={mat} attach="material" /></mesh>
            <mesh position={[0, 0.35, 0]} material={MAT.dark2}><boxGeometry args={[0.4, 0.4, 0.4]} /></mesh>
        </group>
    );
};

const PipeSensorModel = ({ clr }) => {
    const mat = useMemo(() => makeMat(clr), [clr]);
    return (
        <group>
            <mesh rotation={[0, 0, Math.PI / 2]} material={MAT.colCap}><cylinderGeometry args={[0.2, 0.2, 1.3, 10]} /></mesh>
            <mesh position={[0, 0.35, 0]}><cylinderGeometry args={[0.12, 0.12, 0.35, 8]} /><primitive object={mat} attach="material" /></mesh>
        </group>
    );
};

const AHUModel = ({ clr, on }) => {
    const fanRef = useRef();
    const mat = useMemo(() => makeMat(clr), [clr]);
    useFrame((_, dt) => { if (fanRef.current && on) fanRef.current.rotation.z += dt * 6; });
    return (
        <group>
            <RoundedBox args={[2.4, 1.4, 1.6]} radius={0.05} castShadow><primitive object={mat} attach="material" /></RoundedBox>
            <group ref={fanRef} position={[0, 0, 0.81]}>
                {[0, 45, 90, 135].map(deg => (
                    <mesh key={deg} rotation={[0, 0, (deg * Math.PI) / 180]} material={MAT.pipeChwR}><boxGeometry args={[1.2, 0.06, 0.05]} /></mesh>
                ))}
            </group>
        </group>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// DEVICE NODE
// ─────────────────────────────────────────────────────────────────────────────
function DeviceNode({ device, onSelect, isSelected }) {
    const hasFault = device.fault === 1;
    const isRunning = device.type === 'VALVE' ? device.state === 1 : device.type === 'PIPE' ? device.flow_status === 1 : device.power === 1;
    const clr = hasFault ? '#ef4444' : isSelected ? '#a855f7' : isRunning ? '#10b981' : '#64748b';

    const icon = hasFault ? <AlertTriangle size={12} className="text-white" /> :
        ({
            CHILLER: <Snowflake size={12} className="text-white" />, COOLINGTOWER: <Fan size={12} className="text-white" />,
            PIPE: <Droplets size={12} className="text-white" />, AHU: <Wind size={12} className="text-white" />,
            VALVE: <Activity size={12} className="text-white" />
        })[device.type] ?? <Power size={12} className="text-white" />;

    const model = {
        CHILLER: <ChillerModel clr={clr} />, COOLINGTOWER: <TowerModel clr={clr} on={isRunning} />,
        COOLINGPUMP: <PumpModel clr={clr} />, COLDPUMP: <PumpModel clr={clr} />,
        VALVE: <ValveModel clr={clr} />, PIPE: <PipeSensorModel clr={clr} />, AHU: <AHUModel clr={clr} on={isRunning} />
    }[device.type];

    return (
        <group position={device.position}>
            <group onClick={(e) => { e.stopPropagation(); onSelect(device); }} style={{ cursor: 'pointer' }}>{model}</group>
            <Html position={[0, device.badgeY ?? 1.1, 0]} center pointerEvents="auto">
                <button onClick={(e) => { e.stopPropagation(); onSelect(device); }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center border-2 cursor-pointer transition-all shadow-md active:scale-90 hover:scale-110 pointer-events-auto
                    ${hasFault ? 'bg-red-500 border-white animate-pulse' : isSelected ? 'bg-purple-500 border-white ring-4 ring-purple-500/30' : isRunning ? 'bg-emerald-500 border-emerald-100' : 'bg-slate-600 border-slate-400'}`}>
                    {icon}
                </button>
            </Html>
        </group>
    );
}

// ─────────────────────────────────────────────────────────────
// MÁI CHE 4 GÓC - PHIÊN BẢN ĐẸP
// ─────────────────────────────────────────────────────────────

function CornerRoof({
    position,
    rotation,
    pillarHeight = 11,
    roofMaterial = MAT.roofFrame
}) {

    return (
        <group position={position} rotation={rotation}>

            {/* MẶT MÁI CHÍNH */}
            <mesh
                castShadow
                receiveShadow
                material={roofMaterial}
            >
                <boxGeometry args={[20, 0.5, 20]} />
            </mesh>

            {/* VIỀN PHÁT SÁNG */}
            <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(20, 0.3, 20)]} />
                <lineBasicMaterial color="#6ee7ff" linewidth={2} />
            </lineSegments>

            {/* CỘT CHÍNH */}
            <mesh
                position={[0, -pillarHeight / 2, 0]}
                castShadow
            >
                <cylinderGeometry
                    args={[0.45, 0.5, pillarHeight, 16]}
                />
                <primitive object={MAT.colBody} attach="material" />
            </mesh>

            {/* THANH CHÉO ĐỠ */}
            <mesh
                position={[0, -3, 0]}
                rotation={[0, 0, Math.PI / 4]}
                castShadow
            >
                <boxGeometry args={[0.2, 6, 0.2]} />
                <primitive object={MAT.colCap} attach="material" />
            </mesh>

            <mesh
                position={[0, -3, 0]}
                rotation={[0, 0, -Math.PI / 4]}
                castShadow
            >
                <boxGeometry args={[0.2, 6, 0.2]} />
                <primitive object={MAT.colCap} attach="material" />
            </mesh>

            {/* ĐÈN DƯỚI MÁI */}
            <pointLight
                position={[0, -0.8, 0]}
                intensity={1.8}
                distance={18}
                color="#ffe8b6"
            />

        </group>
    );
}


// ─────────────────────────────────────────────────────────────
// BUILDING ROOF SYSTEM
// ─────────────────────────────────────────────────────────────

function BuildingCornerRoof() {

    const roofY = 13;
    const pillarH = 13;
    const overhang = 0.5;

    return (
        <group>

            {/* GÓC TRƯỚC - TRÁI */}
            <CornerRoof
                position={[-20 - overhang, roofY, -10 - overhang]}
                rotation={[0, Math.PI / 4, 0]}
                pillarHeight={pillarH}
            />

            {/* GÓC TRƯỚC - PHẢI */}
            <CornerRoof
                position={[20 + overhang, roofY, -10 - overhang]}
                rotation={[0, -Math.PI / 4, 0]}
                pillarHeight={pillarH}
            />

            {/* GÓC SAU - TRÁI */}
            <CornerRoof
                position={[-20 - overhang, roofY, 10 + overhang]}
                rotation={[0, -Math.PI / 4, 0]}
                pillarHeight={pillarH}
            />

            {/* GÓC SAU - PHẢI */}
            <CornerRoof
                position={[20 + overhang, roofY, 10 + overhang]}
                rotation={[0, Math.PI / 4, 0]}
                pillarHeight={pillarH}
            />

        </group>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT CHÍNH
// ─────────────────────────────────────────────────────────────────────────────
export default function Building3D({ devices = [] }) {
    const { user } = useContext(AuthContext);
    const [selectedDeviceCode, setSelectedDeviceCode] = useState(null);

    const [liveData, setLiveData] = useState({
        "chiller-001": { code: "chiller-001", type: "CHILLER", name: "Máy làm lạnh nước Chiller Trung Tâm", power: 1, "auto-mode": 1, fault: 0 },
        "COOLINGTOWER-001": { code: "COOLINGTOWER-001", type: "COOLINGTOWER", name: "Tháp giải nhiệt khí ngoài trời", power: 1, "auto-mode": 1, fault: 0 },
        "COOLINGPUMP-001": { code: "COOLINGPUMP-001", type: "COOLINGPUMP", name: "Bơm tuần hoàn nước giải nhiệt tháp", power: 1, "auto-mode": 1, fault: 0, speed: "45.2" },
        "COLDPUMP-001": { code: "COLDPUMP-001", type: "COLDPUMP", name: "Bơm nước lạnh cấp tầng biến tần", power: 1, "auto-mode": 1, fault: 0, speed: "42.8" },
        "PIPE-001": { code: "PIPE-001", type: "PIPE", name: "Cảm biến lưu lượng trục ống chính", flow_status: 1, temperature: "12.40", flow_rate: "23.40", pressure: "1.60" },
        "VALVE-001": { code: "VALVE-001", type: "VALVE", name: "Van chặn Motorized tuyến trung tâm", state: 1 },
        "AHU-ROOM-A": { code: "AHU-ROOM-A", type: "AHU", name: "Bộ xử lý không khí AHU - Phòng Đông Bắc (101)", power: 1, "auto-mode": 1, fault: 0, temperature: "22.4", frequency: "45.0" },
        "AHU-ROOM-B": { code: "AHU-ROOM-B", type: "AHU", name: "Bộ xử lý không khí AHU - Phòng Tây Bắc (102)", power: 1, "auto-mode": 1, fault: 0, temperature: "21.8", frequency: "47.5" },
        "AHU-ROOM-C": { code: "AHU-ROOM-C", type: "AHU", name: "Bộ xử lý không khí AHU - Phòng Đông Nam (103)", power: 1, "auto-mode": 1, fault: 0, temperature: "23.1", frequency: "44.2" },
        "AHU-ROOM-D": { code: "AHU-ROOM-D", type: "AHU", name: "Bộ xử lý không khí AHU - Phòng Tây Nam (104)", power: 1, "auto-mode": 1, fault: 0, temperature: "22.0", frequency: "46.0" },
    });

    // WebSocket - giữ nguyên hoàn toàn
    useEffect(() => {
        const socket = io("http://localhost:3000");
        socket.on("connect", () => {
            console.log("✅ SCADA 3D Connected");
            if (user?.role === 'SUPER_ADMIN') {
                // Nếu là sếp tổng thì mới join phòng Global
                socket.emit("join-super-admin");
            } else if (user?.building?.id) {
                // Nếu là Admin tòa nhà thì chỉ join phòng của nhà mình
                socket.emit("join-building", user.building.id);
            }
        });
        socket.on("device-update", (payload) => {
            console.log("⚡ 3D View nhận data Real-time:", payload.code);
            setLiveData(prev => {
                const next = { ...prev };
                if (next[payload.code]) {
                    next[payload.code] = { ...next[payload.code], ...payload.latest_state, type: payload.type || next[payload.code].type };
                } else {
                    next[payload.code] = { code: payload.code, type: payload.type, ...payload.latest_state };
                }
                return next;
            });
        });
        socket.on("disconnect", () => console.log("❌ SCADA 3D Disconnected"));
        return () => socket.disconnect();
    }, [user]);

    const W = 42, D = 26, Y_PVP = 0.9, Y_RF = 8.0, Y_AHU = -0.75;

    const finalDevices3D = useMemo(() => {
        const pm = {
            "chiller-001": { pos: [0, 1.4, 0], badgeY: 2.0 },
            "COOLINGTOWER-001": { pos: [0, Y_RF, -7.5], badgeY: 5.0 },
            "COOLINGPUMP-001": { pos: [-10, 2.0, -4], badgeY: 1.1 },
            "COLDPUMP-001": { pos: [7, Y_PVP, 4], badgeY: 1.1 },
            "PIPE-001": { pos: [0, Y_PVP, 7.5], badgeY: 1.1 },
            "VALVE-001": { pos: [-5, Y_PVP, 7.5], badgeY: 1.1 },
            "AHU-ROOM-A": { pos: [-11, Y_AHU, -7.5], badgeY: 1.1 },
            "AHU-ROOM-B": { pos: [11, Y_AHU, -7.5], badgeY: 1.1 },
            "AHU-ROOM-C": { pos: [-11, Y_AHU, 7.5], badgeY: 1.1 },
            "AHU-ROOM-D": { pos: [11, Y_AHU, 7.5], badgeY: 1.1 },
        };

        return Object.keys(liveData).map(k => ({ ...liveData[k], position: pm[k]?.pos || [0, 0, 0], badgeY: pm[k]?.badgeY || 1.0 }));
    }, [liveData]);

    const selectedDevice = liveData[selectedDeviceCode] || null;

    const pipes = useMemo(() => {
        const S = 0.9, RH = 2.8, CWH = 2.0;
        return {
            to_ColdPump: [[0, S, 1.6], [7, S, 1.6], [7, S, 4]],
            to_Sensors: [[7, S, 4], [7, S, 7.5], [0, S, 7.5]],
            to_Valve: [[0, S, 7.5], [-5, S, 7.5]],
            AHU_A_S: [[-5, S, 7.5], [-5, S, -5.5], [-11, S, -5.5], [-11, Y_AHU, -5.5], [-11, Y_AHU, -6.5]],
            AHU_B_S: [[-5, S, 7.5], [5, S, 7.5], [5, S, -5.5], [11, S, -5.5], [11, Y_AHU, -5.5], [11, Y_AHU, -6.6]],
            AHU_C_S: [[-5, S, 7.5], [-11, S, 7.5], [-11, Y_AHU, 7.5], [-11, Y_AHU, 6.7]],
            AHU_D_S: [[-5, S, 7.5], [5, S, 7.5], [11, S, 7.5], [11, Y_AHU, 7.5], [11, Y_AHU, 6.7]],
            AHU_A_R: [[-11, Y_AHU, -8.3], [-11, RH, -8.3], [-2, RH, -8.3], [-2, RH, -1.6], [0, RH, -1.6], [0, S, -1.6]],
            AHU_B_R: [[11, Y_AHU, -8.3], [11, RH, -8.3], [2, RH, -8.3], [2, RH, -1.6], [0, RH, -1.6], [0, S, -1.6]],
            AHU_C_R: [[-11, Y_AHU, 8.3], [-11, RH, 8.3], [-3, RH, 8.3], [-3, RH, -1.6], [0, RH, -1.6], [0, S, -1.6]],
            AHU_D_R: [[11, Y_AHU, 8.3], [11, RH, 8.3], [3, RH, 8.3], [3, RH, -1.6], [0, RH, -1.6], [0, S, -1.6]],
            CW_S: [[-2, S, -1.6], [-2, CWH, -1.6], [-10, CWH, -1.6], [-10, CWH, -4], [-10, CWH, -7.5], [-0.8, CWH, -7.5], [-0.8, Y_RF + 2.2, -7.5]],
            CW_R: [[0.8, Y_RF + 0.3, -7.5], [0.8, S, -7.5], [0, S, -7.5], [0, S, -1.6]],
        };
    }, []);

    const officeDesks = useMemo(() => {
        const d = [];
        [{ xRange: [-18, -5], zRange: [-11, -4] }, { xRange: [5, 18], zRange: [-11, -4] },
        { xRange: [-18, -5], zRange: [4, 11] }, { xRange: [5, 18], zRange: [4, 11] }]
            .forEach(r => {
                for (let x = r.xRange[0]; x <= r.xRange[1]; x += 4.5)
                    for (let z = r.zRange[0]; z <= r.zRange[1]; z += 4.0)
                        d.push([x, z]);
            });
        return d;
    }, []);

    return (
        <div className="w-full h-[840px] rounded-[1.8rem] overflow-hidden bg-slate-950 border border-slate-800 relative font-sans text-white antialiased shadow-2xl">
            <Canvas
                shadows={false}
                camera={{ position: [35, 22, 35], fov: 38 }}
                gl={{ logarithmicDepthBuffer: true, antialias: true }}
            >
                <OrbitControls enableDamping maxPolarAngle={Math.PI / 2.05} />

                {/* ÁNH SÁNG - KHÔNG dùng Environment preset để tiết kiệm texture units */}
                <ambientLight intensity={0.7} />
                <directionalLight position={[25, 40, 20]} intensity={1.6} />
                <directionalLight position={[-15, 20, -10]} intensity={0.4} color="#b0c8ff" />
                <hemisphereLight skyColor="#334155" groundColor="#0f172a" intensity={0.5} />

                {/* SÀN */}
                <mesh position={[0, -6, 0]} material={MAT.floorB1}><boxGeometry args={[W, 0.15, D]} /><Edges color="#334155" /></mesh>
                <mesh position={[0, 0, 0]} material={MAT.floorB2}><boxGeometry args={[W, 0.15, D]} /><Edges color="#1e3a5f" /></mesh>
                <mesh position={[0, Y_RF, 0]} material={MAT.floorRoof}><boxGeometry args={[W, 0.15, D]} /><Edges color="#059669" /></mesh>
                <BuildingCornerRoof />

                <BuildingArchitecture W={W} D={D} />

                {/* 4 PHÒNG */}
                {ROOMS.map(room => (
                    <group key={room.id}>
                        <RoomColumns cx={room.cx} cz={room.cz} w={room.w} d={room.d} />
                        <RoomRoof centerX={room.cx} centerZ={room.cz} width={room.w} depth={room.d} />
                        <RoomLighting cx={room.cx} cz={room.cz} w={room.w} d={room.d} />
                        <RoomPlants cx={room.cx} cz={room.cz} w={room.w} d={room.d} />
                    </group>
                ))}

                {officeDesks.map((pos, i) => <OfficeWorkspace key={i} position={[pos[0], 0, pos[1]]} />)}

                <PolyPipe pts={pipes.to_ColdPump} type="chw-s" />
                <PolyPipe pts={pipes.to_Sensors} type="chw-s" />
                <PolyPipe pts={pipes.to_Valve} type="chw-s" />
                <PolyPipe pts={pipes.AHU_A_S} type="chw-s" />
                <PolyPipe pts={pipes.AHU_B_S} type="chw-s" />
                <PolyPipe pts={pipes.AHU_C_S} type="chw-s" />
                <PolyPipe pts={pipes.AHU_D_S} type="chw-s" />
                <PolyPipe pts={pipes.AHU_A_R} type="chw-r" />
                <PolyPipe pts={pipes.AHU_B_R} type="chw-r" />
                <PolyPipe pts={pipes.AHU_C_R} type="chw-r" />
                <PolyPipe pts={pipes.AHU_D_R} type="chw-r" />
                <PolyPipe pts={pipes.CW_S} type="cw-s" />
                <PolyPipe pts={pipes.CW_R} type="cw-r" />

                {finalDevices3D.map(d => (
                    <DeviceNode key={d.code} device={d} onSelect={(dev) => setSelectedDeviceCode(dev.code)} isSelected={selectedDeviceCode === d.code} />
                ))}

                <ContactShadows position={[0, -5.92, 0]} opacity={0.3} scale={45} blur={2.5} frames={1} />
            </Canvas>

            {/* SIDEBAR SCADA */}
            <div className="absolute top-6 right-6 w-86 bg-slate-900/90 backdrop-blur-lg border border-slate-700/80 rounded-2xl p-5 shadow-2xl pointer-events-auto z-50">
                {selectedDevice ? (
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-700/50 pb-3 mb-4">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${selectedDevice.fault === 1 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 animate-ping'}`} />
                                <h3 className="font-mono font-bold text-sm text-sky-400 tracking-wider uppercase">{selectedDevice.code}</h3>
                            </div>
                            <button onClick={() => setSelectedDeviceCode(null)} className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors"><X size={16} /></button>
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
                            {selectedDevice.type === 'PIPE' && (<><ScadaDataRow label="Lưu lượng dòng chảy tức thời" value={selectedDevice.flow_rate} unit="m³/h" color="text-cyan-400" /><ScadaDataRow label="Áp suất thủy lực đường ống" value={selectedDevice.pressure} unit="bar" color="text-emerald-400" /><ScadaDataRow label="Nhiệt độ nước cảm biến hồi" value={selectedDevice.temperature} unit="°C" color="text-sky-400" /><ScadaDataRow label="Trạng thái dòng chảy (Flow)" value={selectedDevice.flow_status === 1 ? "CÓ DÒNG" : "ĐỨNG YÊN"} unit="" color="text-teal-400" /></>)}
                            {(selectedDevice.type === 'COOLINGPUMP' || selectedDevice.type === 'COLDPUMP') && (<><ScadaDataRow label="Tốc độ tần số biến tần (VFD)" value={selectedDevice.speed} unit="Hz" color="text-amber-400" /><ScadaDataRow label="Tải làm việc động cơ" value={selectedDevice.power === 1 ? "100%" : "0%"} unit="" color="text-slate-300" /></>)}
                            {selectedDevice.type === 'CHILLER' && (<><ScadaDataRow label="Trạng thái máy nén" value={selectedDevice.power === 1 ? "RUNNING" : "STOP"} unit="" color="text-emerald-400" /><ScadaDataRow label="Hiệu suất tải lạnh trung tâm" value="320 RT" unit="" color="text-sky-400" /><ScadaDataRow label="Chỉ số năng lượng COP" value="5.65" unit="" color="text-yellow-500" /></>)}
                            {selectedDevice.type === 'COOLINGTOWER' && (<><ScadaDataRow label="Trạng thái Motor quạt tháp" value={selectedDevice.power === 1 ? "ON" : "OFF"} unit="" color="text-emerald-400" /><ScadaDataRow label="Tốc độ quạt giải nhiệt" value={selectedDevice.power === 1 ? "950" : "0"} unit="RPM" color="text-teal-400" /></>)}
                            {selectedDevice.type === 'VALVE' && (<><ScadaDataRow label="Trạng thái đóng mở Van" value={selectedDevice.state === 1 ? "MỞ HOÀN TOÀN" : "ĐÓNG KÍN"} unit="" color={selectedDevice.state === 1 ? "text-emerald-400" : "text-rose-400"} /><ScadaDataRow label="Độ mở điều tiết góc hành trình" value={selectedDevice.state === 1 ? "100" : "0"} unit="%" color="text-slate-300" /></>)}
                            {selectedDevice.type === 'AHU' && (<><ScadaDataRow label="Tần số quạt cấp biến tần" value={selectedDevice.frequency} unit="Hz" color="text-sky-400" /><ScadaDataRow label="Nhiệt độ phòng hiện tại" value={selectedDevice.temperature} unit="°C" color="text-rose-400" /></>)}
                            <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800/60">
                                <span className="text-slate-400">Trạng thái vận hành:</span>
                                <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${selectedDevice.fault === 1 ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                                    {selectedDevice.fault === 1 ? 'CẢNH BÁO LỖI (FAULT)' : 'HOẠT ĐỘNG ỔN ĐỊNH'}
                                </span>
                            </div>
                            {/* VỊ TRÍ THIẾT BỊ TỰ ĐỘNG THEO LOGIC HỆ THỐNG */}
                            <div className="flex justify-between items-center text-xs pt-2">
                                <span className="text-slate-400">
                                    Vị trí thiết bị:
                                </span>

                                <span className="text-cyan-400 font-bold uppercase tracking-tighter">
                                    {(() => {
                                        // 1. Nếu là Tháp giải nhiệt
                                        if (selectedDevice.type === 'COOLINGTOWER') {
                                            return 'Tầng mái';
                                        }

                                        // 2. Nếu là các máy AHU (Dựa theo mã ROOM-A, B, C, D)
                                        if (selectedDevice.type === 'AHU') {
                                            if (selectedDevice.code.includes('ROOM-A')) return 'Phòng A';
                                            if (selectedDevice.code.includes('ROOM-B')) return 'Phòng B';
                                            if (selectedDevice.code.includes('ROOM-C')) return 'Phòng C';
                                            if (selectedDevice.code.includes('ROOM-D')) return 'Phòng D';
                                            return 'Khu vực văn phòng';
                                        }

                                        // 3. Còn lại (Chiller, Bơm, Van, Pipe) mặc định ở Tầng kỹ thuật
                                        return 'Tầng kỹ thuật';
                                    })()}
                                </span>
                            </div>

                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10 text-slate-400 text-xs flex flex-col items-center gap-3">
                        <Layout size={28} className="text-slate-600 animate-pulse mb-1" />
                        <p className="font-bold text-slate-300 text-sm">Hệ Thống Trung Tâm SCADA</p>
                        <p className="text-[11px] text-slate-500 max-w-[240px] leading-relaxed">Dữ liệu đang được đồng bộ trực tuyến qua Socket.io. Vui lòng click chọn thiết bị cơ điện trên mô hình để giám sát thông số vận hành tức thời.</p>
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