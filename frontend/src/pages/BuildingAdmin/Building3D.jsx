import React, { useState, useMemo, useEffect, useContext, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Box, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import {
    AlertTriangle, Snowflake, Fan, Power, Activity,
    Wind, Droplets, Lightbulb, X, Thermometer, Gauge, Zap, Settings2
} from 'lucide-react';
import { NotificationContext } from '../../context/NotificationContext';

// ==========================================
// 1. ĐỊNH NGHĨA VẬT LIỆU TÒA NHÀ
// ==========================================
const MAT = {
    wall: new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.85 }),
    wallSide: new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.9 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#bae6fd', transmission: 0.55, opacity: 0.35, transparent: true, roughness: 0.05, side: THREE.DoubleSide }),
    balconyGlass: new THREE.MeshPhysicalMaterial({ color: '#e0f2fe', transmission: 0.7, opacity: 0.25, transparent: true, roughness: 0.05, side: THREE.DoubleSide }),
    windowFrame: new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.6 }),
    windowGlass: new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.15, metalness: 0.2 }),
    redAccent: new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.5, metalness: 0.1 }),
    redFrame: new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.4, metalness: 0.15 }),
    floorSlab: new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 1 }),
    balconyFloor: new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.9 }),
    railing: new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.5, metalness: 0.6 }),
    railPost: new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.4, metalness: 0.7 }),
    ground: new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 1 }),
    pipeRed: new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.3, metalness: 0.5 }),
    pipeBlue: new THREE.MeshStandardMaterial({ color: '#3b82f6', roughness: 0.3, metalness: 0.5 }),
    roofTop: new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.95 }),
    stairRail: new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.4, metalness: 0.8 }),
    concrete: new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 1 }),
};

const W = 20;   // chiều rộng tòa nhà
const D = 13;   // chiều sâu
const H = 3.6;  // chiều cao mỗi tầng
const BAL_D = 3.5; // độ nhô của ban công

// ==========================================
// 2. HÀM VẼ CỬA SỔ (dùng lại nhiều nơi)
// ==========================================
function Window({ x, y, z, rotY = 0, w = 1.8, h = 1.6 }) {
    return (
        <group position={[x, y, z]} rotation={[0, rotY, 0]}>
            {/* Khung cửa */}
            <Box args={[w + 0.15, h + 0.15, 0.12]} position={[0, 0, 0]} material={MAT.windowFrame} />
            {/* Kính */}
            <Box args={[w - 0.1, h - 0.1, 0.1]} position={[0, 0, 0.02]} material={MAT.windowGlass} />
            {/* Thanh ngang giữa */}
            <Box args={[w + 0.15, 0.06, 0.13]} position={[0, 0, 0]} material={MAT.windowFrame} />
        </group>
    );
}

// ==========================================
// 3. BAN CÔNG (Balcony) – Mặt trước các tầng 1-4
// ==========================================
function Balcony({ y, width = W, depth = BAL_D }) {
    const posts = [];
    const postCount = Math.floor(width / 1.2);
    for (let i = 0; i <= postCount; i++) {
        const px = -width / 2 + (i / postCount) * width;
        posts.push(
            <Cylinder key={i} args={[0.04, 0.04, 1.05, 8]} position={[px, 0.52, depth / 2 - 0.05]} material={MAT.railPost} />
        );
    }

    return (
        <group position={[0, y, D / 2]}>
            {/* Sàn ban công */}
            <Box args={[width, 0.18, depth]} position={[0, 0, depth / 2 - 0.09]} material={MAT.balconyFloor} castShadow receiveShadow />
            {/* Kính tay vịn ban công */}
            <Box args={[width, 0.9, 0.06]} position={[0, 0.5, depth - 0.03]} material={MAT.balconyGlass} />
            {/* Tay vịn trên */}
            <Box args={[width, 0.08, 0.1]} position={[0, 1.0, depth - 0.05]} material={MAT.railing} />
            {posts}
            {/* Tường 2 bên ban công */}
            <Box args={[0.15, 1.1, depth]} position={[-width / 2 + 0.07, 0.55, depth / 2]} material={MAT.wall} castShadow />
            <Box args={[0.15, 1.1, depth]} position={[width / 2 - 0.07, 0.55, depth / 2]} material={MAT.wall} castShadow />
        </group>
    );
}

