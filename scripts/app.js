import { AsteroidImpactSimulator } from './simulator/AsteroidImpactSimulator.js';

document.addEventListener('DOMContentLoaded', () => {
    
    const splashScreen = document.getElementById('splash-screen');
    const mainContent = document.getElementById('main-content');
    
    const totalAnimationDuration = 4000; 

    new AsteroidImpactSimulator();
    
    setTimeout(() => {
        splashScreen.classList.add('hidden');
        
        mainContent.classList.remove('hidden');
    }, totalAnimationDuration);
});
