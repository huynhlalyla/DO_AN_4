export const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

export const formatDateTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export const combineDateAndTime = (date, timeStr) => {
    if (!date) return null;
    const d = new Date(date);
    if (!timeStr) return d;
    
    try {
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
            d.setHours(hours, minutes, 0, 0);
        }
    } catch (e) {
        console.error('Error parsing time:', e);
    }
    return d;
};

export const isEventOpen = (startDate, endDate) => {
    if (!startDate) return false;
    const now = new Date();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(startDate);
    return now >= start && now <= end;
};

export const isEventUpcoming = (startDate) => {
    if (!startDate) return false;
    const now = new Date();
    const start = new Date(startDate);
    return now < start;
};

export const isEventEnded = (endDate) => {
    if (!endDate) return false;
    const now = new Date();
    const end = new Date(endDate);
    return now > end;
};