// ==========================================
// 4. VẼ TẦNG NỔI VÀ TẦNG HẦM
// ==========================================
function FloorLevel({ level, activeFloor }) {
    if (activeFloor !== null && activeFloor !== level) return null;
    const yBase = (level - 1) * H;
    const isBasement = level === 0;

    if (isBasement) {
        return (
            <group position={[0, yBase, 0]}>
                <Box args={[W, 0.25, D]} position={[0, -0.12, 0]} material={MAT.floorSlab} receiveShadow />
                <Box args={[W, H, D]} position={[0, H / 2, 0]}
                    material={new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 1 })} />
                {/* Ống kỹ thuật tầng hầm */}
                <Cylinder args={[0.15, 0.15, 8, 16]} position={[-4, H * 0.4, 0]} rotation={[0, 0, Math.PI / 2]} material={MAT.pipeRed} />
                <Cylinder args={[0.15, 0.15, 8, 16]} position={[4, H * 0.4, 0]} rotation={[0, 0, Math.PI / 2]} material={MAT.pipeBlue} />
            </group>
        );
    }

    // Tầng thường 1-4
    const hasBalcony = level >= 1 && level <= 4;
    // Tầng 2-4 có khung đỏ bên trái
    const hasRedFrame = level >= 2 && level <= 4;

    return (
        <group position={[0, yBase, 0]}>
            {/* Bản sàn */}
            <Box args={[W, 0.25, D]} position={[0, -0.12, 0]} material={MAT.floorSlab} castShadow receiveShadow />

            {/* Tường mặt trước (chừa khoảng ban công, chỉ là tường giữa) */}
            <Box args={[W, H, 0.3]} position={[0, H / 2, D / 2 - 0.15]} material={MAT.wall} castShadow receiveShadow />

            {/* Tường mặt sau */}
            <Box args={[W, H, 0.3]} position={[0, H / 2, -D / 2 + 0.15]} material={MAT.wallSide} castShadow receiveShadow />

            {/* Tường trái */}
            <Box args={[0.3, H, D]} position={[-W / 2 + 0.15, H / 2, 0]} material={MAT.wallSide} castShadow receiveShadow />

            {/* Tường phải */}
            <Box args={[0.3, H, D]} position={[W / 2 - 0.15, H / 2, 0]} material={MAT.wallSide} castShadow receiveShadow />

            {/* Cửa sổ mặt trước */}
            <Window x={-7} y={H * 0.52} z={D / 2 - 0.05} w={1.6} h={1.5} />
            <Window x={-4.2} y={H * 0.52} z={D / 2 - 0.05} w={1.6} h={1.5} />
            <Window x={-0.5} y={H * 0.52} z={D / 2 - 0.05} w={2.2} h={1.8} />
            <Window x={3.5} y={H * 0.52} z={D / 2 - 0.05} w={1.6} h={1.5} />
            <Window x={6.5} y={H * 0.52} z={D / 2 - 0.05} w={1.6} h={1.5} />

            {/* Cửa sổ tường trái (phía khung đỏ) */}
            <Window x={-W / 2 + 0.2} y={H * 0.55} z={1} rotY={Math.PI / 2} w={1.5} h={1.4} />
            <Window x={-W / 2 + 0.2} y={H * 0.55} z={-2} rotY={Math.PI / 2} w={1.5} h={1.4} />
            <Window x={-W / 2 + 0.2} y={H * 0.55} z={-4.5} rotY={Math.PI / 2} w={1.5} h={1.4} />

            {/* Ban công */}
            {hasBalcony && <Balcony y={-0.12} width={W * 0.96} depth={BAL_D} />}

            {/* KHUNG ĐỎ ACCENT (bên trái) – như trong ảnh */}
            {hasRedFrame && (
                <group>
                    {/* Cột đỏ dọc trái */}
                    <Box args={[0.22, H + 0.1, 0.22]}
                        position={[-W / 2 - 0.05, H / 2, D / 2 - 0.5]}
                        material={MAT.redFrame} />
                    {/* Cột đỏ dọc phải của khung */}
                    <Box args={[0.22, H + 0.1, 0.22]}
                        position={[-W / 2 - 0.05, H / 2, -D / 2 + 0.8]}
                        material={MAT.redFrame} />
                    {/* Thanh đỏ ngang (chỉ tầng 2 và 4 – đáy & đỉnh khung) */}
                    {level === 2 && (
                        <Box args={[0.22, 0.22, D - 1.1]}
                            position={[-W / 2 - 0.05, 0, 0]}
                            material={MAT.redFrame} />
                    )}
                    {level === 4 && (
                        <Box args={[0.22, 0.22, D - 1.1]}
                            position={[-W / 2 - 0.05, H, 0]}
                            material={MAT.redFrame} />
                    )}
                </group>
            )}
        </group>
    );
}

