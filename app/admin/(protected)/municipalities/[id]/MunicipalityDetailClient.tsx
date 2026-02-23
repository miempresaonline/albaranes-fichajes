'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { updateMunicipality, createMunicipality, deleteMunicipality } from '../actions';
import { ArrowLeft, Save, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface TariffRow {
    servicioId: string;
    nombreServicio: string;
    precioDia: number;
    precioNoche: number;
    precioFestivo: number;
    precioPeso: number;
    precioMoto: number;
    precioMotoFestivo: number; // Night/Holiday Moto
    precioPesoFestivo: number; // Night/Holiday Peso
}

interface MunicipalityDetailClientProps {
    municipality: any; // or correct type
    allServices: any[];
}

export function MunicipalityDetailClient({ municipality, allServices }: MunicipalityDetailClientProps) {
    const router = useRouter();
    const isEdit = !!municipality;
    const [loading, setLoading] = useState(false);

    // Fields
    const [id, setId] = useState(municipality?.id || '');
    const [nombre, setNombre] = useState(municipality?.nombre || '');
    const [provincia, setProvincia] = useState(municipality?.provincia || '');
    const [isActive, setIsActive] = useState(municipality?.isActive ?? true);
    const [horarioDiurnoInicio, setHorarioDiurnoInicio] = useState(municipality?.horarioDiurnoInicio || '08:00');
    const [horarioDiurnoFin, setHorarioDiurnoFin] = useState(municipality?.horarioDiurnoFin || '20:00');

    // Tariffs
    const existingTariffs = municipality?.tarifas || [];
    const initialTariffs = allServices.map((s: any) => {
        const found = existingTariffs.find((t: any) => t.servicioId === s.id);
        return {
            servicioId: s.id,
            nombreServicio: s.nombre,
            precioDia: found ? Number(found.precioDia) : 0,
            precioNoche: found ? Number(found.precioNoche) : 0,
            precioFestivo: found ? Number(found.precioFestivo) : 0,
            precioPeso: found ? Number(found.precioPeso) : 0,
            precioPesoFestivo: found ? Number(found.precioPesoFestivo || 0) : 0,
            precioMoto: found ? Number(found.precioMoto) : 0,
            precioMotoFestivo: found ? Number(found.precioMotoFestivo || 0) : 0,
        };
    });

    const [tariffs, setTariffs] = useState<TariffRow[]>(initialTariffs);

    const handleTariffChange = (index: number, field: keyof TariffRow, value: string) => {
        const newTariffs = [...tariffs];
        const numVal = parseFloat(value);
        // @ts-ignore
        newTariffs[index][field] = isNaN(numVal) ? 0 : numVal;
        setTariffs(newTariffs);
    };

    const handleSubmit = async () => {
        setLoading(true);
        const tariffData = tariffs.map(t => ({
            servicioId: t.servicioId,
            precioDia: t.precioDia,
            precioNoche: t.precioNoche,
            precioFestivo: t.precioFestivo,
            precioPeso: t.precioPeso,
            precioPesoFestivo: t.precioPesoFestivo,
            precioMoto: t.precioMoto,
            precioMotoFestivo: t.precioMotoFestivo,
        }));

        const data = {
            nombre, provincia, isActive,
            horarioDiurnoInicio, horarioDiurnoFin,
            tarifas: tariffData
        };

        let res;
        if (isEdit) {
            res = await updateMunicipality(municipality.id, data);
        } else {
            res = await createMunicipality({ id, ...data });
        }

        if (res.success) {
            alert("Guardado correctamente");
            router.push('/admin/municipalities');
            router.refresh();
        } else {
            alert("Error: " + res.error);
        }
        setLoading(false);
    };

    const handleDelete = async () => {
        if (!confirm('¿Seguro que quieres eliminar este ayuntamiento?')) return;
        const res = await deleteMunicipality(municipality.id);
        if (res.success) {
            router.push('/admin/municipalities');
            router.refresh();
        } else {
            alert(res.error);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-6 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{isEdit ? nombre : 'Nuevo Ayuntamiento'}</h1>
                        <p className="text-slate-500">{isEdit ? 'Editar configuración y tarifas' : 'Crear nuevo registro'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isEdit && (
                        <Button variant="destructive" onClick={handleDelete} title="Eliminar Ayuntamiento">
                            <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                        </Button>
                    )}
                    <Button onClick={handleSubmit} disabled={loading} className="min-w-[140px]">
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Config */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Datos Generales</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!isEdit && (
                                <div className="space-y-2">
                                    <Label>ID (Código)</Label>
                                    <Input value={id} onChange={e => setId(e.target.value)} placeholder="v25" />
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label>Nombre</Label>
                                <Input value={nombre} onChange={e => setNombre(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Provincia</Label>
                                <Input value={provincia} onChange={e => setProvincia(e.target.value)} />
                            </div>
                            <div className="flex items-center justify-between border p-3 rounded-md">
                                <Label>Activo</Label>
                                <Switch checked={isActive} onCheckedChange={setIsActive} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Horario Diurno</CardTitle>
                            <CardDescription>Fuera de este horario se aplicará tarifa nocturna.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Inicio</Label>
                                    <Input type="time" value={horarioDiurnoInicio} onChange={e => setHorarioDiurnoInicio(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Fin</Label>
                                    <Input type="time" value={horarioDiurnoFin} onChange={e => setHorarioDiurnoFin(e.target.value)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Tariffs Matrix */}
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Matriz de Tarifas (€)</CardTitle>
                            <CardDescription>Precios base sin IVA. 0 significa gratuito/no definido.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="min-w-[150px]">Servicio</TableHead>
                                            <TableHead className="min-w-[90px]">de día</TableHead>
                                            <TableHead className="min-w-[90px] text-blue-600 bg-blue-50/20">fest/noct</TableHead>
                                            <TableHead className="min-w-[90px] text-purple-600 bg-purple-50/20">Peso</TableHead>
                                            <TableHead className="min-w-[110px] text-purple-700 bg-purple-100/20 font-bold">Peso fest/noct</TableHead>
                                            <TableHead className="min-w-[90px] text-orange-600 bg-orange-50/20">Moto</TableHead>
                                            <TableHead className="min-w-[110px] text-orange-700 bg-orange-100/20 font-bold">Moto Fest/Noct</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tariffs.map((t, index) => (
                                            <TableRow key={t.servicioId}>
                                                <TableCell className="font-medium">{t.nombreServicio}</TableCell>
                                                <TableCell><Input type="number" step="0.01" min="0" value={t.precioDia} onChange={e => handleTariffChange(index, 'precioDia', e.target.value)} /></TableCell>
                                                <TableCell className="bg-blue-50/30">
                                                    <Input type="number" step="0.01" min="0" value={t.precioFestivo} onChange={e => {
                                                        const val = e.target.value;
                                                        handleTariffChange(index, 'precioNoche', val);
                                                        handleTariffChange(index, 'precioFestivo', val);
                                                    }} />
                                                </TableCell>
                                                <TableCell className="bg-purple-50/30"><Input type="number" step="0.01" min="0" value={t.precioPeso} onChange={e => handleTariffChange(index, 'precioPeso', e.target.value)} /></TableCell>
                                                <TableCell className="bg-purple-100/30 font-bold"><Input type="number" step="0.01" min="0" value={t.precioPesoFestivo} onChange={e => handleTariffChange(index, 'precioPesoFestivo', e.target.value)} /></TableCell>
                                                <TableCell className="bg-orange-50/30"><Input type="number" step="0.01" min="0" value={t.precioMoto} onChange={e => handleTariffChange(index, 'precioMoto', e.target.value)} /></TableCell>
                                                <TableCell className="bg-orange-100/30 font-bold"><Input type="number" step="0.01" min="0" value={t.precioMotoFestivo} onChange={e => handleTariffChange(index, 'precioMotoFestivo', e.target.value)} /></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
}
