require('dotenv').config();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sequelize = require('./common/database');

const User        = require('./common/models/User');
const Event       = require('./common/models/Event');
const Participant  = require('./common/models/participant');

const TOTAL_USERS  = 500;
const TOTAL_EVENTS = 100;
const BATCH_SIZE   = 50;  

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick  = (arr) => arr[rand(0, arr.length - 1)];
const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

function futureDate(daysAhead) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0]; 
}

function timeStr(hour, minute = 0) {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
}

const firstNames = [
    'Ana','Bruno','Carla','Diego','Elena','Felipe','Gabriela','Henrique',
    'Isabela','João','Karen','Lucas','Mariana','Nicolas','Olivia','Pedro',
    'Rafaela','Samuel','Tatiane','Victor','Yasmin','Zeca','Alice','Bernardo',
    'Camila','Daniel','Eduarda','Fernando','Giovanna','Hugo'
];

const lastNames = [
    'Silva','Santos','Oliveira','Souza','Lima','Pereira','Costa','Carvalho',
    'Almeida','Ferreira','Rodrigues','Gomes','Martins','Rocha','Ribeiro',
    'Alves','Monteiro','Mendes','Barros','Freitas','Castro','Nunes','Cardoso'
];

const eventTitles = [
    'Workshop de JavaScript', 'Palestra de UX Design', 'Hackathon de IA',
    'Meetup de Node.js', 'Curso de React', 'Seminário de Segurança',
    'Conferência de DevOps', 'Webinar de Agile', 'Bootcamp de Python',
    'Imersão em Cloud', 'TechTalk: APIs REST', 'Workshop de Docker',
    'Painel sobre Startups', 'Jornada de Dados', 'Evento de Networking',
    'Código Aberto Day', 'Apresentação de Produtos', 'Demo Day',
    'Summit de Tecnologia', 'Sprint de Inovação'
];

const locations = [
    'Auditório Central', 'Sala A1', 'Sala B2', 'Hub de Inovação',
    'Coworking Downtown', 'Teatro Municipal', 'Centro de Convenções',
    'Espaço Tech', 'Online (Zoom)', 'Online (Meet)'
];

async function seed() {
    try {
        await sequelize.authenticate();
        console.log(' Conectado ao banco de dados');

        await sequelize.sync({ alter: false });

        console.log(`\n Criando ${TOTAL_USERS} usuários...`);
        const passwordHash = await bcrypt.hash('123', 10);

        const usedEmails = new Set();
        const usersData  = [];

        usersData.push({
            name: 'Admin Master',
            email: 'admin@seed.com',
            password: passwordHash,
            role: 'admin'
        });
        usedEmails.add('admin@seed.com');

        while (usersData.length < TOTAL_USERS) {
            const name  = `${pick(firstNames)} ${pick(lastNames)}`;
            const slug  = name.toLowerCase().replace(/ /g, '.') + rand(1, 9999);
            const email = `${slug}@seed.com`;
            if (usedEmails.has(email)) continue;
            usedEmails.add(email);
            usersData.push({ name, email, password: passwordHash, role: 'user' });
        }

        const createdUsers = [];
        for (let i = 0; i < usersData.length; i += BATCH_SIZE) {
            const batch = await User.bulkCreate(usersData.slice(i, i + BATCH_SIZE), {
                ignoreDuplicates: true,
                returning: true
            });
            createdUsers.push(...batch);
            process.stdout.write(`\r  ${Math.min(i + BATCH_SIZE, TOTAL_USERS)}/${TOTAL_USERS}`);
        }
        console.log(`\n  ✔ ${createdUsers.length} usuários inseridos`);

        console.log(`\n Criando ${TOTAL_EVENTS} eventos...`);
        const eventsData = Array.from({ length: TOTAL_EVENTS }, (_, i) => {
            const startHour  = rand(8, 18);
            const endHour    = startHour + rand(1, 3);
            const maxPart    = Math.random() > 0.2 ? rand(10, 200) : null; // 20% sem limite
            return {
                title:           `${pick(eventTitles)} #${i + 1}`,
                description:     `Descrição do evento ${i + 1}. Venha participar!`,
                date:            futureDate(rand(3, 180)),
                startTime:       timeStr(startHour),
                endTime:         timeStr(Math.min(endHour, 22)),
                location:        pick(locations),
                maxParticipants: maxPart
            };
        });

        
        const createdEvents = await Event.bulkCreate(eventsData, {
            validate: false,
            returning: true
        });
        console.log(`   ${createdEvents.length} eventos inseridos`);

       
        console.log('\n🎟  Inscrevendo participantes...');
        const participantsData = [];
        const enrolled = new Set(); 

        for (const user of createdUsers) {
            const qtd    = rand(0, 5);
            const events = shuffle([...createdEvents]).slice(0, qtd);

            for (const event of events) {
                const key = `${user.id}-${event.id}`;
                if (enrolled.has(key)) continue;

                const alreadyIn = [...enrolled].filter(k => k.endsWith(`-${event.id}`)).length;
                if (event.maxParticipants && alreadyIn >= event.maxParticipants) continue;

                enrolled.add(key);
                participantsData.push({
                    eventId:           event.id,
                    userId:            user.id,
                    name:              user.name,
                    email:             user.email,
                    subscriptionToken: crypto.randomBytes(32).toString('hex')
                });
            }
        }

        for (let i = 0; i < participantsData.length; i += BATCH_SIZE) {
            await Participant.bulkCreate(participantsData.slice(i, i + BATCH_SIZE), {
                ignoreDuplicates: true
            });
            process.stdout.write(`\r  ${Math.min(i + BATCH_SIZE, participantsData.length)}/${participantsData.length}`);
        }
        console.log(`\n  ✔ ${participantsData.length} inscrições inseridas`);

        
        console.log('\n─────────────────────────────────────');
        console.log('  Seed concluído!');
        console.log(`   Usuários   : ${createdUsers.length}`);
        console.log(`   Eventos    : ${createdEvents.length}`);
        console.log(`   Inscrições : ${participantsData.length}`);
        console.log(`   Média/evento: ${(participantsData.length / createdEvents.length).toFixed(1)}`);
        console.log('\ Login admin: admin@seed.com / 123');
        console.log('─────────────────────────────────────\n');

    } catch (err) {
        console.error('\n Erro durante o seed:', err.message);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

seed();