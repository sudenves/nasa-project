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
    const isCloseCall = missDistance < 10000;
    const successLevel = isCloseCall ? 'warning' : 'success';
    
    let mainMessage, subMessage, celebrationText;
    
    if (missDistance > 50000) {
        mainMessage = "MISSION ACCOMPLISHED: EARTH IS SAFE";
        subMessage = "The asteroid has been successfully deflected with a wide safety margin.";
        celebrationText = "Humanity celebrates your successful defense!";
    } else if (missDistance > 10000) {
        mainMessage = "DEFLECTION SUCCESSFUL: CLEAR AVOIDANCE";
        subMessage = "The asteroid will pass Earth at a safe distance.";
        celebrationText = "Your mitigation strategy worked perfectly!";
    } else {
        mainMessage = "CLOSE CALL: MINIMAL AVOIDANCE";
        subMessage = "The asteroid will pass dangerously close to Earth.";
        celebrationText = "This was too close for comfort! Consider stronger deflection.";
    }
    
    this.elements.resultsDiv.innerHTML = `
        <p class="${successLevel}">${mainMessage}</p>
        <div class="celebration">
            <h4>CRISIS AVERTED</h4>
            <p>${celebrationText}</p>
        </div>
        <p class="info">Applied Delta-V: ${deltaV.toFixed(3)} m/s</p>
        <p class="safe">Miss Distance: ${helpers.formatNumber(missDistance.toFixed(2))} km</p>
        <p class="safe">Impact Probability: 0%</p>
        <p class="info">Status: PLANETARY DEFENSE SUCCESSFUL</p>
        
        <div class="impact-severity">
            <div class="severity-item">
                <div class="severity-value" style="color: #4ade80">SAFE</div>
                <div class="severity-label">Threat Level</div>
            </div>
            <div class="severity-item">
                <div class="severity-value" style="color: #4ade80">0%</div>
                <div class="severity-label">Impact Risk</div>
            </div>
            <div class="severity-item">
                <div class="severity-value" style="color: #4ade80">SUCCESS</div>
                <div class="severity-label">Mission Status</div>
            </div>
        </div>
    `;
}

showImpactResults(impactPoint, effects, mitigationFailed = false) {
    const severity = this.calculateImpactSeverity(effects.energy);
    const mainClass = severity.class;
    const mainMessage = severity.message;
    
    let mitigationText = '';
    if (mitigationFailed) {
        mitigationText = `
            <p class="warning">MITIGATION ATTEMPT FAILED</p>
            <p class="info">The asteroid was too large/moving too fast for the applied deflection force.</p>
        `;
    } else {
        mitigationText = `<p class="warning">NO MITIGATION APPLIED - IMPACT INEVITABLE</p>`;
    }
    
    let emergencyActions = '';
    if (effects.energy > 100) { 
        emergencyActions = `
            <div class="emergency-action">
                <h4>IMMEDIATE ACTION REQUIRED</h4>
                <div class="emergency-list">
                    <p>• EVACUATE impact zone immediately</p>
                    <p>• Seek underground shelter</p>
                    <p>• Prepare for secondary effects</p>
                    <p>• Monitor emergency broadcasts</p>
                </div>
            </div>
        `;
    }
    
    this.elements.resultsDiv.innerHTML = `
        ${mitigationText}
        <p class="${mainClass}">${mainMessage}</p>
        
        ${emergencyActions}
        
        <p class="info">Impact Location: ${impactPoint.lat.toFixed(2)}°N, ${impactPoint.lng.toFixed(2)}°E</p>
        <p class="warning">Explosive Energy: ${helpers.formatNumber(effects.energy.toFixed(2))} MEGATONS TNT</p>
        <p class="info">Crater Diameter: ${helpers.formatNumber(effects.crater.toFixed(2))} km</p>
        <p class="warning">Blast Radius: ${helpers.formatNumber(effects.blast.toFixed(2))} km</p>
        <p class="warning">Thermal Radius: ${helpers.formatNumber(effects.thermal.toFixed(2))} km</p>
        <p class="${effects.energy > 50 ? 'error' : 'warning'}">${effects.tsunami}</p>
        
        <div class="impact-severity">
            <div class="severity-item">
                <div class="severity-value" style="color: ${severity.color}">${severity.level}</div>
                <div class="severity-label">Threat Level</div>
            </div>
            <div class="severity-item">
                <div class="severity-value" style="color: ${severity.color}">${effects.energy > 1000 ? 'EXTINCTION' : effects.energy > 100 ? 'GLOBAL' : effects.energy > 10 ? 'REGIONAL' : 'LOCAL'}</div>
                <div class="severity-label">Impact Scale</div>
            </div>
            <div class="severity-item">
                <div class="severity-value" style="color: ${severity.color}">100%</div>
                <div class="severity-label">Impact Probability</div>
            </div>
        </div>
        
        ${this.getHistoricalComparison(effects.energy)}
    `;
}

calculateImpactSeverity(energy) {
    if (energy > 10000) {
        return {
            class: 'catastrophic',
            message: 'EXTINCTION-LEVEL EVENT DETECTED',
            level: 'CATASTROPHIC',
            color: '#dc2626'
        };
    } else if (energy > 1000) {
        return {
            class: 'catastrophic',
            message: 'GLOBAL CATASTROPHE IMMINENT',
            level: 'EXTREME',
            color: '#dc2626'
        };
    } else if (energy > 100) {
        return {
            class: 'error',
            message: 'MAJOR REGIONAL DISASTER',
            level: 'HIGH',
            color: '#f87171'
        };
    } else if (energy > 10) {
        return {
            class: 'warning',
            message: 'SIGNIFICANT LOCAL IMPACT',
            level: 'MEDIUM',
            color: '#fbbf24'
        };
    } else {
        return {
            class: 'info',
            message: 'MINOR LOCALIZED IMPACT',
            level: 'LOW',
            color: '#60a5fa'
        };
    }
}

getHistoricalComparison(energy) {
    const comparisons = [
        { energy: 50000, event: "Chicxulub Impact (Dinosaur Extinction)", energyValue: 100000000 },
        { energy: 10000, event: "Largest Nuclear Weapon Test", energyValue: 50 },
        { energy: 1000, event: "Tunguska Event (1908)", energyValue: 10 },
        { energy: 100, event: "Hiroshima Nuclear Bomb", energyValue: 0.015 },
        { energy: 10, event: "Large Conventional Bomb", energyValue: 0.001 }
    ];
    
    for (let comp of comparisons) {
        if (energy >= comp.energy) {
            const equivalent = (energy / comp.energyValue).toFixed(0);
            return `<p class="info">This impact is equivalent to ${helpers.formatNumber(equivalent)} ${comp.event}</p>`;
        }
    }
    
    return '<p class="safe">This impact is relatively small compared to historical events</p>';
}

getElements() {
    return this.elements;
}
}
