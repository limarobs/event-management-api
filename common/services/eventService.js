const Event = require('../models/Event');
const EventHistory = require('../models/EventHistory');
const Participant = require('../models/participant');
const User = require('../models/User');
const fs = require('fs');

const { Op } = require('sequelize');

function getEventImageUrl(req, event) {
    if (!event.imagePath) {
        return null;
    }

    const normalizedPath = event.imagePath.replace(/\\/g, '/');
    const uploadsIndex = normalizedPath.lastIndexOf('uploads/');

    if (uploadsIndex === -1) {
        return null;
    }

    let host = req.get('host');
    if (host.startsWith('api:')) {
        host = 'localhost:' + host.split(':')[1];
    }

    return `${req.protocol}://${host}/${normalizedPath.slice(uploadsIndex)}`;
}

function serializeEvent(req, event) {
    return {
        ...event.toJSON(),
        imageUrl: getEventImageUrl(req, event)
    };
}

function normalizeEventPayload(body) {
    if (!body) {
        return;
    }

    if (!body.startDate && body.date) {
        body.startDate = body.date;
    }

    if (!body.endDate && body.date) {
        body.endDate = body.date;
    }
}

function buildParticipantMap(participants) {
    const map = {};

    participants.forEach(p => {
        if (!map[p.eventId]) {
            map[p.eventId] = [];
        }

        map[p.eventId].push({
            userId: p.userId,
            approvalStatus: p.approvalStatus,
            isCheckedIn: p.isCheckedIn
        });
    });

    return map;
}

function buildEventSummary(req, event, participants, userId) {
    const registeredParticipants = participants.filter(p =>
        ['pending', 'approved'].includes(p.approvalStatus)
    ).length;

    const max = event.maxParticipants ?? 0;

    const uid = (userId !== undefined && userId !== null)
        ? Number(userId)
        : null;

    const userParticipant =
        uid !== null
            ? participants.find(p => Number(p.userId) === uid)
            : null;

    return {
        ...serializeEvent(req, event),
        date: event.startDate,
        registeredParticipants,
        availableSpots: max > 0 ? Math.max(max - registeredParticipants, 0) : null,
        isSoldOut: max > 0 ? registeredParticipants >= max : false,
        isUserRegistered: !!userParticipant,
        userRegistrationApprovalStatus: userParticipant ? userParticipant.approvalStatus : null,
        isCheckedIn: userParticipant ? userParticipant.isCheckedIn : false
    };
}

const IGNORED_FIELDS = ['updatedAt', 'createdAt', 'id'];

module.exports = {
    getEventImageUrl,
    serializeEvent,
    normalizeEventPayload,
    buildParticipantMap,
    buildEventSummary,
    IGNORED_FIELDS
};