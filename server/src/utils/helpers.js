/**
 * Chuyển đổi chuỗi có dấu thành không dấu
 * @param {string} str - Chuỗi cần chuyển đổi
 * @param {boolean} removeSpaces - Có xóa khoảng trắng không (mặc định: true)
 * @returns {string} - Chuỗi không dấu
 */
export const removeVietnameseTones = (str, removeSpaces = true) => {
    if (!str) return '';
    
    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
    str = str.replace(/đ/g, 'd');
    
    if (removeSpaces) {
        str = str.replace(/\s+/g, '');
    }
    
    return str;
};

/**
 * Tạo email từ họ, tên và mã sinh viên
 * Format: Chữ cái đầu của từng từ trong họ + tên + mssv (viết thường không dấu)
 * Ví dụ: Trần Bình An + CNTT2211036 = tbacntt2211036@example.com
 * 
 * @param {string} lastName - Họ
 * @param {string} firstName - Tên
 * @param {string} studentCode - Mã sinh viên
 * @param {string} domain - Domain email (mặc định: example.com)
 * @returns {string} - Email
 */
export const generateEmail = (lastName, firstName, studentCode, header='actiessystem', domain = '@gmail.com') => {
    if (!lastName || !firstName || !studentCode) {
        throw new Error('Thiếu thông tin để tạo email');
    }

    // Loại bỏ dấu NHƯNG GIỮ khoảng trắng để tách từ
    const cleanLastName = removeVietnameseTones(lastName.trim(), false);
    const cleanFirstName = removeVietnameseTones(firstName.trim(), false);
    const cleanStudentCode = studentCode.trim().toLowerCase();

    // Tách từng từ trong họ và lấy chữ cái đầu
    const lastNameWords = cleanLastName.split(/\s+/).filter(word => word.length > 0);
    const lastNameInitials = lastNameWords.map(word => word.charAt(0)).join('');

    // Biến tên thành chữ thường không dấu và loại bỏ khoảng trắng
    const firstNameClean = cleanFirstName.toLowerCase().replace(/\s+/g, '');

    // Kết hợp: chữ cái đầu họ + chữ cái đầu tên + mssv
    const emailPrefix = `${lastNameInitials}${firstNameClean}${cleanStudentCode}`;

    return `${header}+${emailPrefix}${domain}`;
};

/**
 * Parse ngày sinh từ format dd/mm/yyyy sang Date object
 * @param {string} dateString - Ngày sinh định dạng dd/mm/yyyy
 * @returns {Date} - Date object
 */
export const parseVietnameseDate = (dateString) => {
    if (!dateString) return null;
    
    const parts = dateString.split('/');
    if (parts.length !== 3) {
        throw new Error('Định dạng ngày không hợp lệ. Sử dụng dd/mm/yyyy');
    }
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Tháng trong JS bắt đầu từ 0
    const year = parseInt(parts[2], 10);
    
    return new Date(year, month, day);
};

/**
 * Format Date object sang dd/mm/yyyy
 * @param {Date} date - Date object
 * @returns {string} - Ngày định dạng dd/mm/yyyy
 */
export const formatVietnameseDate = (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
};
