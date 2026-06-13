import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendApprovalEmail = async (toEmail, isApproved, username) => {
    const subject = isApproved ? "✅ Tài khoản BMS đã được phê duyệt" : "❌ Yêu cầu cấp tài khoản bị từ chối";
    const text = isApproved
        ? `Chào ${username},\nTài khoản của bạn đã được Super Admin phê duyệt. Bạn có thể đăng nhập vào hệ thống ngay bây giờ.`
        : `Chào ${username},\nYêu cầu cấp tài khoản của bạn đã bị từ chối bởi Super Admin. Vui lòng liên hệ quản lý để biết thêm chi tiết.`;

    try {
        await transporter.sendMail({ from: '"Hệ thống BMS" <no-reply@bms.com>', to: toEmail, subject, text });
        console.log(`📧 Đã gửi email tới ${toEmail}`);
    } catch (error) {
        console.error("Lỗi gửi email:", error);
    }
};