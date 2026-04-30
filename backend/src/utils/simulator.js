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

const startSimulator = (io) => {
  console.log('[MONITORING] IoMT physics and sensor engine started.');
  
  // Interval 1: Bins filling up & Truck Physics (every 5s)
  setInterval(async () => {
    try {
      // 1. Update Bins
      const allBinsBefore = await Bin.find({ isCollected: false });
      if (allBinsBefore.length > 0) {
        const numToUpdate = Math.max(1, Math.floor(Math.random() * 3));
        for (let i = 0; i < numToUpdate; i++) {
          const bin = allBinsBefore[Math.floor(Math.random() * allBinsBefore.length)];
          const increment = Math.floor(Math.random() * 15) + 5;
          let newLevel = Math.min(100, bin.fillLevel + increment);
          
          let newStatus = 'Normal';
          if (newLevel >= 80) newStatus = 'Critical';
          else if (newLevel >= 50) newStatus = 'Warning';
          
          await Bin.findByIdAndUpdate(bin._id, { fillLevel: newLevel, status: newStatus });
        }
      }

      // Fetch fresh bins to emit and for truck logic
      const bins = await Bin.find();
      if (io) {
        io.emit('bins_update', bins);
      }

      // 2. Move Trucks
      const uncollectedBins = bins.filter(b => b.assignedTo !== null && b.isCollected === false);
      for (const bin of uncollectedBins) {
        const driverId = bin.assignedTo;
        let truck = await Truck.findOne({ driverId });
        
        if (!truck) {
           truck = new Truck({
             driverId,
             currentLocation: [31.100965, 75.357275]
           });
        }
        
        const targetCoords = bin.coords || [31.100965, 75.357275];
        const speed = Math.floor(Math.random() * 40) + 20; 
        truck.speed = speed;
        
        const distanceToTarget = calculateDistance(
          truck.currentLocation[0], truck.currentLocation[1], 
          targetCoords[0], targetCoords[1]
        );
        
        if (distanceToTarget > 0.05) { 
           truck.currentLocation[0] += (targetCoords[0] - truck.currentLocation[0]) * 0.05;
           truck.currentLocation[1] += (targetCoords[1] - truck.currentLocation[1]) * 0.05;
        } else {
           truck.speed = 0; 
        }
        
        const newDistance = calculateDistance(
           truck.currentLocation[0], truck.currentLocation[1],
           targetCoords[0], targetCoords[1]
        );
        
        truck.distanceRemaining = Number(newDistance.toFixed(2));
        truck.etaMinutes = speed > 0 ? Number(((newDistance / speed) * 60).toFixed(1)) : 0;
        truck.targetBinId = bin._id;
        
        await truck.save();
      }

      // Fetch fresh trucks to emit
      const trucks = await Truck.find();
      if (io) {
        io.emit('trucks_update', trucks);
      }

    } catch (err) { }
  }, 5000);
};

module.exports = startSimulator;
