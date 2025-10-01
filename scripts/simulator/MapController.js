export class MapController {
constructor(simulator) {
this.simulator = simulator;
this.map = null;
this.impactMarker = null;
this.impactCircles = [];
this.impactZoneLayer = null;
}

initialize() {
    this.createMap();
    this.setupMapEvents();
    
    setTimeout(() => {
        this.map.invalidateSize();
    }, 100);
}

createMap() {
    this.map = L.map('map', {
        center: [20, 0],
        zoom: 3,
        zoomControl: true,
        attributionControl: true,
        fadeAnimation: true,
        zoomAnimation: true
    });
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(this.map);
    
    window.addEventListener('resize', () => {
        setTimeout(() => {
            this.map.invalidateSize();
        }, 100);
    });
}

setupMapEvents() {
    this.map.on('click', (e) => {
        this.handleMapClick(e);
    });
}

handleMapClick(e) {
    this.simulator.state.impactPoint = e.latlng;
    this.clearEffects();
    
    this.detectWaterOrLand(e.latlng);
    
    if (this.impactMarker) {
        this.map.removeLayer(this.impactMarker);
    }
    
    const markerClass = this.simulator.state.isWaterImpact ? 'water-marker' : 'land-marker';
    
    this.impactMarker = L.marker(e.latlng, {
        icon: L.divIcon({
            className: `impact-marker ${markerClass}`,
            iconSize: [20, 20]
        })
    })
    .addTo(this.map)
    .bindPopup(`
        <div style="text-align: center; padding: 10px;">
            <h4 style="margin: 0 0 8px 0; color: #3b82f6;">Impact Point</h4>
            <p style="margin: 0; color: #e2e8f0;">
                ${e.latlng.lat.toFixed(2)}°N, ${e.latlng.lng.toFixed(2)}°E<br>
                <small>Surface: ${this.simulator.state.isWaterImpact ? 'Water' : 'Land'}</small>
            </p>
        </div>
    `)
    .openPopup();
    
    this.simulator.uiController.showMessage(
        `Impact point selected on ${this.simulator.state.isWaterImpact ? 'water' : 'land'}. Run simulation to see effects.`, 
        'warning'
    );
}

detectWaterOrLand(latlng) {
    const lat = latlng.lat;
    const lng = latlng.lng;
    
    // Start by assuming it's land (more conservative approach)
    let isWater = false;
    
    // Major ocean bounding boxes (more precise)
    const oceanAreas = [
        // Pacific Ocean (more precise boundaries)
        { 
            name: 'Pacific', 
            minLat: -60, maxLat: 60, 
            minLng: 100, maxLng: -70, // From Asia to Americas
            wrap: true
        },
        // Atlantic Ocean
        { 
            name: 'Atlantic',
            minLat: -60, maxLat: 80, 
            minLng: -80, maxLng: 20,
            wrap: false
        },
        // Indian Ocean
        { 
            name: 'Indian',
            minLat: -60, maxLat: 30, 
            minLng: 20, maxLng: 120,
            wrap: false
        },
        // Arctic Ocean (only far north)
        { 
            name: 'Arctic',
            minLat: 70, maxLat: 90, 
            minLng: -180, maxLng: 180,
            wrap: false
        },
        // Southern Ocean (only far south)
        { 
            name: 'Southern',
            minLat: -90, maxLat: -60, 
            minLng: -180, maxLng: 180,
            wrap: false
        }
    ];
    
    // Major sea areas (smaller, more specific)
    const seaAreas = [
        // Mediterranean Sea
        { minLat: 30, maxLat: 45, minLng: -5, maxLng: 36 },
        // Caribbean Sea
        { minLat: 10, maxLat: 25, minLng: -85, maxLng: -60 },
        // South China Sea
        { minLat: 0, maxLat: 25, minLng: 105, maxLng: 120 },
        // North Sea
        { minLat: 50, maxLat: 60, minLng: -5, maxLng: 10 },
        // Baltic Sea
        { minLat: 53, maxLat: 66, minLng: 10, maxLng: 30 },
        // Red Sea
        { minLat: 12, maxLat: 30, minLng: 32, maxLng: 44 },
        // Persian Gulf
        { minLat: 24, maxLat: 30, minLng: 48, maxLng: 56 }
    ];
    
    // Major land masses (to override ocean detection in coastal areas)
    const landMasses = [
        // North America
        { minLat: 15, maxLat: 85, minLng: -170, maxLng: -50 },
        // South America
        { minLat: -55, maxLat: 15, minLng: -85, maxLng: -30 },
        // Europe
        { minLat: 35, maxLat: 75, minLng: -10, maxLng: 60 },
        // Asia
        { minLat: 10, maxLat: 80, minLng: 25, maxLng: 180 },
        // Africa
        { minLat: -35, maxLat: 38, minLng: -20, maxLng: 55 },
        // Australia
        { minLat: -45, maxLat: -10, minLng: 110, maxLng: 155 },
        // Greenland
        { minLat: 60, maxLat: 85, minLng: -75, maxLng: -10 },
        // Antarctica (land mass, not ocean)
        { minLat: -90, maxLat: -60, minLng: -180, maxLng: 180 }
    ];
    
    // First check if it's clearly in a major land mass
    let inLandMass = false;
    for (let land of landMasses) {
        if (lat >= land.minLat && lat <= land.maxLat && 
            lng >= land.minLng && lng <= land.maxLng) {
            inLandMass = true;
            break;
        }
    }
    
    // If it's in a major land mass, it's definitely land
    if (inLandMass) {
        isWater = false;
    } else {
        // Check oceans (handle Pacific wrap-around)
        for (let ocean of oceanAreas) {
            if (ocean.wrap) {
                // Pacific Ocean case (wraps around 180°)
                if (lat >= ocean.minLat && lat <= ocean.maxLat && 
                   (lng >= ocean.minLng || lng <= ocean.maxLng)) {
                    // Additional check to exclude coastal areas and islands
                    if (this.isDeepOcean(lat, lng)) {
                        isWater = true;
                        break;
                    }
                }
            } else {
                // Normal case
                if (lat >= ocean.minLat && lat <= ocean.maxLat && 
                    lng >= ocean.minLng && lng <= ocean.maxLng) {
                    // Additional check to exclude coastal areas and islands
                    if (this.isDeepOcean(lat, lng)) {
                        isWater = true;
                        break;
                    }
                }
            }
        }
        
        // Check seas if not already water
        if (!isWater) {
            for (let sea of seaAreas) {
                if (lat >= sea.minLat && lat <= sea.maxLat && 
                    lng >= sea.minLng && lng <= sea.maxLng) {
                    isWater = true;
                    break;
                }
            }
        }
    }
    
    // Update simulator state and UI
    this.simulator.state.isWaterImpact = isWater;
    this.simulator.uiController.updateButtonStates();
}

isDeepOcean(lat, lng) {
    // Additional checks to avoid false positives in coastal areas
    
    // Exclude areas near major continents
    const coastalExclusions = [
        // West coast of Americas
        { minLat: -60, maxLat: 70, minLng: -120, maxLng: -70 },
        // East coast of Americas
        { minLat: -60, maxLat: 70, minLng: -80, maxLng: -30 },
        // West coast of Europe/Africa
        { minLat: -40, maxLat: 70, minLng: -20, maxLng: 10 },
        // East coast of Asia
        { minLat: 0, maxLat: 70, minLng: 110, maxLng: 140 },
        // Coast of Australia
        { minLat: -40, maxLat: -10, minLng: 110, maxLng: 155 },
        // Coast of India/Southeast Asia
        { minLat: -10, maxLat: 30, minLng: 65, maxLng: 110 }
    ];
    
    for (let exclusion of coastalExclusions) {
        if (lat >= exclusion.minLat && lat <= exclusion.maxLat && 
            lng >= exclusion.minLng && lng <= exclusion.maxLng) {
            return false; 
        }
    }
    
    return true;
}

drawImpactEffects(effects) {
    this.clearEffects();
    
    if (!this.simulator.state.impactPoint) return;
    
    const severity = Math.min(effects.energy / 5000, 1);   

    this.createSimplifiedZones(effects, severity);

    this.adjustMapView(effects);
}

createSimplifiedZones(effects, severity) {
    const zones = [
        { 
            radius: (effects.crater / 2) * 1000,
            color: '#ef4444',
            label: 'Crater Zone',
            opacity: 0.4,
            weight: 3
        },
        { 
            radius: effects.blast * 1000,
            color: '#fef211ff',
            label: 'Blast Zone',
            opacity: 0.25,
            weight: 2,
            dashArray: '5, 5'
        },
        { 
            radius: effects.thermal * 500,
            color: '#42ff3cff',
            label: 'Thermal Zone',
            opacity: 0.15,
            weight: 1,
            dashArray: '10, 5'
        }
    ];
    
    zones.forEach(zone => {
        if (zone.radius > 1000) {
            const circle = L.circle(this.simulator.state.impactPoint, {
                radius: zone.radius,
                color: zone.color,
                fillColor: zone.color,
                fillOpacity: zone.opacity,
                weight: zone.weight,
                opacity: 0.8,
                className: 'impact-zone'
            }).addTo(this.map);
            
            circle.bindTooltip(`
                <div style="text-align: center;">
                    <strong>${zone.label}</strong><br>
                    ${(zone.radius / 1000).toFixed(1)} km radius
                </div>
            `, { permanent: false });
            
            this.impactCircles.push(circle);
        }
    });
    
    this.addEpicenterMarker();
}

addEpicenterMarker() {
    const epicenter = L.circleMarker(this.simulator.state.impactPoint, {
        radius: 6,
        color: '#ffffff',
        fillColor: '#ef4444',
        fillOpacity: 0.9,
        weight: 2
    }).addTo(this.map);
    
    epicenter.bindTooltip('Impact Epicenter', { permanent: true, direction: 'top' });
    this.impactCircles.push(epicenter);
}

adjustMapView(effects) {
    const maxRadius = Math.max(effects.thermal, effects.blast, effects.crater / 2) * 1000;
    
    if (maxRadius > 100000) { 
        this.map.setView(this.simulator.state.impactPoint, 3);
    } else if (maxRadius > 50000) { 
        this.map.setView(this.simulator.state.impactPoint, 5);
    } else if (maxRadius > 10000) {
        this.map.setView(this.simulator.state.impactPoint, 7);
    } else { 
        this.map.setView(this.simulator.state.impactPoint, 9);
    }
}

clearEffects() {
    this.impactCircles.forEach(layer => this.map.removeLayer(layer));
    this.impactCircles = [];
}

getMap() {
    return this.map;
}
}

