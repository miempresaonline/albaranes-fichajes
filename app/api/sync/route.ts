import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LocalTicket, LocalVehicle } from '@/lib/types';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logSync } from '@/lib/logger';

// Helper to save Base64 string as file
async function saveBase64Image(base64Data: string, prefix: string): Promise<string | null> {
    if (!base64Data || !base64Data.startsWith('data:image')) {
        return null;
    }

    try {
        // Extract content type and data
        const matches = base64Data.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            logSync(`Invalid base64 format for ${prefix}`);
            return null;
        }

        const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        const buffer = Buffer.from(matches[2], 'base64');

        const fileName = `${prefix}_${uuidv4()}.${ext}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');

        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
            logSync('Created upload directory:', uploadDir);
        }

        const filePath = path.join(uploadDir, fileName);
        await fs.promises.writeFile(filePath, buffer);
        logSync(`Saved file: ${fileName}`);

        // Return public URL (relative)
        return `/uploads/${fileName}`;

    } catch (e) {
        logSync("Error saving image:", e);
        console.error("Error saving image:", e);
        return null;
    }
}

export async function POST(request: Request) {
    logSync('--- SYNC REQUEST RECEIVED ---');
    try {
        const body = await request.json();
        const tickets = body as (LocalTicket & { vehicles: LocalVehicle[] })[];

        logSync(`Payload received: ${tickets?.length} tickets`);

        if (!Array.isArray(tickets)) {
            logSync('Invalid payload: Not an array');
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const results = [];

        for (const ticket of tickets) {
            logSync(`Processing ticket tempId: ${ticket.id}`);

            // Check if already exists by tempId
            const existing = await prisma.albaran.findFirst({
                where: { tempId: ticket.id }
            });

            if (existing) {
                logSync(`Ticket ${ticket.id} already exists as searchId: ${existing.id}`);
                results.push({ id: ticket.id, status: 'already_synced', serverId: existing.id });
                continue;
            }

            try {
                // 1. Process Signature
                let firmaUrl = null;
                if (ticket.policiaFirma) {
                    firmaUrl = await saveBase64Image(ticket.policiaFirma, 'firma');
                }

                // 2. Process Vehicles and Photos
                // We need to map the vehicle creation data carefully to handle async image saving
                const vehiclesData = [];

                if (ticket.vehicles) {
                    for (const v of ticket.vehicles) {
                        const savedPhotos = [];
                        if (v.fotos && Array.isArray(v.fotos)) {
                            for (const photoBase64 of v.fotos) {
                                const photoUrl = await saveBase64Image(photoBase64, 'vehiculo');
                                if (photoUrl) {
                                    savedPhotos.push({
                                        url: photoUrl,
                                        tipo: 'GENERAL'
                                    });
                                }
                            }
                        }

                        vehiclesData.push({
                            matricula: v.matricula,
                            marca: v.marca,
                            modelo: v.modelo,
                            esMoto: v.esMoto,
                            esSobrepeso: v.esSobrepeso,
                            fotos: {
                                create: savedPhotos
                            }
                        });
                    }
                }

                // 3. Create Albaran with processed data
                logSync('Creating database record for ticket:', ticket.id);
                try {
                    const newAlbaran = await prisma.albaran.create({
                        data: {
                            tempId: ticket.id,
                            municipioId: ticket.municipioId,
                            servicioId: ticket.servicioId,
                            infraccionId: ticket.infraccionId,
                            calle: ticket.calle,
                            ciudad: ticket.ciudad,
                            fechaInicio: new Date(ticket.fechaInicio),
                            fechaFin: ticket.fechaFin ? new Date(ticket.fechaFin) : null,
                            policiaPlaca: ticket.policiaPlaca,
                            policiaFirma: firmaUrl, // Store the URL, not Base64
                            estado: 'SINCRONIZADO',
                            vehiculos: {
                                create: vehiclesData
                            }
                        }
                    });
                    logSync('Database record created successfully:', newAlbaran.id);
                    results.push({ id: ticket.id, status: 'synced', serverId: newAlbaran.id });

                } catch (dbError) {
                    logSync('Prisma Create Error:', dbError);
                    throw dbError; // Re-throw to be caught by outer catch
                }

            } catch (err) {
                logSync("Error processing ticket loop:", err);
                console.error("Error creating ticket:", err);
                results.push({ id: ticket.id, status: 'error', error: String(err) });
            }
        }

        logSync('Sync completed. Results:', results);
        return NextResponse.json({ success: true, results });

    } catch (e) {
        logSync("Top Level Sync API Error:", e);
        console.error("Sync API Error:", e);
        return NextResponse.json({ error: 'Internal Server Error', details: String(e) }, { status: 500 });
    }
}

