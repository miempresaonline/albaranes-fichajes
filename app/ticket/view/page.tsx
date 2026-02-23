'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, CheckCircle, Plus, Upload, Trash2, Shield, Loader2, ArrowLeft, Save, MapPin } from 'lucide-react';
import { db, LocalTicket, LocalVehicle } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SignaturePad } from '@/components/pwa/SignaturePad';
import { useSyncManager } from '@/lib/sync';
import { deleteAlbaran, getAlbaranById } from '@/app/actions';
import { CameraCapture } from '@/components/pwa/CameraCapture';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Checkbox } from "@/components/ui/checkbox";
import { ScanText } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Added Select
import { resizeImage } from '@/lib/image-utils';

// Helper to convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

function TicketDetailContent() {
    const searchParams = useSearchParams();
    const ticketId = searchParams.get('id') || '';
    const router = useRouter();

    const ticket = useLiveQuery(() => ticketId ? db.tickets.get(ticketId) : undefined, [ticketId], null);
    const vehicles = useLiveQuery(() => ticketId ? db.vehicles.where('localTicketId').equals(ticketId).toArray() : [], [ticketId]);

    // Master Data for Edit
    const infracciones = useLiveQuery(() => db.masterData.get('infracciones').then(r => r?.data || []), [], []);

    // Ticket Editable State
    const [infraccionId, setInfraccionId] = useState('');
    const [calle, setCalle] = useState('');
    const [ciudad, setCiudad] = useState('');
    const [placa, setPlaca] = useState('');
    const [firma, setFirma] = useState<string | null>(null);

    const [isSaving, setIsSaving] = useState(false);

    // Server Fallback State
    const [serverTicket, setServerTicket] = useState<any>(null);
    const [loadingServer, setLoadingServer] = useState(false);

    useEffect(() => {
        // If Dexie returns undefined (not found) and we haven't checked server yet
        if (ticket === undefined && ticketId && !serverTicket && !loadingServer) {
            setLoadingServer(true);
            getAlbaranById(ticketId).then(res => {
                setServerTicket(res);
                setLoadingServer(false);
            });
        }
    }, [ticket, ticketId, serverTicket, loadingServer]);

    const displayTicket = ticket || serverTicket;


    // Vehicle Form State
    const [showAddVehicle, setShowAddVehicle] = useState(false);
    const [matricula, setMatricula] = useState('');
    const [marcaId, setMarcaId] = useState('');
    const [modeloId, setModeloId] = useState('');
    const [esMoto, setEsMoto] = useState(false);
    const [esSobrepeso, setEsSobrepeso] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [ocrLoading, setOcrLoading] = useState(false);

    const { syncTickets } = useSyncManager();

    // Master Data for Vehicle Form
    const marcas = useLiveQuery(() => db.masterData.get('marcas').then(r => r?.data || []));
    const modelos = useLiveQuery(
        () => db.masterData.get('modelos').then(r => r?.data.filter((m: any) => m.marcaId === marcaId) || []),
        [marcaId]
    );

    // Prepare options for SearchableSelect
    const marcaOptions = marcas?.map((m: any) => ({ value: m.id, label: m.nombre })) || [];
    const modeloOptions = modelos?.map((m: any) => ({ value: m.id, label: m.nombre })) || [];

    // Warm up the cache for the add-vehicle page
    useEffect(() => {
        if (navigator.onLine) {
            fetch('/ticket/vehicle/new', { mode: 'no-cors' }).catch(() => { });
        }
    }, []);

    const initializedInfo = useRef(false);

    useEffect(() => {
        if (displayTicket && !initializedInfo.current) {
            setPlaca(displayTicket.policiaPlaca || '');
            setFirma(displayTicket.policiaFirma || null);
            setInfraccionId(displayTicket.infraccionId || '');
            setCalle(displayTicket.calle || '');
            setCiudad(displayTicket.ciudad || '');
            initializedInfo.current = true;
        }
    }, [displayTicket]);

    // Update state if ticket updates (e.g. sync changes in background) - optional but good for consistency
    // But be careful not to overwrite user input. `initializedInfo` prevents loop but misses external updates.
    // For now, simple init is enough.

    // OCR Logic
    const handleOCR = async () => {
        if (!navigator.onLine) {
            alert("Estás offline. El reconocimiento de matrícula requiere internet.");
            return;
        }

        if (files.length === 0) {
            alert("Primero toma una foto del vehículo (frontal)");
            return;
        }
        setOcrLoading(true);

        try {
            const resizedFile = await resizeImage(files[0], 800);
            const formData = new FormData();
            formData.append('file', resizedFile);

            const response = await fetch('/api/ocr', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Error en OCR API');
            }

            const data = await response.json();

            if (data.text && data.text !== 'NOTFOUND') {
                setMatricula(data.text);
            } else {
                alert("No se pudo detectar la matrícula. Inténtalo de nuevo o escríbela manual.");
            }

        } catch (e) {
            console.error(e);
            alert("Error al leer matrícula via AI.");
        } finally {
            setOcrLoading(false);
        }
    };

    // Save Vehicle Logic
    const handleSaveVehicle = async () => {
        if (!matricula || !marcaId || !modeloId) {
            alert("Completa matrícula, marca y modelo");
            return;
        }

        // 1. Process Images
        const photoPromises = files.map(f => fileToBase64(f));
        const photoBase64s = await Promise.all(photoPromises);

        // 2. Lookup names
        const marcaName = marcas?.find((m: any) => m.id === marcaId)?.nombre;
        const modeloName = modelos?.find((m: any) => m.id === modeloId)?.nombre;

        // 3. Save
        await db.vehicles.add({
            id: uuidv4(),
            localTicketId: ticketId,
            matricula,
            marca: marcaName || '',
            modelo: modeloName || '',
            esMoto,
            esSobrepeso,
            fotos: photoBase64s
        });

        // Reset Form
        setMatricula('');
        setMarcaId('');
        setModeloId('');
        setEsMoto(false);
        setEsSobrepeso(false);
        setFiles([]);
        setShowAddVehicle(false);
    };

    const handleDelete = async () => {
        if (!confirm("¿SEGURO QUE QUIERES ELIMINAR ESTE ALBARÁN? Esta acción no se puede deshacer.")) return;

        setIsSaving(true);
        try {
            // 1. Delete from Server (if online and synced)
            // Use displayTicket for ID check
            const idToDelete = displayTicket?.tempId || displayTicket?.id;

            if (idToDelete && navigator.onLine) {
                try {
                    const result = await deleteAlbaran(idToDelete);
                    if (!result.success) {
                        console.error("Server delete failed:", result.error);
                        alert("Aviso: No se pudo eliminar del servidor (" + result.error + "). Se eliminará localmente.");
                    }
                } catch (err) {
                    console.error("Server delete error:", err);
                    // Continue to delete locally
                }
            }

            // DELETE LOCAL
            await db.transaction('rw', db.tickets, db.vehicles, async () => {
                await db.vehicles.where('localTicketId').equals(ticketId).delete();
                await db.tickets.delete(ticketId);
            });

            alert("Albarán eliminado del dispositivo.");
            // Force hard reload to ensure server cache + local state are perfectly clear
            window.location.href = '/';

        } catch (e) {
            console.error(e);
            alert("Error al eliminar: " + e);
        } finally {
            setIsSaving(false);
        }
    };

    // ... handleFinalize ...
    const handleFinalize = async () => {
        console.log("Saving ticket...", { placa, infraccionId, calle, ciudad });

        if (ticket) {
            setIsSaving(true);
            try {
                // 1. Update local state
                await db.tickets.update(ticket.id, {
                    policiaPlaca: placa,
                    policiaFirma: firma, // Allow null to clear
                    infraccionId,
                    calle,
                    ciudad,
                    // If we want to mark it as modified for sync, we should update 'synced' to 0 if it was 1?
                    // The sync logic usually picks up synced=0.
                    // If it was already synthesized, we should force re-sync.
                    synced: 0
                });

                // 2. Sync if online
                if (navigator.onLine) {
                    // @ts-ignore
                    const count = await syncTickets();
                    if (count === 0) {
                        // Sometimes the hook doesn't pick it up immediately if we just updated it.
                        // Force manual sync call again just in case?
                        // usually syncTickets() checks db.tickets.where('synced').equals(0)
                        // so it should pick it up.
                        await syncTickets();
                    }
                } else {
                    alert("Albarán guardado en modo OFFLINE. Se sincronizará cuando tengas conexión.");
                }

                router.push('/');
            } catch (error) {
                console.error(error);
                if (!String(error).includes("Sync failed")) {
                    alert("Error al guardar: " + String(error));
                }
            } finally {
                setIsSaving(false);
            }
        }
    };

    if (!ticketId) return <div className="p-8 text-center">ID de ticket no proporcionado</div>;

    if (ticket === undefined && !serverTicket) {
        if (loadingServer) return <div className="p-8 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-slate-400" /><br />Buscando en el servidor...</div>;

        return (
            <div className="p-8 text-center space-y-4">
                <div className="text-red-500 font-bold">Albarán no encontrado (ni local ni servidor)</div>
                <Button onClick={() => router.push('/')} variant="outline">Volver</Button>
            </div>
        );
    }

    if (ticket === null && !serverTicket) return <div className="p-8 text-center flex flex-col items-center gap-4"><Loader2 className="animate-spin h-8 w-8 text-slate-400" /> <span className="text-slate-500">Cargando servicio...</span></div>;

    // Use displayTicket for rendering
    if (!displayTicket) return null;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <header className="bg-white border-b px-4 py-3 sticky top-0 z-10 flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div className="flex-1">
                    <h1 className="font-bold text-lg">Servicio {displayTicket.tempId?.slice(0, 4) || '???'}</h1>
                    <p className="text-xs text-slate-500">
                        {serverTicket ? 'Vista Servidor (Solo Lectura/Borrar)' : 'Editar Albarán'}
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                        {/* Safe date parsing */}
                        {typeof displayTicket.fechaInicio === 'string'
                            ? new Date(displayTicket.fechaInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : displayTicket.fechaInicio.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        }
                    </div>
                </div>
            </header>

            <main className="p-4 space-y-4 max-w-md mx-auto">

                {/* 1. Datos Generales (Editables) */}
                <section>
                    <h2 className="text-sm font-semibold text-slate-500 uppercase mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Datos Servicio
                    </h2>
                    <Card>
                        <CardContent className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label>Calle</Label>
                                    <Input value={calle} onChange={(e) => setCalle(e.target.value)} placeholder="Calle..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Ciudad</Label>
                                    <Input value={ciudad} onChange={(e) => setCiudad(e.target.value)} placeholder="Ciudad..." />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Infracción (Opcional)</Label>
                                <Select onValueChange={setInfraccionId} value={infraccionId}>
                                    <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                    <SelectContent>
                                        {infracciones?.map((i: any) => <SelectItem key={i.id} value={i.id}>{i.codigo} - {i.descripcion}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* VEHICLES LIST */}
                <section>
                    <h2 className="text-sm font-semibold text-slate-500 uppercase mb-2">Vehículos Retirados</h2>
                    <div className="space-y-3">
                        {vehicles?.map(v => (
                            <Card key={v.id} className="overflow-hidden">
                                <CardContent className="p-0 flex">
                                    <div className="w-24 bg-slate-200 object-cover relative">
                                        {v.fotos[0] ? (
                                            <img src={v.fotos[0]} className="w-full h-full object-cover absolute inset-0" alt="v" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-slate-400">
                                                <Car className="h-8 w-8" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="text-lg font-bold font-mono">{v.matricula}</div>
                                                <div className="text-sm text-slate-600">{v.marca} {v.modelo}</div>
                                            </div>
                                            {v.esMoto && <span className="bg-yellow-100 text-yellow-800 text-[10px] px-1 py-0.5 rounded">MOTO</span>}
                                        </div>
                                        <div className="mt-2 text-xs text-slate-400">
                                            {v.fotos.length} fotos
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* INLINE ADD VEHICLE FORM */}
                    <div className="mt-4">
                        {!showAddVehicle ? (
                            <Button
                                className="w-full h-14 border-2 border-dashed border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-400"
                                variant="outline"
                                disabled={isSaving}
                                onClick={() => setShowAddVehicle(true)}
                            >
                                <Plus className="mr-2 h-5 w-5" /> Añadir Vehículo
                            </Button>
                        ) : (
                            <Card className="border-2 border-blue-100 animate-in slide-in-from-top-2">
                                <CardHeader className="pb-3 bg-blue-50/50">
                                    <CardTitle className="text-sm font-bold uppercase text-blue-700 flex justify-between items-center">
                                        Nuevo Vehículo
                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setShowAddVehicle(false)}><ArrowLeft className="h-4 w-4" /></Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    {/* PHOTOS */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-slate-500">Fotografías</Label>
                                        <CameraCapture onImagesCaptured={setFiles} />
                                    </div>

                                    {/* LICENSE PLATE */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <Label className="text-xs font-bold uppercase text-slate-500">Matrícula</Label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    capture="environment"
                                                    className="hidden"
                                                    id="ocr-camera"
                                                    onChange={async (e) => {
                                                        if (e.target.files && e.target.files.length > 0) {
                                                            const file = e.target.files[0];
                                                            setFiles(prev => [...prev, file]);
                                                            if (!navigator.onLine) {
                                                                alert("Modo OFFLINE: OCR desactivado.");
                                                                return;
                                                            }
                                                            setOcrLoading(true);
                                                            const formData = new FormData();
                                                            formData.append('file', file);
                                                            try {
                                                                const response = await fetch('/api/ocr', { method: 'POST', body: formData });
                                                                if (!response.ok) throw new Error('Error API');
                                                                const data = await response.json();
                                                                if (data.text && data.text !== 'NOTFOUND') setMatricula(data.text);
                                                                else alert("No se detectó matrícula");
                                                            } catch (err) {
                                                                console.error(err);
                                                                alert("Error OCR");
                                                            } finally {
                                                                setOcrLoading(false);
                                                            }
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (files.length > 0) handleOCR();
                                                        else document.getElementById('ocr-camera')?.click();
                                                    }}
                                                    disabled={ocrLoading}
                                                    className="h-8 text-xs"
                                                >
                                                    {ocrLoading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <ScanText className="mr-2 h-3 w-3" />}
                                                    {files.length > 0 ? "Leer F. Existente" : "Foto y Leer"}
                                                </Button>
                                            </div>
                                        </div>
                                        <Input
                                            className="text-2xl font-mono uppercase tracking-widest text-center h-14 font-bold"
                                            placeholder="0000XXX"
                                            value={matricula}
                                            onChange={(e) => setMatricula(e.target.value.toUpperCase())}
                                        />
                                    </div>

                                    {/* INFO */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Marca</Label>
                                            <SearchableSelect
                                                options={marcaOptions}
                                                value={marcaId}
                                                onValueChange={(val) => {
                                                    setMarcaId(val);
                                                    setModeloId('');
                                                }}
                                                placeholder="Buscar marca..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Modelo</Label>
                                            <SearchableSelect
                                                options={modeloOptions}
                                                value={modeloId}
                                                onValueChange={setModeloId}
                                                placeholder="Buscar modelo..."
                                                disabled={!marcaId}
                                            />
                                        </div>
                                        <div className="flex gap-4 pt-2">
                                            <div className="flex items-center space-x-2 border p-3 rounded-md flex-1 justify-center">
                                                <Checkbox id="moto" checked={esMoto} onCheckedChange={(c) => setEsMoto(!!c)} />
                                                <label htmlFor="moto" className="text-sm font-medium">Motocicleta</label>
                                            </div>
                                            <div className="flex items-center space-x-2 border p-3 rounded-md flex-1 justify-center">
                                                <Checkbox id="peso" checked={esSobrepeso} onCheckedChange={(c) => setEsSobrepeso(!!c)} />
                                                <label htmlFor="peso" className="text-sm font-medium">Sobrepeso</label>
                                            </div>
                                        </div>
                                    </div>

                                    <Button size="lg" className="w-full font-bold bg-blue-600 hover:bg-blue-700 mt-4" onClick={handleSaveVehicle}>
                                        Guardar Vehículo <Save className="ml-2 h-5 w-5" />
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </section>

                <section>
                    <h2 className="text-sm font-semibold text-slate-500 uppercase mb-2 flex items-center gap-2">
                        <Shield className="h-4 w-4" /> Datos Policiales
                    </h2>
                    <Card>
                        <CardContent className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>Nº Placa Agente</Label>
                                <Input
                                    placeholder="Placa..."
                                    value={placa}
                                    onChange={(e) => setPlaca(e.target.value)}
                                    disabled={isSaving}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Firma Conformidad</Label>
                                <div className="border bg-slate-50 p-1 rounded">
                                    <SignaturePad onChange={setFirma} defaultValue={displayTicket.policiaFirma} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <div className="pt-4 pb-8 flex flex-col gap-3">
                    <Button
                        size="lg"
                        className="w-full font-bold bg-green-600 hover:bg-green-700 h-14"
                        onClick={handleFinalize}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>Guardando... <Loader2 className="ml-2 h-5 w-5 animate-spin" /></>
                        ) : (
                            <><CheckCircle className="mr-2 h-5 w-5" /> Guardar Cambios</>
                        )}
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full border-red-200 text-red-600 hover:bg-red-50"
                        onClick={handleDelete}
                        disabled={isSaving}
                    >
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar Albarán
                    </Button>
                </div>
            </main >
        </div >
    );
}

export default function TicketDetailPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
            <TicketDetailContent />
        </Suspense>
    );
}