// ==========================================
// 5. VẼ TẦNG MÁI
// ==========================================
function RoofLevel({ activeFloor, maxLevel = 4 }) {
    if (activeFloor !== null && activeFloor !== 'ROOF') return null;
    const yBase = maxLevel * H;

    return (
        <group position={[0, yBase, 0]}>
            {/* Sàn mái */}
            <Box args={[W, 0.25, D]} position={[0, -0.12, 0]} material={MAT.roofTop} receiveShadow />

            {/* Lan can mái (4 mặt) */}
            <Box args={[W, 1.1, 0.1]} position={[0, 0.55, D / 2 - 0.05]} material={MAT.balconyGlass} />
            <Box args={[W, 1.1, 0.1]} position={[0, 0.55, -D / 2 + 0.05]} material={MAT.balconyGlass} />
            <Box args={[0.1, 1.1, D]} position={[W / 2 - 0.05, 0.55, 0]} material={MAT.balconyGlass} />
            <Box args={[0.1, 1.1, D]} position={[-W / 2 + 0.05, 0.55, 0]} material={MAT.balconyGlass} />

            {/* Tay vịn trên */}
            <Box args={[W + 0.1, 0.08, 0.12]} position={[0, 1.1, D / 2 - 0.05]} material={MAT.railing} />
            <Box args={[W + 0.1, 0.08, 0.12]} position={[0, 1.1, -D / 2 + 0.05]} material={MAT.railing} />
            <Box args={[0.12, 0.08, D + 0.1]} position={[W / 2, 1.1, 0]} material={MAT.railing} />
            <Box args={[0.12, 0.08, D + 0.1]} position={[-W / 2, 1.1, 0]} material={MAT.railing} />

            {/* Phòng kỹ thuật trên mái (góc phải sau) */}
            <Box args={[7, 3.2, 5.5]} position={[W / 2 - 4.5, 1.6, -D / 2 + 3.5]} material={MAT.wall} castShadow />
            <Window x={W / 2 - 4.5} y={3.0} z={-D / 2 + 6.3} w={2.0} h={1.4} />

            {/* Cầu thang lên mái (bên phải) */}
            <group position={[W / 2 + 0.2, 0, D / 2]}>
                <Box args={[0.08, 3.0, 0.08]} position={[0, 1.5, 0.5]} material={MAT.stairRail} />
                <Box args={[0.08, 3.0, 0.08]} position={[0, 1.5, -0.5]} material={MAT.stairRail} />
                <Box args={[0.08, 0.06, 1.1]} position={[0, 0.6, 0]} material={MAT.stairRail} />
                <Box args={[0.08, 0.06, 1.1]} position={[0, 1.2, 0]} material={MAT.stairRail} />
                <Box args={[0.08, 0.06, 1.1]} position={[0, 1.8, 0]} material={MAT.stairRail} />
                <Box args={[0.08, 0.06, 1.1]} position={[0, 2.4, 0]} material={MAT.stairRail} />
            </group>
        </group>
    );
}

