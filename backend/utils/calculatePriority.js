// This function decides how important a complaint is
function calculatePriority(dangerScore, riskLevel) {
    // Higher score = more important
    let priority = 0;
    
    // Add points based on danger score (0-10 scale)
    priority += dangerScore * 10;
    
    // Add bonus points for high risk levels
    if (riskLevel === 'high') priority += 30;
    else if (riskLevel === 'critical') priority += 50;
    else if (riskLevel === 'medium') priority += 10;
    
    // Make sure priority is between 0-100
    return Math.min(100, Math.max(0, Math.round(priority)));
  }
  
  module.exports = calculatePriority;