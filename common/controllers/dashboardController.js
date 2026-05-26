const User = require('../models/User');
const Participant = require('../models/participant');
const Event = require('../models/Event');
const asyncHandler = require('../helpers/asyncHandler');
const { fn, col, literal } = require('sequelize');
const { Op } = require('sequelize');
const sequelize = require('../database');
 
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


exports.getDashboardStats = asyncHandler(async (req, res) => {
    const User = require('../models/User');

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

// GET /api/dashboard/stats/top-events?limit=10
exports.getTopEvents = asyncHandler(async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

    const events = await Event.findAll({
        where: {
            maxParticipants: { [Op.ne]: null }
        }
    });

    const eventIds = events.map(e => e.id);

    const participants = await Participant.findAll({
        where: { eventId: eventIds },
        attributes: ['eventId']
    });

    const countMap = {};
    participants.forEach(p => {
        countMap[p.eventId] = (countMap[p.eventId] || 0) + 1;
    });

    const ranked = events
        .map(event => {
            const registered = countMap[event.id] || 0;
            const capacity   = event.maxParticipants;
            const percentage = parseFloat(((registered / capacity) * 100).toFixed(1));
            return {
                id:          event.id,
                title:       event.title,
                date:        event.startDate,
                location:    event.location,
                registered,
                capacity,
                percentage
            };
        })
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, limit);

    res.json({
        success: true,
        data: ranked
    });
});

exports.getRegistrationsTimeline = asyncHandler(async (req, res) => {
    const period = ['day', 'week', 'month'].includes(req.query.period)
        ? req.query.period
        : 'month';

    const dialect = sequelize.getDialect();

    const groupFormats = {
        postgres: { day: 'YYYY-MM-DD', week: 'IYYY-IW', month: 'YYYY-MM' },
        mysql:    { day: '%Y-%m-%d',   week: '%Y-%u',    month: '%Y-%m'   },
        sqlite:   { day: '%Y-%m-%d',   week: '%Y-%W',    month: '%Y-%m'   }
    };

    const fmt = (groupFormats[dialect] || groupFormats.sqlite)[period];

    let rows;

    if (dialect === 'postgres') {
        rows = await Participant.findAll({
            attributes: [
                [sequelize.fn('TO_CHAR', sequelize.col('createdAt'), fmt), 'period'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'total']
            ],
            group: ['period'],
            order: [[sequelize.literal('period'), 'ASC']],
            raw: true
        });
    } else {
        rows = await Participant.findAll({
            attributes: [
                [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), fmt), 'period'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'total']
            ],
            group: ['period'],
            order: [[sequelize.literal('period'), 'ASC']],
            raw: true
        });
    }

    const data = rows.map(r => ({
        period: r.period,
        total:  parseInt(r.total, 10)
    }));

    res.json({
        success: true,
        period,
        data
    });
});

exports.addMaterialToEvent = asyncHandler(async (req, res) => {
    const eventIds = events.map(e => e.id);

    const admin = await User.findOne({
        where: {
            eventId: eventIds,
            role: 'admin'
        }
    })
})