// ==========================================
// 6. MÔI TRƯỜNG & NỀN ĐẤT
// ==========================================
function Environment() {
    return (
        <group>
            {/* Mặt đất */}
            <Box args={[120, 0.3, 120]} position={[0, -0.15, 0]} material={MAT.ground} receiveShadow />
            {/* Lề đường nhỏ */}
            <Box args={[28, 0.12, 5]} position={[0, 0.06, D / 2 + 5]} material={new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 1 })} />
            {/* Hàng rào / cổng bên phải */}
            <Box args={[0.1, 1.2, 4]} position={[W / 2 + 3, 0.6, D / 2 + 2]}
                material={new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.6, metalness: 0.4 })} />
            <Box args={[4, 0.1, 0.1]} position={[W / 2 + 1, 1.1, D / 2 + 2]}
                material={new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.6, metalness: 0.4 })} />
            {/* Trụ đèn sân */}
            <Cylinder args={[0.08, 0.08, 2.5, 8]} position={[W / 2 + 3, 1.25, D / 2 + 4]}
                material={new THREE.MeshStandardMaterial({ color: '#64748b', metalness: 0.8 })} />
            <Box args={[0.5, 0.25, 0.5]} position={[W / 2 + 3, 2.6, D / 2 + 4]}
                material={new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3 })} />
        </group>
    );
}

// ==========================================
// 7. VẼ ICON THIẾT BỊ 
// ==========================================
function DeviceMarker({ device, position, onClick }) {
    const state = device.latest_state || {};
    const hasFault = state.fault === 1;
    const isRunning = device.type === 'VALVE'
        ? state.state === 1
        : device.type === 'PIPE'
            ? state.flow_status === 1
            : state.power === 1 || state.state === 1;

    let Icon = Activity;
    if (device.type === 'CHILLER') Icon = Snowflake;
    else if (device.type === 'COOLINGTOWER') Icon = Fan;
    else if (device.type.includes('PUMP') || device.type === 'PIPE') Icon = Droplets;
    else if (device.type.includes('LIGHT')) Icon = Lightbulb;
    else if (device.type === 'FAN' || device.type === 'AHU') Icon = Wind;
    if (hasFault) Icon = AlertTriangle;

    return (
        <group position={position}>
            {/* Chân đế thiết bị */}
            <Cylinder
                args={[0.3, 0.38, 0.45, 16]}
                position={[0, -0.22, 0]}
                material={new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.8 })}
            />

            <Html
                center
                prepend
                distanceFactor={18}
                occlude={false}
                zIndexRange={[200, 100]}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
                <div
                    onClick={(e) => { e.stopPropagation(); onClick(device); }}
                    style={{ pointerEvents: 'auto' }}
                    className={`
                        cursor-pointer w-9 h-9 rounded-full
                        flex items-center justify-center
                        border-[2.5px] shadow-[0_0_18px_rgba(0,0,0,0.9)]
                        transition-transform hover:scale-125 hover:-translate-y-1
                        ${hasFault
                            ? 'bg-red-600 border-white animate-pulse'
                            : isRunning
                                ? 'bg-emerald-500 border-emerald-100'
                                : 'bg-slate-700 border-slate-400'}
                    `}
                    title={device.name || device.code}
                >
                    <Icon size={16} color="white" />
                </div>
                <div className="mt-1 text-[9px] font-black tracking-widest text-center px-2 py-0.5 rounded bg-black/80 text-white backdrop-blur-md border border-white/20 select-none whitespace-nowrap">
                    {device.type}
                </div>
            </Html>
        </group>
    );
}

// ==========================================
// COMPONENT HỖ TRỢ: HÀNG DỮ LIỆU SIDEBAR
// ==========================================
function DataRow({ icon: Icon, label, value, colorClass = 'text-white' }) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-slate-800/60 last:border-0">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                <Icon size={14} /> {label}
            </div>
            <div className={`font-mono font-bold text-sm ${colorClass}`}>
                {value ?? '--'}
            </div>
        </div>
    );
}

