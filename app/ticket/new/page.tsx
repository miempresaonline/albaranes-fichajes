'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, MapPin, Clock, RefreshCw, Camera, Car, CheckCircle, Shield, Loader2, ScanText, Plus, Trash2 } from 'lucide-react';
import { db } from '@/lib/db';
import { seedMasterData } from '@/lib/seed-client';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import { CameraCapture } from '@/components/pwa/CameraCapture';
import { SignaturePad } from '@/components/pwa/SignaturePad';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Checkbox } from "@/components/ui/checkbox";
import { useSyncManager } from '@/lib/sync';
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

const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function NewTicketForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { syncTickets } = useSyncManager();

    // --- FORM STATE ---

    // 1. General & Location
    const [municipioId, setMunicipioId] = useState('');
    const [servicioId, setServicioId] = useState('');
    const [infraccionId, setInfraccionId] = useState('');
    const [calle, setCalle] = useState('');
    const [ciudad, setCiudad] = useState('');
    const [geoLoading, setGeoLoading] = useState(false);

    // Dates (Default: Now and Now + 1h)
    const toLocalISO = (date: Date) => {
        const offset = date.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
        return localISOTime;
    };

    const [fechaInicio, setFechaInicio] = useState(toLocalISO(new Date()));
    const [fechaFin, setFechaFin] = useState(toLocalISO(new Date(Date.now() + 60 * 60 * 1000)));

    // 2. Vehicles
    interface TempVehicle {
        id: string; // temp id
        matricula: string;
        marcaId: string;
        modeloId: string;
        esMoto: boolean;
        esSobrepeso: boolean;
        files: File[];
        marcaName?: string;
        modeloName?: string;
    }

    const [addedVehicles, setAddedVehicles] = useState<TempVehicle[]>([]);

    // Current Vehicle Form
    const [matricula, setMatricula] = useState('');
    const [marcaId, setMarcaId] = useState('');
    const [modeloId, setModeloId] = useState('');
    const [esMoto, setEsMoto] = useState(false);
    const [esSobrepeso, setEsSobrepeso] = useState(false);
    const [vehicleFiles, setVehicleFiles] = useState<File[]>([]);
    const [ocrLoading, setOcrLoading] = useState(false);

    // 3. Agent
    const [placa, setPlaca] = useState('');
    const [firma, setFirma] = useState<string | null>(null);

    // --- DATA ---
    const municipios = useLiveQuery(() => db.masterData.get('municipios').then(r => r?.data || []), [], []);
    const servicios = useLiveQuery(() => db.masterData.get('servicios').then(r => r?.data || []), [], []);
    const infracciones = useLiveQuery(() => db.masterData.get('infracciones').then(r => r?.data || []), [], []);
    const marcas = useLiveQuery(() => db.masterData.get('marcas').then(r => r?.data || []), [], []);

    // Derived Modelos based on Marca
    const [availableModelos, setAvailableModelos] = useState<any[]>([]);

    useEffect(() => {
        if (marcaId) {
            db.masterData.get('modelos').then(r => {
                const filtered = r?.data.filter((m: any) => m.marcaId === marcaId) || [];
                setAvailableModelos(filtered);
            });
        } else {
            setAvailableModelos([]);
        }
    }, [marcaId]);

    const marcaOptions = marcas?.map((m: any) => ({ value: m.id, label: m.nombre })) || [];
    const modeloOptions = availableModelos.map((m: any) => ({ value: m.id, label: m.nombre })) || [];

    // --- INITIALIZATION ---
    useEffect(() => {
        // Initialize Data
        seedMasterData()
            .then(() => setLoading(false))
            .catch(err => {
                console.error("Error seeding data:", err);
                setLoading(false);
            });
        handleGeolocate();
    }, []);

    // --- GEOLOCATION ---
    const handleGeolocate = () => {
        if (!navigator.geolocation) return;

        setGeoLoading(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            console.log("Got location:", latitude, longitude);

            if (navigator.onLine) {
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();

                    if (data && data.address) {
                        const addr = data.address;

                        const street = addr.road || addr.pedestrian || addr.construction || '';
                        const number = addr.house_number ? `, ${addr.house_number}` : '';
                        if (street) setCalle(`${street}${number}`);

                        const city = addr.city || addr.town || addr.village || addr.municipality || '';
                        if (city) {
                            setCiudad(city);
                            matchMunicipality(city);
                        }
                    }
                } catch (e) {
                    console.error("Geocoding failed", e);
                }
            }
            setGeoLoading(false);
        }, (err) => {
            console.error("Geolocation error", err);
            setGeoLoading(false);
        }, { enableHighAccuracy: true });
    };

    const matchMunicipality = (cityName: string) => {
        if (!municipios) return;
        const normalizedCity = normalize(cityName);

        const match = municipios.find((m: any) =>
            normalize(m.nombre).includes(normalizedCity) ||
            normalizedCity.includes(normalize(m.nombre))
        );

        if (match) {
            setMunicipioId(match.id);
        }
    };

    useEffect(() => {
        if (ciudad && !municipioId && municipios?.length) {
            matchMunicipality(ciudad);
        }
    }, [municipios, ciudad]);


    // --- OCR ---
    const handleOCR = async () => {
        if (!navigator.onLine) {
            alert("Estás offline. El reconocimiento de matrícula requiere internet.");
            return;
        }
        if (vehicleFiles.length === 0) {
            alert("Primero toma una foto del vehículo.");
            return;
        }
        setOcrLoading(true);
        try {
            // Resize for speed (max 800px)
            const resizedFile = await resizeImage(vehicleFiles[0], 800);

            const formData = new FormData();
            formData.append('file', resizedFile);

            const response = await fetch('/api/ocr', { method: 'POST', body: formData });
            if (!response.ok) throw new Error('Error en OCR API');
            const data = await response.json();
            if (data.text && data.text !== 'NOTFOUND') {
                setMatricula(data.text); // normalize done in server or here? server returns trimmed
            } else {
                alert("No se pudo detectar la matrícula. Inténtalo de nuevo.");
            }
        } catch (e) {
            console.error(e);
            alert("Error al leer matrícula.");
        } finally {
            setOcrLoading(false);
        }
    };

    // --- ADD VEHICLE TO LOCAL LIST ---
    const handleAddVehicle = () => {
        // Validation for current vehicle
        if (!matricula || !marcaId) {
            alert("Introduce al menos Matrícula y Marca.");
            return;
        }

        const marcaName = marcas?.find((m: any) => m.id === marcaId)?.nombre || '';
        const modeloName = availableModelos.find((m: any) => m.id === modeloId)?.nombre || '';

        const newVehicle: TempVehicle = {
            id: uuidv4(),
            matricula: matricula.toUpperCase(),
            marcaId,
            modeloId,
            esMoto,
            esSobrepeso,
            files: vehicleFiles,
            marcaName,
            modeloName
        };

        setAddedVehicles([...addedVehicles, newVehicle]);

        // Reset fields
        setMatricula('');
        setMarcaId('');
        setModeloId('');
        setEsMoto(false);
        setEsSobrepeso(false);
        setVehicleFiles([]);

        alert("Vehículo añadido a la lista. Puedes añadir otro o finalizar.");
        // Scroll to vehicle section top to show it's added? 
        // Not strictly needed if list is visible.
    };

    const removeVehicle = (id: string) => {
        setAddedVehicles(addedVehicles.filter(v => v.id !== id));
    };

    // --- SUBMIT ---
    const handleSubmit = async () => {
        // 1. Check if there are vehicles pending to be added in form inputs
        // If user typed a vehicle but didn't click "Add", we should probably warn or auto-add.
        // Let's assume if fields are filled, we auto-add to the final list.

        let finalVehicles = [...addedVehicles];

        if (matricula && marcaId) {
            // Auto-add current form content
            const marcaName = marcas?.find((m: any) => m.id === marcaId)?.nombre || '';
            const modeloName = availableModelos.find((m: any) => m.id === modeloId)?.nombre || '';

            finalVehicles.push({
                id: uuidv4(),
                matricula: matricula.toUpperCase(),
                marcaId,
                modeloId,
                esMoto,
                esSobrepeso,
                files: vehicleFiles,
                marcaName,
                modeloName
            });
        }

        // Validation
        if (!municipioId) return alert("Selecciona el Ayuntamiento.");
        if (!servicioId) return alert("Selecciona el Tipo de Servicio.");
        if (!calle) return alert("Indica la ubicación.");
        if (finalVehicles.length === 0) return alert("Debes añadir al menos un vehículo.");
        // if (!placa) return alert("Indica tu número de placa.");
        // if (!firma) return alert("Debes firmar el servicio.");

        setIsSaving(true);
        try {
            const ticketId = uuidv4();
            const now = new Date();

            // 0. Pre-process images OUTSIDE transaction to avoid TransactionInactiveError
            const vehiclesToSave = await Promise.all(finalVehicles.map(async (v) => {
                const photoPromises = v.files.map(f => fileToBase64(f));
                const photoBase64s = await Promise.all(photoPromises);
                return {
                    ...v,
                    photoBase64s
                };
            }));

            // Transactional Save
            await db.transaction('rw', db.tickets, db.vehicles, async () => {
                // 1. Save Ticket
                await db.tickets.add({
                    id: ticketId,
                    municipioId,
                    servicioId,
                    infraccionId,
                    calle,
                    ciudad,
                    fechaInicio: new Date(fechaInicio),
                    fechaFin: fechaFin ? new Date(fechaFin) : undefined,
                    policiaPlaca: placa,
                    policiaFirma: firma || undefined,
                    synced: 0,
                    createdAt: now
                });

                // 2. Save Vehicles
                for (const v of vehiclesToSave) {
                    await db.vehicles.add({
                        id: uuidv4(),
                        localTicketId: ticketId,
                        matricula: v.matricula,
                        marca: v.marcaName || '',
                        modelo: v.modeloName || '',
                        esMoto: v.esMoto,
                        esSobrepeso: v.esSobrepeso,
                        fotos: v.photoBase64s
                    });
                }
            });

            // Try Sync
            let synced = false;
            if (navigator.onLine) {
                try {
                    // @ts-ignore
                    await syncTickets();
                    synced = true;
                } catch (e) {
                    console.warn("Sync failed, saved locally", e);
                }
            }

            alert(synced ? "Servicio guardado y sincronizado." : "Guardado OFFLINE. Se sincronizará al conectar.");
            resetForm();
            window.scrollTo(0, 0);
            router.push('/');

        } catch (error) {
            console.error("Error saving:", error);
            alert("Error al guardar: " + String(error));
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setMunicipioId('');
        setInfraccionId('');
        setCalle('');
        setCiudad('');

        setAddedVehicles([]);
        setMatricula('');
        setMarcaId('');
        setModeloId('');
        setEsMoto(false);
        setEsSobrepeso(false);
        setVehicleFiles([]);

        setFirma(null); // Clear signature
        handleGeolocate();
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* HEADER */}
            <header className="bg-white border-b px-4 py-3 sticky top-0 z-20 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="font-bold text-lg text-slate-800">Nuevo Servicio</h1>
                </div>
                <Button variant="ghost" size="icon" onClick={handleGeolocate} disabled={geoLoading}>
                    <MapPin className={`h-5 w-5 ${geoLoading ? 'animate-pulse text-blue-500' : 'text-slate-500'}`} />
                </Button>
            </header>

            <main className="p-4 space-y-6 max-w-lg mx-auto">

                {/* 1. LOCALIZACIÓN */}
                <section className="space-y-4">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Localización
                    </h2>
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-4 space-y-4">
                            <div className="space-y-2">
                                <Label>Ayuntamiento</Label>
                                <Select onValueChange={setMunicipioId} value={municipioId}>
                                    <SelectTrigger className="bg-slate-50 border-slate-200">
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {municipios?.map((m: any) => (
                                            <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label>Calle</Label>
                                    <Input value={calle} onChange={(e) => setCalle(e.target.value)} placeholder="Calle..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Ciudad</Label>
                                    <Input value={ciudad} onChange={(e) => setCiudad(e.target.value)} placeholder="Ciudad..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Servicio</Label>
                                    <Select onValueChange={setServicioId} value={servicioId}>
                                        <SelectTrigger><SelectValue placeholder="Tipo..." /></SelectTrigger>
                                        <SelectContent>
                                            {servicios?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-500 text-xs">Infracción (Opcional)</Label>
                                <Select onValueChange={setInfraccionId} value={infraccionId}>
                                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                    <SelectContent>
                                        {infracciones?.map((i: any) => <SelectItem key={i.id} value={i.id}>{i.codigo} - {i.descripcion}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>


                            {/* DATES */}
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 mt-2">
                                <div className="space-y-2">
                                    <Label className="text-xs text-slate-500">Inicio Servicio</Label>
                                    <Input
                                        type="datetime-local"
                                        value={fechaInicio}
                                        onChange={(e) => setFechaInicio(e.target.value)}
                                        className="text-xs"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-slate-500">Fin Servicio (Previsto)</Label>
                                    <Input
                                        type="datetime-local"
                                        value={fechaFin}
                                        onChange={(e) => setFechaFin(e.target.value)}
                                        className="text-xs"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* 2. VEHÍCULOS */}
                <section className="space-y-4">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Car className="h-4 w-4" /> Vehículos
                    </h2>

                    {/* ADDED VEHICLES LIST */}
                    {addedVehicles.length > 0 && (
                        <div className="space-y-2 mb-4">
                            {addedVehicles.map((v, i) => (
                                <div key={v.id} className="bg-white p-3 rounded-md border border-l-4 border-l-blue-500 shadow-sm flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-sm tracking-wide">{v.matricula}</div>
                                        <div className="text-xs text-slate-500">{v.marcaName} {v.modeloName}</div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => removeVehicle(v.id)} className="text-red-400 hover:text-red-600">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    <Card className="border-0 shadow-sm">
                        <CardHeader className="bg-slate-50 pb-2 pt-3 border-b border-slate-100 flex flex-row justify-between items-center">
                            <CardTitle className="text-sm font-medium text-slate-700">
                                {addedVehicles.length > 0 ? 'Añadir Otro Vehículo' : 'Datos del Vehículo'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-5">
                            {/* FOTOS */}
                            <div className="space-y-2">
                                <Label>Fotografías</Label>
                                <CameraCapture onImagesCaptured={setVehicleFiles} maxImages={4} />
                            </div>

                            {/* MATRÍCULA */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <Label>Matrícula</Label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs gap-1"
                                        onClick={() => {
                                            if (vehicleFiles.length > 0) handleOCR();
                                            else document.getElementById('ocr-input-hidden')?.click();
                                        }}
                                        disabled={ocrLoading}
                                    >
                                        {ocrLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ScanText className="h-3 w-3" />}
                                        {vehicleFiles.length > 0 ? "Leer F. Existente" : "OCR"}
                                    </Button>
                                    <input id="ocr-input-hidden" type="file" accept="image/*" capture="environment" className="hidden"
                                        onChange={(e) => { if (e.target.files?.[0]) { setVehicleFiles(prev => [...prev, e.target.files![0]]); alert("Foto añadida. Pulsa OCR de nuevo."); } }}
                                    />
                                </div>
                                <Input
                                    value={matricula}
                                    onChange={(e) => setMatricula(e.target.value.toUpperCase())}
                                    className="text-2xl font-mono text-center font-bold tracking-widest uppercase h-14 border-2 focus-visible:ring-blue-500"
                                    placeholder="0000-XXX"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Marca</Label>
                                    <SearchableSelect options={marcaOptions} value={marcaId} onValueChange={(val) => { setMarcaId(val); setModeloId(''); }} placeholder="Marca..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Modelo</Label>
                                    <SearchableSelect options={modeloOptions} value={modeloId} onValueChange={setModeloId} placeholder="Modelo..." disabled={!marcaId} />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-1">
                                <div className="flex items-center space-x-2 border p-2 rounded-md flex-1 justify-center bg-slate-50 cursor-pointer" onClick={() => setEsMoto(!esMoto)}>
                                    <Checkbox id="moto" checked={esMoto} onCheckedChange={(c) => setEsMoto(!!c)} />
                                    <label htmlFor="moto" className="text-sm font-medium cursor-pointer">Moto</label>
                                </div>
                                <div className="flex items-center space-x-2 border p-2 rounded-md flex-1 justify-center bg-slate-50 cursor-pointer" onClick={() => setEsSobrepeso(!esSobrepeso)}>
                                    <Checkbox id="peso" checked={esSobrepeso} onCheckedChange={(c) => setEsSobrepeso(!!c)} />
                                    <label htmlFor="peso" className="text-sm font-medium cursor-pointer">P. Pesado</label>
                                </div>
                            </div>

                            {/* ADD VEHICLE BUTTON */}
                            <Button variant="secondary" className="w-full text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200" onClick={handleAddVehicle}>
                                <Plus className="mr-2 h-4 w-4" /> Guardar Vehículo y Añadir Otro
                            </Button>
                        </CardContent>
                    </Card>
                </section>

                {/* 3. AGENTE */}
                <section className="space-y-4">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Shield className="h-4 w-4" /> Agente
                    </h2>
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-4 space-y-4">
                            <div className="space-y-2">
                                <Label>Número de Placa</Label>
                                <Input value={placa} onChange={(e) => setPlaca(e.target.value)} placeholder="Nº Agente" />
                            </div>
                            <div className="space-y-2">
                                <Label>Firma</Label>
                                <div className="border rounded-md overflow-hidden bg-white">
                                    <SignaturePad onChange={setFirma} defaultValue={null} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* ACTIONS */}
                <div className="pt-4 pb-8">
                    <Button
                        size="lg"
                        className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
                        onClick={handleSubmit}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>Guardando... <Loader2 className="ml-3 h-5 w-5 animate-spin" /></>
                        ) : (
                            <>Finalizar y Guardar <CheckCircle className="ml-3 h-6 w-6" /></>
                        )}
                    </Button>
                </div>
            </main>
        </div >
    );
}

export default function NewTicketPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
            <NewTicketForm />
        </Suspense>
    );
}
