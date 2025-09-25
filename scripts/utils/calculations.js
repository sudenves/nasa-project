export const calculations = {
    calculateImpactEnergy: (diameter, velocity) => {
        const radius = diameter / 2;
        const volume = (4/3) * Math.PI * Math.pow(radius, 3);
        const mass = volume * 3000; 
        const velocityMS = velocity * 1000;
        return 0.5 * mass * Math.pow(velocityMS, 2);
    },
    
    energyToMegatons: (energy) => {
        return energy / 4.184e15; 
    },
    
    calculateCraterDiameter: (megatons) => {
        return 0.001 * (1.16 * Math.pow(megatons, 1/3.4) * 1000);
    },
    
    calculateBlastRadius: (energy) => {
        return 1.5 * Math.pow(energy / 4.184e12, 1/3);
    },
    
    calculateThermalRadius: (megatons) => {
        if (megatons * 4.184e15 > 1e12) {
            return Math.sqrt((megatons * 0.35 * 1e12) / (4 * Math.PI * 10)) / 1000;
        }
        return 0;
    },
    
    getTsunamiWarning: (megatons, isWaterImpact) => {
        if (!isWaterImpact) return 'Land impact - no tsunami risk';
        
        if (megatons > 500) return 'WARNING: Devastating mega-tsunami likely';
        if (megatons > 50) return 'WARNING: Regional tsunami expected';
        if (megatons > 1) return 'Localized tsunami possible';
        return 'Minimal tsunami risk';
    }
};