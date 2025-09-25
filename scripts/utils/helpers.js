export const helpers = {
    formatNumber: (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    
    calculateDistance: (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    },
    
    lerp: (start, end, factor) => {
        return start + (end - start) * factor;
    },
    
    easeOutCubic: (t) => {
        return 1 - Math.pow(1 - t, 3);
    },
    
    clamp: (value, min, max) => {
        return Math.min(Math.max(value, min), max);
    }
};