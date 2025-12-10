import nodemailer from 'nodemailer';

// Cấu hình transporter (sử dụng Gmail)
// Trong production nên dùng biến môi trường
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'actiessystem@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'cwvz eblm ukdh svmm' // App password của Gmail
    }
});

/**
 * Gửi OTP qua email
 * @param {string} to - Email người nhận
 * @param {string} otpCode - Mã OTP
 * @param {string} purpose - Mục đích: 'first-login' hoặc 'reset-password'
 */
export const sendOTP = async (to, otpCode, purpose = 'first-login') => {
    try {
        const subject = purpose === 'first-login' 
            ? 'Mã OTP đăng nhập lần đầu - Hệ thống Điểm rèn luyện'
            : 'Mã OTP khôi phục mật khẩu - Hệ thống Điểm rèn luyện';

        const message = purpose === 'first-login'
            ? `
                <h2>Chào mừng bạn đến với Hệ thống Điểm rèn luyện!</h2>
                <p>Đây là lần đầu tiên bạn đăng nhập vào hệ thống.</p>
                <p>Vui lòng sử dụng mã OTP dưới đây để đặt mật khẩu:</p>
                <h1 style="color: #2563eb; font-size: 32px; letter-spacing: 5px;">${otpCode}</h1>
                <p><strong>Lưu ý:</strong> Mã OTP có hiệu lực trong 10 phút.</p>
                <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</p>
            `
            : `
                <h2>Yêu cầu khôi phục mật khẩu</h2>
                <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn.</p>
                <p>Vui lòng sử dụng mã OTP dưới đây để đặt mật khẩu mới:</p>
                <h1 style="color: #2563eb; font-size: 32px; letter-spacing: 5px;">${otpCode}</h1>
                <p><strong>Lưu ý:</strong> Mã OTP có hiệu lực trong 10 phút.</p>
                <p>Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.</p>
            `;

        const mailOptions = {
            from: process.env.EMAIL_USER || 'Hệ thống Điểm rèn luyện',
            to: to,
            subject: subject,
            html: message
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Không thể gửi email. Vui lòng thử lại sau.');
    }
};

/**
 * Gửi email thông báo hủy sự kiện
 * @param {Array} emails - Danh sách email người nhận
 * @param {Object} event - Thông tin sự kiện
 * @param {string} reason - Lý do hủy
 */
export const sendEventCancellationEmail = async (emails, event, reason) => {
    try {
        if (!emails || emails.length === 0) return { success: true, message: 'No recipients' };

        const subject = `[QUAN TRỌNG] Thông báo HỦY sự kiện: ${event.eventName}`;
        const message = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #d32f2f; margin: 0;">THÔNG BÁO HỦY SỰ KIỆN</h2>
                </div>
                
                <p>Xin chào,</p>
                
                <p>Ban tổ chức xin trân trọng thông báo về việc hủy sự kiện sau:</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0;">
                    <p style="margin: 5px 0;"><strong>Sự kiện:</strong> ${event.eventName}</p>
                    <p style="margin: 5px 0;"><strong>Thời gian dự kiến:</strong> ${new Date(event.eventDate).toLocaleDateString('vi-VN')}</p>
                    <p style="margin: 5px 0;"><strong>Địa điểm:</strong> ${event.location || 'Chưa xác định'}</p>
                </div>

                <p><strong>Lý do hủy:</strong> ${reason || 'Do thay đổi kế hoạch tổ chức từ phía Ban tổ chức.'}</p>
                
                <p>Chúng tôi thành thật xin lỗi vì sự bất tiện này và mong nhận được sự thông cảm của bạn.</p>
                
                <p>Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với Ban tổ chức hoặc Văn phòng Khoa/Trường.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
                    <p>Trân trọng,<br>Hệ thống Quản lý Điểm rèn luyện</p>
                </div>
            </div>
        `;

        const mailOptions = {
            from: process.env.EMAIL_USER || 'Hệ thống Điểm rèn luyện',
            to: emails, // Nodemailer supports array of strings
            subject: subject,
            html: message
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Cancellation emails sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending cancellation email:', error);
        // Don't throw error to prevent blocking the cancellation process
        return { success: false, error: error.message };
    }
};

/**
 * Gửi email nhắc nhở sự kiện
 * @param {Array} emails - Danh sách email người nhận
 * @param {Object} event - Thông tin sự kiện
 */
export const sendReminderEmail = async (emails, event) => {
    try {
        if (!emails || emails.length === 0) return { success: true, message: 'No recipients' };

        const subject = `Nhắc nhở: Sự kiện ${event.eventName} sẽ diễn ra vào ngày mai`;
        const message = `
            <h2>Nhắc nhở tham gia sự kiện</h2>
            <p>Xin chào,</p>
            <p>Đây là email nhắc nhở bạn về sự kiện <strong>${event.eventName}</strong> mà bạn đã đăng ký.</p>
            <p><strong>Thời gian:</strong> ${new Date(event.eventDate).toLocaleDateString('vi-VN')} ${event.startTime ? '- ' + event.startTime : ''}</p>
            <p><strong>Địa điểm:</strong> ${event.location || 'Chưa cập nhật'}</p>
            <p>Vui lòng đến đúng giờ để tham gia và điểm danh.</p>
            <p>Chúc bạn có một trải nghiệm tuyệt vời!</p>
            <p>Trân trọng,<br>Ban tổ chức sự kiện</p>
        `;

        const mailOptions = {
            from: process.env.EMAIL_USER || 'Hệ thống Điểm rèn luyện',
            bcc: emails, // Use BCC to hide recipients from each other
            subject: subject,
            html: message
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Reminder emails sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending reminder email:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Gửi email chung
 * @param {string} to - Email người nhận
 * @param {string} subject - Tiêu đề
 * @param {string} htmlContent - Nội dung HTML
 */
export const sendEmail = async (to, subject, htmlContent) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER || 'Hệ thống Điểm rèn luyện',
            to: to,
            subject: subject,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Tạo mã OTP ngẫu nhiên 6 chữ số
 */
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export default {
    sendOTP,
    sendEventCancellationEmail,
    sendReminderEmail,
    sendEmail,
    generateOTP
};
