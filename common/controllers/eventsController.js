exports.getAllEvents = asyncHandler(async (req, res) => {

    const userId = req.user?.id;

    const page =
        Math.max(parseInt(req.query.page, 10) || 1, 1);

    const limit =
        Math.min(
            Math.max(parseInt(req.query.limit, 10) || 10, 1),
            50
        );

    const offset = (page - 1) * limit;

    const {
        count: totalItems,
        rows: events
    } = await Event.findAndCountAll({
        limit,
        offset,
        order: [['date', 'ASC'], ['startTime', 'ASC']]
    });

    const eventIds = events.map(e => e.id);

    const participants = await Participant.findAll({
        where: {
            eventId: eventIds
        },
        attributes: [
            "eventId",
            "userId",
            "approvalStatus"
        ]
    });

    const map = {};

    participants.forEach(p => {

        if (!map[p.eventId]) {
            map[p.eventId] = [];
        }

        map[p.eventId].push({
            userId: p.userId,
            approvalStatus: p.approvalStatus
        });
    });

    const data = events.map(event => {

        const list = map[event.id] || [];

        const registeredParticipants = list.length;

        const max = event.maxParticipants ?? 0;

        const userParticipant =
            list.find(p => p.userId === userId);

        return {
            ...event.toJSON(),

            registeredParticipants,

            availableSpots:
                max > 0
                    ? Math.max(max - registeredParticipants, 0)
                    : null,

            isSoldOut:
                max > 0
                    ? registeredParticipants >= max
                    : false,

            isUserRegistered:
                !!userParticipant,

            userRegistrationApprovalStatus:
                userParticipant
                    ? userParticipant.approvalStatus
                    : null
        };
    });

    const totalPages = Math.ceil(totalItems / limit);

    res.json({
        page,
        limit,
        totalItems,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
        data
    });
});