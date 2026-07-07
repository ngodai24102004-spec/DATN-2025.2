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
        await transporter.sendMail({ from: '"Hệ thống BMS" <${process.env.EMAIL_USER}>', to: toEmail, subject, text });
        console.log(`📧 Đã gửi email tới ${toEmail}`);
    } catch (error) {
        console.error("Lỗi gửi email:", error);
    }
};

export const sendCredentialsEmail = async (toEmail, username, plainPassword, fullName, buildingName) => {
    const subject = "🔑 Tài khoản quản trị viên BMS của bạn đã được kích hoạt!";
    const text = `Chào ${fullName},\n\nTài khoản Quản lý tòa nhà của bạn tại cơ sở [${buildingName}] đã được khởi tạo thành công trên hệ thống BMS.\n\nThông tin đăng nhập của bạn:\n- Tên đăng nhập: ${username}\n- Mật khẩu: ${plainPassword}\n\nVui lòng truy cập hệ thống tại http://localhost:5173 để đăng nhập và đổi mật khẩu cá nhân.\n\nTrân trọng,\nHệ thống BMS.`;

    try {
        await transporter.sendMail({ from: '"Hệ thống BMS" <${process.env.EMAIL_USER}>', to: toEmail, subject, text });
        console.log(`📧 Đã gửi thông tin tài khoản tới email ${toEmail}`);
    } catch (error) {
        console.error("Lỗi gửi email cấp tài khoản:", error);
    }
};

export const sendOtpEmail = async (toEmail, otp) => {
    const subject = "🔐 Mã OTP xác minh tài khoản BMS của bạn";
    const text = `Chào bạn,\n\nMã OTP để xác minh yêu cầu đăng ký tài khoản BMS của bạn là: ${otp}\n\nMã này có hiệu lực trong vòng 60 giây. Vui lòng tuyệt đối không chia sẻ mã này với bất kỳ ai.\n\nTrân trọng,\nHệ thống BMS.`;

    try {
        await transporter.sendMail({ from: '"Hệ thống BMS" <${process.env.EMAIL_USER}>', to: toEmail, subject, text });
        console.log(`📧 Đã gửi mã OTP tới email ${toEmail}`);
    } catch (error) {
        console.error("Lỗi gửi email OTP:", error);
    }
};