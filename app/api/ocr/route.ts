import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'OpenAI API Key is missing on server.' },
                { status: 500 }
            );
        }

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
        }

        // Convert file to base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64Image}`;

        const openai = new OpenAI({ apiKey });

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Identify the license plate number from this vehicle image. Return ONLY the alphanumeric characters of the plate, with no spaces or dashes. If no plate is found, return 'NOTFOUND'." },
                        {
                            type: "image_url",
                            image_url: {
                                "url": dataUrl,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 20,
        });

        const result = response.choices[0]?.message?.content?.trim() || "";

        return NextResponse.json({ text: result });

    } catch (error) {
        console.error('OCR API Error:', error);
        return NextResponse.json(
            { error: 'Error processing image.' },
            { status: 500 }
        );
    }
}
