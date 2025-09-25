import { helpers } from '../utils/helpers.js';

export class UIController {
    constructor(simulator) {
        this.simulator = simulator;
        this.elements = {};
    }
    
    initialize() {
        this.cacheElements();
        this.setupSliderProgress();
        this.updateAllDisplays();
    }
    
    cacheElements() {
        this.elements = {
            diameterSlider: document.getElementById('diameter'),
            velocitySlider: document.getElementById('velocity'),
            deltaVSlider: document.getElementById('delta-v'),
            diameterValue: document.getElementById('diameter-value'),
            velocityValue: document.getElementById('velocity-value'),
            deltaVValue: document.getElementById('delta-v-value'),
            landBtn: document.getElementById('land-impact'),
            waterBtn: document.getElementById('water-impact'),
            simulateBtn: document.getElementById('simulate-btn'),
            resultsDiv: document.getElementById('results')
        };
    }
    
    setupSliderProgress() {
        this.updateSliderProgress(this.elements.diameterSlider);
        this.updateSliderProgress(this.elements.velocitySlider);
        this.updateSliderProgress(this.elements.deltaVSlider);
    }
    
    updateSliderProgress(slider) {
        const value = (slider.value - slider.min) / (slider.max - slider.min) * 100;
        const container = slider.closest('.slider-container');
        let progress = container.querySelector('.slider-progress');
        
        if (!progress) {
            const track = document.createElement('div');
            track.className = 'slider-track';
            progress = document.createElement('div');
            progress.className = 'slider-progress';
            track.appendChild(progress);
            container.appendChild(track);
        }
        
        progress.style.width = `${value}%`;
    }
    
    updateAllDisplays() {
        this.updateDisplay('diameter', this.simulator.state.diameter);
        this.updateDisplay('velocity', this.simulator.state.velocity);
        this.updateDisplay('deltaV', this.simulator.state.deltaV);
        this.updateButtonStates();
    }
    
    updateDisplay(type, value) {
        switch (type) {
            case 'diameter':
                this.elements.diameterValue.textContent = `${value} m`;
                break;
            case 'velocity':
                this.elements.velocityValue.textContent = `${value} km/s`;
                break;
            case 'deltaV':
                this.elements.deltaVValue.textContent = `${value.toFixed(3)} m/s`;
                break;
        }
    }
    
    updateButtonStates() {
        const isWater = this.simulator.state.isWaterImpact;
        this.elements.landBtn.classList.toggle('active', !isWater);
        this.elements.waterBtn.classList.toggle('active', isWater);
    }
    
    showMessage(text, type = 'info') {
        this.elements.resultsDiv.innerHTML = `<p class="${type}">${text}</p>`;
    }
    
    showDeflectionResults(deltaV, missDistance) {
        this.elements.resultsDiv.innerHTML = `
            <p class="success">SUCCESS: Asteroid Deflected!</p>
            <p>Delta-V of ${deltaV.toFixed(3)} m/s was sufficient to prevent collision.</p>
            <p class="info">Miss Distance: ${helpers.formatNumber(missDistance.toFixed(2))} km</p>
        `;
    }
    
    showImpactResults(impactPoint, effects, mitigationFailed = false) {
        let html = mitigationFailed 
            ? `<p class="error">MITIGATION FAILED: Asteroid too large to deflect</p>`
            : `<p class="error">IMPACT: No mitigation applied</p>`;
        
        html += `
            <p class="info">Location: ${impactPoint.lat.toFixed(2)}, ${impactPoint.lng.toFixed(2)}</p>
            <p class="info">Energy: ${helpers.formatNumber(effects.energy.toFixed(2))} Megatons TNT</p>
            <p>Crater: ${helpers.formatNumber(effects.crater.toFixed(2))} km diameter</p>
            <p>Air Blast Radius: ${helpers.formatNumber(effects.blast.toFixed(2))} km</p>
            <p>Thermal Radius: ${helpers.formatNumber(effects.thermal.toFixed(2))} km</p>
            <p>${effects.tsunami}</p>
        `;
        
        this.elements.resultsDiv.innerHTML = html;
    }
    
    getElements() {
        return this.elements;
    }
}