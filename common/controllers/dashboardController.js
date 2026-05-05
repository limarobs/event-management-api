const User = require('../models/User');
const Participant = require('../models/participant');
const Event = require('../models/Event');
const asyncHandler = require('../helpers/asyncHandler');
const { fn, col, literal } = require('sequelize');
 
exports.getStats = asyncHandler(async (req, res) => {
    const [totalUsers, totalParticipants, totalEvents] = await Promise.all([
        User.count(),
        Participant.count(),
        Event.count()
    ]);
 
    const avgParticipantsPerEvent = totalEvents > 0
        ? parseFloat((totalParticipants / totalEvents).toFixed(2))
        : 0;
 
    res.json({
        success: true,
        data: {
            totalUsers,
            totalParticipants,
            totalEvents,
            avgParticipantsPerEvent
        }
    });
});