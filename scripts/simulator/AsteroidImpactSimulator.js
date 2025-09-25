import { UIController } from './UIController.js';
import { MapController } from './MapController.js';
import { ThreeDController } from './ThreeDController.js';
import { calculations } from '../utils/calculations.js';

export class AsteroidImpactSimulator {
    constructor() {
        this.state = {
            diameter: 100,
            velocity: 20,
            deltaV: 0,
            isWaterImpact: false,
            impactPoint: null
        };
        
        this.uiController = new UIController(this);
        this.mapController = new MapController(this);
        this.threeDController = new ThreeDController(this);
        
        this.initialize();
    }
    
    initialize() {
        this.uiController.initialize();
        this.mapController.initialize();
        this.threeDController.initialize();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        const elements = this.uiController.getElements();
        
        elements.diameterSlider.addEventListener('input', (e) => {
            this.state.diameter = parseInt(e.target.value);
            this.uiController.updateDisplay('diameter', this.state.diameter);
            this.uiController.updateSliderProgress(e.target);
            this.threeDController.updateAsteroidSize();
        });
        
        elements.velocitySlider.addEventListener('input', (e) => {
            this.state.velocity = parseInt(e.target.value);
            this.uiController.updateDisplay('velocity', this.state.velocity);
            this.uiController.updateSliderProgress(e.target);
        });
        
        elements.deltaVSlider.addEventListener('input', (e) => {
            this.state.deltaV = parseFloat(e.target.value);
            this.uiController.updateDisplay('deltaV', this.state.deltaV);
            this.uiController.updateSliderProgress(e.target);
        });
        
        elements.landBtn.addEventListener('click', () => {
            this.state.isWaterImpact = false;
            this.uiController.updateButtonStates();
        });
        
        elements.waterBtn.addEventListener('click', () => {
            this.state.isWaterImpact = true;
            this.uiController.updateButtonStates();
        });
        
        elements.simulateBtn.addEventListener('click', () => {
            this.runSimulation();
        });
    }
    
    runSimulation() {
        this.mapController.clearEffects();
        this.uiController.showMessage('Calculating impact effects...', 'info');
        
        setTimeout(() => {
            if (this.state.deltaV > 0 && this.state.diameter <= 500) {
                this.simulateDeflection();
            } else {
                this.simulateImpact();
            }
        }, 800);
    }
    
    simulateDeflection() {
        const missDistance = this.state.deltaV * 100000;
        
        this.uiController.showDeflectionResults(this.state.deltaV, missDistance);
        this.threeDController.animateTrajectory(true); // true = savrulma
    }
    
    simulateImpact() {
        if (!this.state.impactPoint) {
            this.uiController.showMessage('Please select an impact point on the map first.', 'warning');
            return;
        }
        
        const energy = calculations.calculateImpactEnergy(this.state.diameter, this.state.velocity);
        const effects = this.calculateImpactEffects(energy);
        
        const mitigationFailed = this.state.deltaV > 0;
        this.uiController.showImpactResults(this.state.impactPoint, effects, mitigationFailed);
        
        this.mapController.drawImpactEffects(effects);
        this.threeDController.animateTrajectory(false); // false = çarpışma
    }
    
    calculateImpactEffects(energy) {
        const megatons = calculations.energyToMegatons(energy);
        const crater = calculations.calculateCraterDiameter(megatons);
        const blast = calculations.calculateBlastRadius(energy);
        const thermal = calculations.calculateThermalRadius(megatons);
        const tsunami = calculations.getTsunamiWarning(megatons, this.state.isWaterImpact);
        
        return {
            energy: megatons,
            crater: crater,
            blast: blast,
            thermal: thermal,
            tsunami: tsunami
        };
    }
}