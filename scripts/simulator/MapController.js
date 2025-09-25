export class MapController {
    constructor(simulator) {
        this.simulator = simulator;
        this.map = null;
        this.impactMarker = null;
        this.impactCircles = [];
    }
    
    initialize() {
        this.createMap();
        this.setupMapEvents();
    }
    
    createMap() {
        this.map = L.map('map').setView([20, 0], 2);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(this.map);
    }
    
    setupMapEvents() {
        this.map.on('click', (e) => {
            this.handleMapClick(e);
        });
    }
    
    handleMapClick(e) {
        this.simulator.state.impactPoint = e.latlng;
        this.clearEffects();
        
        if (this.impactMarker) {
            this.map.removeLayer(this.impactMarker);
        }
        
        this.impactMarker = L.marker(e.latlng)
            .addTo(this.map)
            .bindPopup(`Impact Point: ${e.latlng.lat.toFixed(2)}, ${e.latlng.lng.toFixed(2)}`)
            .openPopup();
        
        this.simulator.uiController.showMessage(
            'Impact point selected. Run simulation to see effects.', 
            'warning'
        );
    }
    
    drawImpactEffects(effects) {
        this.clearEffects();
        
        if (!this.simulator.state.impactPoint) return;
        
        this.impactCircles.push(L.circle(this.simulator.state.impactPoint, {
            radius: effects.thermal * 1000,
            color: '#fbbf24',
            fillColor: '#fbbf24',
            fillOpacity: 0.15,
            weight: 1
        }).addTo(this.map));
        
        this.impactCircles.push(L.circle(this.simulator.state.impactPoint, {
            radius: effects.blast * 1000,
            color: '#f97316',
            fillColor: '#f97316',
            fillOpacity: 0.25,
            weight: 1
        }).addTo(this.map));
        
        this.impactCircles.push(L.circle(this.simulator.state.impactPoint, {
            radius: (effects.crater / 2) * 1000,
            color: '#1f2937',
            fillColor: '#374151',
            fillOpacity: 0.7,
            weight: 2
        }).addTo(this.map));
    }
    
    clearEffects() {
        this.impactCircles.forEach(layer => this.map.removeLayer(layer));
        this.impactCircles = [];
    }
    
    getMap() {
        return this.map;
    }
}