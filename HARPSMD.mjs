export const loadBaileys = async () => {
    const baileys = await import('@vinzsocket/baileys');
    
    return {
        ...baileys,
        makeWASocket: baileys.default || baileys.makeWASocket
    };
};
