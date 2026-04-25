const Bin = require('../models/Bin');
const Truck = require('../models/Truck');
const User = require('../models/User');

// Haversine formula to calculate distance between two coordinates in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const startSimulator = () => {
  console.log('[MONITORING] IoMT physics and sensor engine started.');
  
  // Interval 1: Bins filling up (every 8s)
  setInterval(async () => {
    try {
      const bins = await Bin.find({ isCollected: false });
      if (bins.length > 0) {
        const numToUpdate = Math.max(1, Math.floor(Math.random() * 3));
        for (let i = 0; i < numToUpdate; i++) {
          const bin = bins[Math.floor(Math.random() * bins.length)];
          const increment = Math.floor(Math.random() * 15) + 5;
          let newLevel = Math.min(100, bin.fillLevel + increment);
          
          let newStatus = 'Normal';
          if (newLevel >= 80) newStatus = 'Critical';
          else if (newLevel >= 50) newStatus = 'Warning';
          
          await Bin.findByIdAndUpdate(bin._id, { fillLevel: newLevel, status: newStatus });
        }
      }
    } catch (err) {}
  }, 8000);

  // Interval 2: Truck physics (every 3s)
  setInterval(async () => {
    try {
      const bins = await Bin.find({ assignedTo: { $ne: null }, isCollected: false });
      
      for (const bin of bins) {
        const driverId = bin.assignedTo;
        let truck = await Truck.findOne({ driverId });
        
        if (!truck) {
           // initialize truck near center of Punjab if doesn't exist
           truck = new Truck({
             driverId,
             currentLocation: [31.100965, 75.357275]
           });
        }
        
        // Target is assigned bin
        const targetCoords = bin.coords || [31.100965, 75.357275];
        
        // Random speed between 20-60 km/h
        const speed = Math.floor(Math.random() * 40) + 20; 
        truck.speed = speed;
        
        // Move truck towards target bin
        const distanceToTarget = calculateDistance(
          truck.currentLocation[0], truck.currentLocation[1], 
          targetCoords[0], targetCoords[1]
        );
        
        if (distanceToTarget > 0.05) { // Needs to move
           // Interpolate coordinate
           // Move roughly (speed/3600) * 3 seconds in km / ~111km per lat degree
           // Let's abstract it visually: move 5% of the distance per tick for UI scaling
           truck.currentLocation[0] += (targetCoords[0] - truck.currentLocation[0]) * 0.05;
           truck.currentLocation[1] += (targetCoords[1] - truck.currentLocation[1]) * 0.05;
        } else {
           truck.speed = 0; // arrived
        }
        
        const newDistance = calculateDistance(
           truck.currentLocation[0], truck.currentLocation[1],
           targetCoords[0], targetCoords[1]
        );
        
        truck.distanceRemaining = Number(newDistance.toFixed(2));
        // ETA = Distance / Speed (in hours) * 60 = minutes
        truck.etaMinutes = speed > 0 ? Number(((newDistance / speed) * 60).toFixed(1)) : 0;
        truck.targetBinId = bin._id;
        
        await truck.save();
      }
    } catch (err) { }
  }, 3000);
};

module.exports = startSimulator;
