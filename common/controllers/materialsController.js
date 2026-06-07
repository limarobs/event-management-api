const path = require('path');
const fs = require('fs');

const EventMaterial = require('../models/EventMaterial');
const Event = require('../models/Event');

const asyncHandler = require('../helpers/asyncHandler');
const { UPLOADS_DIR } = require('../helpers/uploadHelper');


// =============================
// Listar materiais do evento
// GET /api/events/:id/materials
// =============================

exports.getMaterials = asyncHandler(async (req, res) => {

    const { id: eventId } = req.params;

    const event = await Event.findByPk(eventId);

    if (!event) {
        const err = new Error('Evento não encontrado');
        err.status = 404;
        throw err;
    }

    // Verifica janela de acesso: participante só acessa durante/após o evento
    // Admins sempre têm acesso
    if (req.user.role !== 'admin') {

        const now = new Date();
        const eventStart = new Date(`${event.date}T${event.startTime}`);

        if (now < eventStart) {
            const err = new Error(
                'Os materiais estarão disponíveis a partir do início do evento'
            );
            err.status = 403;
            throw err;
        }
    }

    const materials = await EventMaterial.findAll({
        where: { eventId },
        attributes: [
            'id', 'fileName', 'fileType', 'fileSize',
            'title', 'createdAt', 'uploadedBy'
        ],
        order: [['createdAt', 'ASC']]
    });

    res.json({
        success: true,
        data: materials
    });
});


// =============================
// Upload de material
// POST /api/events/:id/materials
// =============================

exports.uploadMaterial = asyncHandler(async (req, res) => {

    if (!req.file) {
        const err = new Error('Nenhum arquivo enviado');
        err.status = 400;
        throw err;
    }

    const { id: eventId } = req.params;
    const { title } = req.body;

    const material = await EventMaterial.create({
        eventId,
        uploadedBy: req.user.id,
        fileName: req.file.originalname,
        storedName: req.file.filename,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        filePath: req.file.path,
        title: title || null
    });

    res.status(201).json({
        success: true,
        message: 'Material enviado com sucesso',
        data: {
            id: material.id,
            fileName: material.fileName,
            fileType: material.fileType,
            fileSize: material.fileSize,
            title: material.title,
            createdAt: material.createdAt
        }
    });
});


// =============================
// Download de material
// GET /api/events/:id/materials/:materialId/download
// =============================

exports.downloadMaterial = asyncHandler(async (req, res) => {

    const { id: eventId, materialId } = req.params;

    const event = await Event.findByPk(eventId);

    if (!event) {
        const err = new Error('Evento não encontrado');
        err.status = 404;
        throw err;
    }

    // Verifica janela de acesso para participantes
    if (req.user.role !== 'admin') {

        const now = new Date();
        const eventStart = new Date(`${event.date}T${event.startTime}`);

        if (now < eventStart) {
            const err = new Error(
                'Os materiais estarão disponíveis a partir do início do evento'
            );
            err.status = 403;
            throw err;
        }
    }

    const material = await EventMaterial.findOne({
        where: {
            id: materialId,
            eventId
        }
    });

    if (!material) {
        const err = new Error('Material não encontrado');
        err.status = 404;
        throw err;
    }

    const absolutePath = path.resolve(material.filePath);

    if (!fs.existsSync(absolutePath)) {
        const err = new Error('Arquivo não encontrado no servidor');
        err.status = 404;
        throw err;
    }

    res.setHeader('Content-Type', material.fileType);
    res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(material.fileName)}"`
    );

    const stream = fs.createReadStream(absolutePath);
    stream.pipe(res);
});


// =============================
// Remover material
// DELETE /api/events/:id/materials/:materialId
// =============================

exports.deleteMaterial = asyncHandler(async (req, res) => {

    const { id: eventId, materialId } = req.params;

    const material = await EventMaterial.findOne({
        where: {
            id: materialId,
            eventId
        }
    });

    if (!material) {
        const err = new Error('Material não encontrado');
        err.status = 404;
        throw err;
    }

    // Remove arquivo do disco
    const absolutePath = path.resolve(material.filePath);

    if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
    }

    await material.destroy();

    res.json({
        success: true,
        message: 'Material removido com sucesso'
    });
});