// ==========================================
// 8. COMPONENT CHÍNH
// ==========================================
export default function Building3D({ devices = [] }) {
    const { socket } = useContext(NotificationContext);
    const [activeFloor, setActiveFloor] = useState(null);
    const [selectedDevice, setSelectedDevice] = useState(null);

    // ── WEBSOCKET REAL-TIME (KHÔNG THAY ĐỔI) ──────────────────────────────
    useEffect(() => {
        if (!socket || !selectedDevice) return;
        const handleUpdate = (payload) => {
            if (payload.code === selectedDevice.code) {
                setSelectedDevice(prev => ({
                    ...prev,
                    latest_state: payload.latest_state,
                    last_updated: new Date(),
                }));
            }
        };
        socket.on('device-update', handleUpdate);
        return () => socket.off('device-update', handleUpdate);
    }, [socket, selectedDevice?.code]);

    useEffect(() => {
        if (selectedDevice) {
            const updated = devices.find(d => d.code === selectedDevice.code);
            if (!updated) setSelectedDevice(null);
        }
    }, [devices]);

    // ── BẢNG GÁN TẦNG CỐ ĐỊNH THEO CODE THIẾT BỊ ────────────────────────
    // Thay đổi ở đây để điều chỉnh thiết bị nào ở tầng nào.
    // assignedFloor: 0 = Tầng hầm, 1-4 = Tầng nổi, 'ROOF' = Tầng mái/thượng
    // Mỗi thiết bị có tọa độ [x, z] riêng để dàn đều trong không gian tầng.
    // Tầng hầm rộng nên chia 2 hàng Z: hàng trước (z=3) và hàng sau (z=-2).
    // Tầng nổi khoảng cách X = 5 đơn vị để icon không chồng nhau.
    const FLOOR_MAP = {
        // ── TẦNG HẦM (B1): 7 thiết bị – chia 2 hàng ──
        //   Hàng trước (z= 3): Chiller, ColdPump, CoolingPump, CoolingTower
        //   Hàng sau  (z=-2): Valve, Pipe, Pump_01
        'chiller-001': { floor: 0, x: -7, z: 3 },
        'COLDPUMP-001': { floor: 0, x: -2, z: 3 },
        'COOLINGPUMP-001': { floor: 0, x: 3, z: 3 },
        'COOLINGTOWER-001': { floor: 0, x: 8, z: 3 },
        'VALVE-001': { floor: 0, x: -5, z: -2 },
        'PIPE-001': { floor: 0, x: 0, z: -2 },
        'PUMP_01': { floor: 0, x: 5, z: -2 },

        // ── TẦNG 1: 4 thiết bị – 1 hàng, X cách nhau 5 đơn vị ──
        'AHU-T1': { floor: 1, x: -7, z: 0 },
        'FAN_T1': { floor: 1, x: -2, z: 0 },
        'DIMMER_SANH': { floor: 1, x: 3, z: 0 },
        'LIGHT_T1': { floor: 1, x: 8, z: 0 },

        // ── TẦNG 2: 4 thiết bị ──
        'AHU-T2': { floor: 2, x: -7, z: 0 },
        'FAN_T2': { floor: 2, x: -2, z: 0 },
        'DIMMER_HOP': { floor: 2, x: 3, z: 0 },
        'LIGHT_T2': { floor: 2, x: 8, z: 0 },

        // ── TẦNG 3: 2 thiết bị ──
        'AHU-T3': { floor: 3, x: -5, z: 0 },
        'LIGHT_T3': { floor: 3, x: 0, z: 0 },

        // ── TẦNG 4: 2 thiết bị ──
        'AHU-T4': { floor: 4, x: -5, z: 0 },
        'LIGHT_T4': { floor: 4, x: 0, z: 0 },

        // ── TẦNG MÁI: Bơm sinh hoạt 02 ──
        'PUMP_02': { floor: 'ROOF', x: 0, z: 0 },
    };

    const mappedDevices = useMemo(() => {
        let count = { TOWER: 0, CPUMP: 0, CHILLER: 0, CHWPUMP: 0, VALVE: 0, OTHER: 0 };
        const floorItemCount = {}; // Biến đếm để rải đều thiết bị trên các tầng nổi

        return devices.map((dev) => {
            let assignedFloor = null;
            let posX = 0, posZ = 0;

            // 1. NHẬN DIỆN TẦNG DỰA VÀO CHỮ TRONG CỘT LOCATION
            const locStr = (dev.location || '').toLowerCase();

            if (locStr.includes('hầm')) assignedFloor = 0;
            else if (locStr.includes('thượng') || locStr.includes('mái')) assignedFloor = 'ROOF';
            else if (locStr.includes('1')) assignedFloor = 1;
            else if (locStr.includes('2')) assignedFloor = 2;
            else if (locStr.includes('3')) assignedFloor = 3;
            else if (locStr.includes('4')) assignedFloor = 4;

            // Nếu location để trống hoặc không có số tầng, dùng logic dự phòng
            if (assignedFloor === null) {
                if (['CHILLER', 'COLDPUMP', 'COOLINGPUMP', 'VALVE', 'PIPE'].includes(dev.type)) assignedFloor = 0;
                else if (dev.type === 'COOLINGTOWER') assignedFloor = 0; // Đổi từ chuỗi '0' thành số 0 chuẩn chỉnh
                else assignedFloor = 1; // Mặc định vứt lên tầng 1
            }

            // 2. TÍNH TOÀN BỘ TỌA ĐỘ NGANG (X, Z) TRÊN MẶT SÀN
            if (assignedFloor === 0) {
                // ====================================================================
                // GIẢI THUẬT RẢI LƯỚI SONG SONG: Chống tràn thiết bị ra khỏi tầng hầm
                // ====================================================================
                const getBasementGridCoords = (baseX, index) => {
                    const maxRows = 4; // Tối đa 4 thiết bị trên một hàng dọc Z
                    const subCol = Math.floor(index / maxRows); // Tính cột phụ dịch chuyển theo trục X
                    const row = index % maxRows; // Tính hàng theo trục Z

                    return {
                        x: baseX + (subCol * 1.2), // Nếu vượt quá 4 thiết bị, cột phụ tự dịch nhẹ sang phải 1.2 đơn vị
                        z: (row * 2.6) - 3.9       // Tọa độ chạy từ -3.9 đến 3.9 (luôn nằm an toàn trong lòng hầm)
                    };
                };

                let coords;
                if (dev.type === 'COOLINGTOWER') {
                    coords = getBasementGridCoords(-8, count.TOWER++);
                } else if (dev.type === 'COOLINGPUMP') {
                    coords = getBasementGridCoords(-4, count.CPUMP++);
                } else if (dev.type === 'CHILLER') {
                    coords = getBasementGridCoords(0, count.CHILLER++);
                } else if (dev.type === 'COLDPUMP') {
                    coords = getBasementGridCoords(4, count.CHWPUMP++);
                } else {
                    coords = getBasementGridCoords(8, count.VALVE++);
                }

                posX = coords.x;
                posZ = coords.z;
                // ====================================================================

            } else {
                // Các tầng nổi (Đèn, Quạt, AHU...): Rải đều thành lưới tránh đè lên nhau
                const floorKey = String(assignedFloor);
                floorItemCount[floorKey] = (floorItemCount[floorKey] || 0) + 1;
                const order = floorItemCount[floorKey];

                posX = ((order % 4) * 4) - 6; // Xếp dàn ngang
                posZ = (Math.floor(order / 4) * 4) - 2; // Hết 4 cái thì xuống hàng
            }

            // 3. TÍNH CAO ĐỘ (Y) DỰA THEO TẦNG TÌM ĐƯỢC
            let posY = 0;
            if (assignedFloor === 0) posY = -2.5;
            else if (assignedFloor === 'ROOF') posY = (4 * H) + 1.2;
            else posY = ((assignedFloor - 1) * H) + 1.5;

            return { ...dev, assignedFloor, position: [posX, posY, posZ] };
        });
    }, [devices]);

    return (
        /*
         * FIX LỖI BỊ CHE QUAN TRỌNG:
         * Bỏ overflow-hidden ở wrapper ngoài cùng – đây là nguyên nhân chính
         * khiến Html portal bị cắt khi zoom 90%. Thay bằng overflow-visible.
         * Canvas tự clip nội dung 3D, không cần overflow-hidden ở đây.
         */
        <div className="w-full h-[calc(100vh-280px)] min-h-[500px] rounded-[1.8rem] bg-gradient-to-b from-[#0f172a] to-[#020617] border border-slate-800 relative font-sans shadow-2xl flex overflow-visible">

            {/* CỘT TRÁI: CANVAS 3D + PANEL TẦNG */}
            <div className="flex-1 relative rounded-l-[1.8rem] overflow-hidden">

                {/* Panel chọn tầng */}
                <div className="absolute top-5 left-5 z-10 flex flex-col gap-1.5 bg-slate-900/85 backdrop-blur-md p-3 rounded-2xl border border-slate-700/80 shadow-2xl">
                    <div className="text-[10px] font-black text-blue-400 mb-1.5 uppercase tracking-widest text-center border-b border-slate-800 pb-2">
                        LỚP CẮT KHÔNG GIAN
                    </div>
                    <button
                        onClick={() => setActiveFloor(null)}
                        className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${activeFloor === null
                            ? 'bg-blue-600 text-white shadow-[0_0_14px_rgba(37,99,235,0.45)]'
                            : 'text-slate-400 hover:bg-slate-800'
                            }`}
                    >
                        🏢 HIỆN TOÀN CẢNH
                    </button>
                    <div className="flex flex-col-reverse gap-1 mt-1">
                        <button
                            onClick={() => setActiveFloor(0)}
                            className={`px-5 py-1.5 text-[11px] font-bold rounded-lg transition-all ${activeFloor === 0
                                ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            TẦNG HẦM (B1)
                        </button>
                        {[1, 2, 3, 4].map(floor => (
                            <button
                                key={floor}
                                onClick={() => setActiveFloor(floor)}
                                className={`px-5 py-1.5 text-[11px] font-bold rounded-lg transition-all ${activeFloor === floor
                                    ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                TẦNG {floor}
                            </button>
                        ))}
                        <button
                            onClick={() => setActiveFloor('ROOF')}
                            className={`px-5 py-1.5 text-[11px] font-bold rounded-lg transition-all ${activeFloor === 'ROOF'
                                ? 'bg-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            TẦNG MÁI
                        </button>
                    </div>
                </div>

                {/* CANVAS 3D */}
                <Canvas
                    camera={{ position: [32, 22, 40], fov: 42 }}
                    shadows
                    gl={{ antialias: true }}
                >
                    <color attach="background" args={['#020617']} />
                    <fog attach="fog" args={['#020617', 80, 160]} />

                    <ambientLight intensity={0.55} />
                    <directionalLight
                        position={[25, 45, 30]}
                        intensity={1.3}
                        castShadow
                        shadow-mapSize-width={2048}
                        shadow-mapSize-height={2048}
                    />
                    <directionalLight position={[-15, 20, -10]} intensity={0.35} />
                    <hemisphereLight skyColor="#dbeafe" groundColor="#1e293b" intensity={0.4} />

                    <OrbitControls makeDefault maxPolarAngle={Math.PI / 2 - 0.04} />

                    {/* Nhóm tòa nhà – dịch xuống để căn giữa màn hình */}
                    <group position={[0, -6, 0]}>
                        {/* Nền đất (chỉ hiện khi xem toàn cảnh) */}
                        {activeFloor === null && <Environment />}

                        <FloorLevel level={0} activeFloor={activeFloor} />
                        <FloorLevel level={1} activeFloor={activeFloor} />
                        <FloorLevel level={2} activeFloor={activeFloor} />
                        <FloorLevel level={3} activeFloor={activeFloor} />
                        <FloorLevel level={4} activeFloor={activeFloor} />
                        <RoofLevel activeFloor={activeFloor} maxLevel={4} />

                        {mappedDevices.map(dev => {
                            if (activeFloor !== null && dev.assignedFloor !== activeFloor) return null;
                            return (
                                <DeviceMarker
                                    key={dev.id}
                                    device={dev}
                                    position={dev.position}
                                    onClick={(d) => setSelectedDevice(d)}
                                />
                            );
                        })}
                    </group>
                </Canvas>
            </div>

            {/* CỘT PHẢI: SIDEBAR CHI TIẾT THIẾT BỊ */}
            {selectedDevice && (
                <div className="w-80 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 p-6 flex flex-col relative z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] overflow-y-auto custom-scrollbar rounded-r-[1.8rem]">

                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">
                                {selectedDevice.name || selectedDevice.type}
                            </h3>
                            <p className="text-[10px] text-blue-400 font-mono mt-1">ID: {selectedDevice.code}</p>
                        </div>
                        <button
                            onClick={() => setSelectedDevice(null)}
                            className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Badge trạng thái */}
                    <div className={`p-3 rounded-xl mb-6 border flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest shrink-0 ${selectedDevice.latest_state?.fault === 1
                        ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        }`}>
                        {selectedDevice.latest_state?.fault === 1 ? <AlertTriangle size={16} /> : <Activity size={16} />}
                        {selectedDevice.latest_state?.fault === 1 ? 'THIẾT BỊ LỖI' : 'HOẠT ĐỘNG TỐT'}
                    </div>

                    {/* Bảng dữ liệu real-time */}
                    <div className="flex-1 bg-slate-950/50 rounded-2xl border border-slate-800 p-4">
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest border-b border-slate-800 pb-2 mb-2 flex items-center justify-between">
                            Thông số Real-time
                            <span className="flex items-center gap-1.5 text-emerald-500">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> Live
                            </span>
                        </div>
                        <div className="space-y-1">
                            {(selectedDevice.latest_state?.power !== undefined || selectedDevice.latest_state?.state !== undefined) && (
                                <DataRow
                                    icon={Power} label="Trạng thái"
                                    value={(selectedDevice.latest_state?.power === 1 || selectedDevice.latest_state?.state === 1) ? 'ON' : 'OFF'}
                                    colorClass={(selectedDevice.latest_state?.power === 1 || selectedDevice.latest_state?.state === 1) ? 'text-emerald-400' : 'text-slate-500'}
                                />
                            )}
                            {(selectedDevice.latest_state?.['auto-mode'] !== undefined || selectedDevice.latest_state?.mode !== undefined || selectedDevice.latest_state?.auto_mode !== undefined) && (
                                <DataRow
                                    icon={Settings2} label="Chế độ (Mode)"
                                    value={(selectedDevice.latest_state?.['auto-mode'] === 1 || selectedDevice.latest_state?.auto_mode === 1 || selectedDevice.latest_state?.mode === 'AUTO') ? 'AUTO' : 'MAN'}
                                    colorClass="text-blue-400"
                                />
                            )}
                            {selectedDevice.type === 'PIPE' && (
                                <>
                                    <DataRow icon={Activity} label="Dòng chảy" value={selectedDevice.latest_state?.flow_status === 1 ? 'CÓ' : 'KHÔNG'} colorClass="text-emerald-400" />
                                    <DataRow icon={Thermometer} label="Nhiệt độ nước" value={`${selectedDevice.latest_state?.temperature || '--'} °C`} colorClass="text-orange-400" />
                                    <DataRow icon={Droplets} label="Lưu lượng" value={`${selectedDevice.latest_state?.flow_rate || '--'} m³/h`} colorClass="text-cyan-400" />
                                    <DataRow icon={Gauge} label="Áp suất ống" value={`${selectedDevice.latest_state?.pressure || '--'} bar`} colorClass="text-sky-400" />
                                </>
                            )}
                            {selectedDevice.type.includes('PUMP') && (
                                <DataRow icon={Zap} label="Tần số Biến tần" value={`${selectedDevice.latest_state?.speed || 0} Hz`} colorClass="text-amber-400" />
                            )}
                            {(selectedDevice.type === 'FAN' || selectedDevice.type === 'AHU') && (
                                <>
                                    {selectedDevice.type === 'AHU' && <DataRow icon={Thermometer} label="Nhiệt độ phòng" value={`${selectedDevice.latest_state?.temperature || '--'} °C`} colorClass="text-orange-400" />}
                                    {selectedDevice.type === 'FAN' && <DataRow icon={Thermometer} label="Nhiệt độ khí" value={`${selectedDevice.latest_state?.air_temperature || '--'} °C`} colorClass="text-orange-400" />}
                                    {selectedDevice.type === 'FAN' && <DataRow icon={Gauge} label="Áp suất gió" value={`${selectedDevice.latest_state?.air_pressure || '--'} Pa`} colorClass="text-sky-400" />}
                                    <DataRow icon={Wind} label="Tốc độ quạt"
                                        value={`${selectedDevice.latest_state?.fan_speed || selectedDevice.latest_state?.frequency || 0} ${selectedDevice.type === 'AHU' ? 'Hz' : '%'}`}
                                        colorClass="text-indigo-400"
                                    />
                                </>
                            )}
                            {selectedDevice.type === 'LIGHT_DIMMER' && (
                                <DataRow icon={Lightbulb} label="Cường độ sáng" value={`${selectedDevice.latest_state?.brightness || 0} %`} colorClass="text-yellow-400" />
                            )}
                        </div>
                    </div>

                    <div className="mt-4 text-[10px] text-center text-slate-500 font-mono shrink-0">
                        Cập nhật lần cuối: {new Date(selectedDevice.last_updated).toLocaleTimeString('vi-VN')}
                    </div>
                </div>
            )}
        </div>
    );
}