'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Trash2, Plus, Car, Loader2 } from 'lucide-react';
import { updateTicket, deleteVehicle, addVehicle } from './actions';
import { Badge } from '@/components/ui/badge';
import { CameraCapture } from '@/components/pwa/CameraCapture';
// remove Switch if not used, or use it
import { Switch } from '@/components/ui/switch';

interface TicketDetailClientProps {
    ticket: any;
    masterData: {
        municipios: any[];
        servicios: any[];
        infracciones: any[];
        marcas: any[];
        modelos: any[];
    };
    initialTotals: { total: number, vehiclePrices: { id: string, price: number }[] };
}

export function TicketDetailClient({ ticket, masterData, initialTotals }: TicketDetailClientProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        municipioId: ticket.municipioId,
        servicioId: ticket.servicioId,
        infraccionId: ticket.infraccionId || '',
        calle: ticket.calle || '',
        ciudad: ticket.ciudad || '',
        fechaInicio: ticket.fechaInicio.slice(0, 16), // datetime-local format
        fechaFin: ticket.fechaFin ? ticket.fechaFin.slice(0, 16) : '',
        policiaPlaca: ticket.policiaPlaca || '',
        policiaFirma: ticket.policiaFirma || ''
    });

    // Add Vehicle Form State
    const [showAddVehicle, setShowAddVehicle] = useState(false);
    const [newVehicle, setNewVehicle] = useState({
        matricula: '',
        marca: '',
        modelo: '',
        esMoto: false,
        esSobrepeso: false,
        fotos: [] as File[]
    });

    const getPrice = (vid: string) => {
        const found = initialTotals.vehiclePrices.find(p => p.id === vid);
        return found ? found.price : 0;
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        const res = await updateTicket(ticket.id, formData);
        if (res.success) {
            alert('Guardado correctamente');
            router.refresh();
        } else {
            alert('Error al guardar: ' + res.error);
        }
        setLoading(false);
    };

    const handleDeleteVehicle = async (id: string) => {
        if (!confirm("¿Eliminar vehículo?")) return;
        setLoading(true);
        const res = await deleteVehicle(id);
        if (res.success) router.refresh();
        else alert(res.error);
        setLoading(false);
    };

    // Helper to convert File to Base64 (Reused logic)
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleAddVehicleSubmit = async () => {
        if (!newVehicle.matricula || !newVehicle.marca) return alert("Matrícula y marca requeridas");
        setLoading(true);

        try {
            const photoPromises = newVehicle.fotos.map(f => fileToBase64(f));
            const photosBase64 = await Promise.all(photoPromises);

            const res = await addVehicle(ticket.id, {
                matricula: newVehicle.matricula.toUpperCase(),
                marca: newVehicle.marca,
                modelo: newVehicle.modelo,
                esMoto: newVehicle.esMoto,
                esSobrepeso: newVehicle.esSobrepeso,
                fotos: photosBase64
            });

            if (res.success) {
                setShowAddVehicle(false);
                setNewVehicle({ matricula: '', marca: '', modelo: '', esMoto: false, esSobrepeso: false, fotos: [] });
                router.refresh();
            } else {
                alert(res.error);
            }
        } catch (e) {
            console.error(e);
            alert("Error procesando vehículo");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-3xl font-bold text-slate-800">
                    Albarán #{ticket.id.slice(0, 6)}...
                </h1>
                <div className="flex-1"></div>
                <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar Cambios
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN: GENERAL DATA */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Información del Servicio</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Ayuntamiento</Label>
                                    <Select value={formData.municipioId} onValueChange={(val) => handleChange('municipioId', val)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {masterData.municipios.map(m => <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Tipo de Servicio</Label>
                                    <Select value={formData.servicioId} onValueChange={(val) => handleChange('servicioId', val)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {masterData.servicios.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Fecha Inicio</Label>
                                    <Input
                                        type="datetime-local"
                                        value={formData.fechaInicio}
                                        onChange={(e) => handleChange('fechaInicio', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Fecha Fin / Salida Depósito</Label>
                                    <Input
                                        type="datetime-local"
                                        value={formData.fechaFin}
                                        onChange={(e) => handleChange('fechaFin', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Calle</Label>
                                    <Input value={formData.calle} onChange={(e) => handleChange('calle', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Ciudad</Label>
                                    <Input value={formData.ciudad} onChange={(e) => handleChange('ciudad', e.target.value)} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Infracción (Opcional)</Label>
                                <Select value={formData.infraccionId} onValueChange={(val) => handleChange('infraccionId', val)}>
                                    <SelectTrigger><SelectValue placeholder="Ninguna" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Ninguna --</SelectItem>
                                        {masterData.infracciones.map(i => <SelectItem key={i.id} value={i.id}>{i.codigo} - {i.descripcion}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center">
                            <CardTitle>Vehículos Retirados</CardTitle>
                            <Button size="sm" variant="outline" onClick={() => setShowAddVehicle(!showAddVehicle)}>
                                <Plus className="h-4 w-4 mr-2" /> Añadir
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {showAddVehicle && (
                                <div className="bg-slate-50 p-4 rounded-md border border-slate-200 mb-4 animate-in fade-in">
                                    <h4 className="font-bold text-sm mb-3">Nuevo Vehículo</h4>
                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                        <div className="space-y-1">
                                            <Label>Matrícula</Label>
                                            <Input
                                                value={newVehicle.matricula}
                                                onChange={(e) => setNewVehicle({ ...newVehicle, matricula: e.target.value.toUpperCase() })}
                                                className="uppercase font-mono"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Marca (Texto libre o Select)</Label>
                                            <Input
                                                value={newVehicle.marca}
                                                onChange={(e) => setNewVehicle({ ...newVehicle, marca: e.target.value })}
                                                placeholder="Ej. Toyota"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Modelo</Label>
                                            <Input
                                                value={newVehicle.modelo}
                                                onChange={(e) => setNewVehicle({ ...newVehicle, modelo: e.target.value })}
                                                placeholder="Ej. Corolla"
                                            />
                                        </div>
                                        <div className="flex items-center gap-4 pt-4">
                                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                <input type="checkbox" checked={newVehicle.esMoto} onChange={(e) => setNewVehicle({ ...newVehicle, esMoto: e.target.checked })} />
                                                Es Moto
                                            </label>
                                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                <input type="checkbox" checked={newVehicle.esSobrepeso} onChange={(e) => setNewVehicle({ ...newVehicle, esSobrepeso: e.target.checked })} />
                                                Sobrepeso
                                            </label>
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <Label>Fotos (Opcional)</Label>
                                        <CameraCapture onImagesCaptured={(imgs) => setNewVehicle({ ...newVehicle, fotos: imgs })} maxImages={4} />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="ghost" onClick={() => setShowAddVehicle(false)}>Cancelar</Button>
                                        <Button size="sm" onClick={handleAddVehicleSubmit} disabled={loading}>Guardar Vehículo</Button>
                                    </div>
                                </div>
                            )}

                            {ticket.vehiculos.length === 0 && <p className="text-center text-slate-500 py-4">No hay vehículos.</p>}

                            {ticket.vehiculos.map((v: any) => (
                                <div key={v.id} className="flex gap-4 border p-3 rounded-md items-start bg-white transition-all hover:shadow-sm">
                                    <div className="w-24 h-24 bg-slate-100 rounded-md overflow-hidden flex-shrink-0 border">
                                        {v.fotos[0] ? (
                                            <img src={v.fotos[0].url} className="w-full h-full object-cover" alt="v" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400"><Car /></div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-lg font-mono tracking-wide">{v.matricula}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-sm font-medium text-slate-700">{v.marca} {v.modelo}</p>
                                                    <div className="flex gap-1">
                                                        {v.esMoto && <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-200">Moto</Badge>}
                                                        {v.esSobrepeso && <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200">Pesado</Badge>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xl font-bold text-slate-900">
                                                    {getPrice(v.id).toFixed(2)} €
                                                </div>
                                                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Importe</div>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-xs text-slate-400 flex justify-between items-end">
                                            <span>ID: {v.id.slice(-6)}</span>
                                            <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 -mr-2" onClick={() => handleDeleteVehicle(v.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="mt-6 pt-4 border-t flex justify-between items-center bg-slate-50 p-4 rounded-b-md -mx-6 -mb-6">
                                <span className="font-semibold text-slate-600 uppercase text-sm tracking-wider">Total Servicio</span>
                                <span className="text-3xl font-black text-slate-800">{initialTotals.total.toFixed(2)} €</span>
                            </div>

                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: AGENT & METADATA */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Agente / Policia</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Número de Placa</Label>
                                <Input value={formData.policiaPlaca} onChange={(e) => handleChange('policiaPlaca', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Firma (Base64)</Label>
                                {formData.policiaFirma ? (
                                    <div className="border p-2 rounded bg-slate-50 relative">
                                        <img src={formData.policiaFirma} alt="Firma" className="max-h-24 mx-auto" />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute top-1 right-1 h-6 w-6 p-0"
                                            onClick={() => handleChange('policiaFirma', null)}
                                        >
                                            <Trash2 className="h-3 w-3 text-red-500" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-xs text-slate-400 italic text-center border p-4 rounded bg-slate-50">
                                        Sin firma registrada
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Metadatos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between py-1 border-b">
                                <span className="text-slate-500">ID Interno</span>
                                <span className="font-mono text-xs">{ticket.id}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b">
                                <span className="text-slate-500">Creado</span>
                                <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b">
                                <span className="text-slate-500">Actualizado</span>
                                <span>{new Date(ticket.updatedAt).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b">
                                <span className="text-slate-500">Usuario</span>
                                <span>{ticket.user?.username || 'Sistema/Offline'}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
