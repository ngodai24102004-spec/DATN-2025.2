import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        // Admin tòa nhà sẽ join vào "phòng" riêng của tòa nhà đó
        socket.on("join-building", (buildingId) => {
            socket.join(`building-${buildingId}`);
            console.log(`🏠 Client ${socket.id} joined building room: ${buildingId}`);
        });

        socket.on("join-super-admin", () => {
            socket.join("super_admin_room");
            console.log(`👑 Super Admin ${socket.id} joined global room!`);
        });

        socket.on("disconnect", () => {
            console.log("❌ Client disconnected");
        });
    });

    return io;
};

export const getIo = () => {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
};