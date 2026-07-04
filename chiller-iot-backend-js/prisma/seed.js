import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log("📥 [SEED] Đang khởi chạy kịch bản nạp dữ liệu thử nghiệm...");

    const passwordHash = await bcrypt.hash("Dai123", 10);

    // ==========================================================
    // DỌN DẸP DỮ LIỆU CŨ (Để tránh xung đột nếu chạy lại nhiều lần)
    // ==========================================================
    const oldBuildings = await prisma.building.findMany({
        where: { code: { in: ["KEANGNAM_HN", "LOTTE_HN"] } }
    });
    const oldBuildingIds = oldBuildings.map(b => b.id);

    const oldAdmins = await prisma.user.findMany({
        where: { username: { in: ["keangnam_admin", "lotte_admin"] } }
    });
    const oldAdminIds = oldAdmins.map(u => u.id);

    // Thực thi xóa sạch dây chuyền bảo vệ khóa ngoại tránh lỗi P2003
    await prisma.controlLog.deleteMany({ where: { user_id: { in: oldAdminIds } } });
    await prisma.userBuilding.deleteMany({ where: { buildingId: { in: oldBuildingIds } } });
    await prisma.user.deleteMany({ where: { id: { in: oldAdminIds } } });
    await prisma.device.deleteMany({ where: { buildingId: { in: oldBuildingIds } } });
    await prisma.subsystem.deleteMany({ where: { buildingId: { in: oldBuildingIds } } });
    await prisma.building.deleteMany({ where: { id: { in: oldBuildingIds } } });

    console.log("🗑️ [SEED] Đã dọn dẹp dữ liệu thử nghiệm cũ.");

    // ==========================================================
    // KỊCH BẢN 1: KHỞI TẠO TÒA NHÀ 2 - KEANGNAM LANDMARK TOWER (Mã: KEANGNAM_HN)
    // ==========================================================
    const knBuilding = await prisma.building.create({
        data: {
            code: "KEANGNAM_HN",
            name: "Keangnam Landmark Tower",
            address: "Phạm Hùng, Nam Từ Liêm, Hà Nội"
        }
    });

    // Tạo 4 Phân hệ cho Keangnam
    const knChillerSub = await prisma.subsystem.create({ data: { buildingId: knBuilding.id, code: "CHILLER_PLANT", name: "Hệ thống Chiller" } });
    const knLightSub = await prisma.subsystem.create({ data: { buildingId: knBuilding.id, code: "LIGHTING_SYSTEM", name: "Hệ thống Chiếu sáng" } });
    const knFanSub = await prisma.subsystem.create({ data: { buildingId: knBuilding.id, code: "FAN_SYSTEM", name: "Hệ thống Thông gió" } });
    const knPumpSub = await prisma.subsystem.create({ data: { buildingId: knBuilding.id, code: "DOMESTIC_PUMP_SYSTEM", name: "Hệ thống Bơm sinh hoạt" } });

    // Tạo 16 thiết bị mang tiền tố KN_ (Khớp hoàn toàn với firmware ESP32)
    await prisma.device.createMany({
        data: [
            // Cụm Chiller (10 thiết bị)
            { buildingId: knBuilding.id, subsystemId: knChillerSub.id, code: "KN_chiller-001", name: "Máy làm lạnh Chiller", type: "CHILLER", location: "Tầng hầm" },
            { buildingId: knBuilding.id, subsystemId: knChillerSub.id, code: "KN_PIPE-001", name: "Cảm biến ống nước lạnh", type: "PIPE", location: "Tầng hầm" },
            { buildingId: knBuilding.id, subsystemId: knChillerSub.id, code: "KN_VALVE-001", name: "Van cách ly Chiller", type: "VALVE", location: "Tầng hầm" },
            { buildingId: knBuilding.id, subsystemId: knChillerSub.id, code: "KN_COLDPUMP-001", name: "Bơm nước lạnh", type: "COLDPUMP", location: "Tầng hầm" },
            { buildingId: knBuilding.id, subsystemId: knChillerSub.id, code: "KN_COOLINGPUMP-001", name: "Bơm giải nhiệt Chiller", type: "COOLINGPUMP", location: "Tầng hầm" },
            { buildingId: knBuilding.id, subsystemId: knChillerSub.id, code: "KN_COOLINGTOWER-001", name: "Tháp giải nhiệt Chiller", type: "COOLINGTOWER", location: "Tầng hầm" },
            { buildingId: knBuilding.id, subsystemId: knChillerSub.id, code: "KN_AHU-T1", name: "Bộ xử lý khí AHU T1", type: "AHU", location: "Tầng 1" },
            { buildingId: knBuilding.id, subsystemId: knChillerSub.id, code: "KN_AHU-T2", name: "Bộ xử lý khí AHU T2", type: "AHU", location: "Tầng 2" },
            { buildingId: knBuilding.id, subsystemId: knChillerSub.id, code: "KN_AHU-T3", name: "Bộ xử lý khí AHU T3", type: "AHU", location: "Tầng 3" },
            { buildingId: knBuilding.id, subsystemId: knChillerSub.id, code: "KN_AHU-T4", name: "Bộ xử lý khí AHU T4", type: "AHU", location: "Tầng 4" },

            // Cụm Chiếu sáng (6 thiết bị)
            { buildingId: knBuilding.id, subsystemId: knLightSub.id, code: "KN_LIGHT_T1", name: "Đèn hành lang T1", type: "LIGHT", location: "Tầng 1" },
            { buildingId: knBuilding.id, subsystemId: knLightSub.id, code: "KN_LIGHT_T2", name: "Đèn hành lang T2", type: "LIGHT", location: "Tầng 2" },
            { buildingId: knBuilding.id, subsystemId: knLightSub.id, code: "KN_LIGHT_T3", name: "Đèn sảnh T3", type: "LIGHT", location: "Tầng 3" },
            { buildingId: knBuilding.id, subsystemId: knLightSub.id, code: "KN_LIGHT_T4", name: "Đèn sảnh T4", type: "LIGHT", location: "Tầng 4" },
            { buildingId: knBuilding.id, subsystemId: knLightSub.id, code: "KN_DIMMER_SANH", name: "Đèn Dimmer Sảnh chính", type: "LIGHT_DIMMER", location: "Tầng 1" },
            { buildingId: knBuilding.id, subsystemId: knLightSub.id, code: "KN_DIMMER_HOP", name: "Đèn Dimmer Phòng họp", type: "LIGHT_DIMMER", location: "Tầng 2" },

            // Bơm sinh hoạt (2 thiết bị)
            { buildingId: knBuilding.id, subsystemId: knPumpSub.id, code: "KN_PUMP_01", name: "Bơm sinh hoạt B1", type: "DOMESTIC_PUMP", location: "Tầng hầm" },
            { buildingId: knBuilding.id, subsystemId: knPumpSub.id, code: "KN_PUMP_02", name: "Bơm sinh hoạt áp mái", type: "DOMESTIC_PUMP", location: "Tầng thượng" },

            // Quạt thông gió (2 thiết bị)
            { buildingId: knBuilding.id, subsystemId: knFanSub.id, code: "KN_FAN_T1", name: "Quạt thông gió sảnh T1", type: "FAN", location: "Tầng 1" },
            { buildingId: knBuilding.id, subsystemId: knFanSub.id, code: "KN_FAN_T2", name: "Quạt thông gió sảnh T2", type: "FAN", location: "Tầng 2" }
        ]
    });

    // Tạo tài khoản Admin cho Keangnam
    const knUser = await prisma.user.create({
        data: {
            username: "keangnam_admin",
            password: passwordHash,
            fullName: "Quản lý Keangnam",
            role: "BUILDING_ADMIN",
            email: "keangnam@bms.com",
            status: "APPROVED"
        }
    });
    await prisma.userBuilding.create({ data: { userId: knUser.id, buildingId: knBuilding.id } });

    console.log("🏢 [SEED] Khởi tạo thành công Tòa nhà Keangnam & Tài khoản: keangnam_admin");


    // ==========================================================
    // KỊCH BẢN 2: KHỞI TẠO TÒA NHÀ 3 - LOTTE CENTER HANOI (Mã: LOTTE_HN)
    // ==========================================================
    const ltBuilding = await prisma.building.create({
        data: {
            code: "LOTTE_HN",
            name: "Lotte Center Hanoi",
            address: "Liễu Giai, Ba Đình, Hà Nội"
        }
    });

    // Tạo 4 Phân hệ cho Lotte
    const ltChillerSub = await prisma.subsystem.create({ data: { buildingId: ltBuilding.id, code: "CHILLER_PLANT", name: "Hệ thống Chiller" } });
    const ltLightSub = await prisma.subsystem.create({ data: { buildingId: ltBuilding.id, code: "LIGHTING_SYSTEM", name: "Hệ thống Chiếu sáng" } });
    const ltFanSub = await prisma.subsystem.create({ data: { buildingId: ltBuilding.id, code: "FAN_SYSTEM", name: "Hệ thống Thông gió" } });
    const ltPumpSub = await prisma.subsystem.create({ data: { buildingId: ltBuilding.id, code: "DOMESTIC_PUMP_SYSTEM", name: "Hệ thống Bơm sinh hoạt" } });

    // Tạo 16 thiết bị mang tiền tố LT_ (Khớp hoàn toàn với firmware ESP32)
    await prisma.device.createMany({
        data: [
            // Cụm Chiller (10 thiết bị)
            { buildingId: ltBuilding.id, subsystemId: ltChillerSub.id, code: "LT_chiller-001", name: "Máy làm lạnh Chiller", type: "CHILLER", location: "Tầng hầm" },
            { buildingId: ltBuilding.id, subsystemId: ltChillerSub.id, code: "LT_PIPE-001", name: "Cảm biến ống nước lạnh", type: "PIPE", location: "Tầng hầm" },
            { buildingId: ltBuilding.id, subsystemId: ltChillerSub.id, code: "LT_VALVE-001", name: "Van cách ly Chiller", type: "VALVE", location: "Tầng hầm" },
            { buildingId: ltBuilding.id, subsystemId: ltChillerSub.id, code: "LT_COLDPUMP-001", name: "Bơm nước lạnh", type: "COLDPUMP", location: "Tầng hầm" },
            { buildingId: ltBuilding.id, subsystemId: ltChillerSub.id, code: "LT_COOLINGPUMP-001", name: "Bơm giải nhiệt Chiller", type: "COOLINGPUMP", location: "Tầng hầm" },
            { buildingId: ltBuilding.id, subsystemId: ltChillerSub.id, code: "LT_COOLINGTOWER-001", name: "Tháp giải nhiệt Chiller", type: "COOLINGTOWER", location: "Tầng hầm" },
            { buildingId: ltBuilding.id, subsystemId: ltChillerSub.id, code: "LT_AHU-T1", name: "Bộ xử lý khí AHU T1", type: "AHU", location: "Tầng 1" },
            { buildingId: ltBuilding.id, subsystemId: ltChillerSub.id, code: "LT_AHU-T2", name: "Bộ xử lý khí AHU T2", type: "AHU", location: "Tầng 2" },
            { buildingId: ltBuilding.id, subsystemId: ltChillerSub.id, code: "LT_AHU-T3", name: "Bộ xử lý khí AHU T3", type: "AHU", location: "Tầng 3" },
            { buildingId: ltBuilding.id, subsystemId: ltChillerSub.id, code: "LT_AHU-T4", name: "Bộ xử lý khí AHU T4", type: "AHU", location: "Tầng 4" },

            // Cụm Chiếu sáng (6 thiết bị)
            { buildingId: ltBuilding.id, subsystemId: ltLightSub.id, code: "LT_LIGHT_T1", name: "Đèn hành lang T1", type: "LIGHT", location: "Tầng 1" },
            { buildingId: ltBuilding.id, subsystemId: ltLightSub.id, code: "LT_LIGHT_T2", name: "Đèn hành lang T2", type: "LIGHT", location: "Tầng 2" },
            { buildingId: ltBuilding.id, subsystemId: ltLightSub.id, code: "LT_LIGHT_T3", name: "Đèn sảnh T3", type: "LIGHT", location: "Tầng 3" },
            { buildingId: ltBuilding.id, subsystemId: ltLightSub.id, code: "LT_LIGHT_T4", name: "Đèn sảnh T4", type: "LIGHT", location: "Tầng 4" },
            { buildingId: ltBuilding.id, subsystemId: ltLightSub.id, code: "LT_DIMMER_SANH", name: "Đèn Dimmer Sảnh chính", type: "LIGHT_DIMMER", location: "Tầng 1" },
            { buildingId: ltBuilding.id, subsystemId: ltLightSub.id, code: "LT_DIMMER_HOP", name: "Đèn Dimmer Phòng họp", type: "LIGHT_DIMMER", location: "Tầng 2" },

            // Bơm sinh hoạt (2 thiết bị)
            { buildingId: ltBuilding.id, subsystemId: ltPumpSub.id, code: "LT_PUMP_01", name: "Bơm sinh hoạt B1", type: "DOMESTIC_PUMP", location: "Tầng hầm" },
            { buildingId: ltBuilding.id, subsystemId: ltPumpSub.id, code: "LT_PUMP_02", name: "Bơm sinh hoạt áp mái", type: "DOMESTIC_PUMP", location: "Tầng thượng" },

            // Quạt thông gió (2 thiết bị)
            { buildingId: ltBuilding.id, subsystemId: ltFanSub.id, code: "LT_FAN_T1", name: "Quạt thông gió sảnh T1", type: "FAN", location: "Tầng 1" },
            { buildingId: ltBuilding.id, subsystemId: ltFanSub.id, code: "LT_FAN_T2", name: "Quạt thông gió sảnh T2", type: "FAN", location: "Tầng 2" }
        ]
    });

    // Tạo tài khoản Admin cho Lotte Center
    const ltUser = await prisma.user.create({
        data: {
            username: "lotte_admin",
            password: passwordHash,
            fullName: "Quản lý Lotte Center",
            role: "BUILDING_ADMIN",
            email: "lotte@bms.com",
            status: "APPROVED"
        }
    });
    await prisma.userBuilding.create({ data: { userId: ltUser.id, buildingId: ltBuilding.id } });

    console.log("🏢 [SEED] Khởi tạo thành công Tòa nhà Lotte Center & Tài khoản: lotte_admin");
    console.log("🎉 [SEED] Quy trình nạp cơ sở dữ liệu hoàn tất thành công!");
}

main()
    .catch((e) => {
        console.error("❌ [SEED] Gặp lỗi nghiêm trọng khi nạp dữ liệu:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });