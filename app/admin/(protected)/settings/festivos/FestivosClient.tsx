'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { createFestivo, deleteFestivo } from './actions';
import { Trash2 } from 'lucide-react';

interface Festivo {
    id: string;
    nombre: string;
    fecha: Date;
    esGlobal: boolean;
    municipio?: { nombre: string } | null;
}

export function FestivosClient({ initialData }: { initialData: Festivo[] }) {
    const [open, setOpen] = useState(false);
    const [nombre, setNombre] = useState('');
    const [fecha, setFecha] = useState('');
    const [esGlobal, setEsGlobal] = useState(true);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Ensure date is treated as object
        const dateObj = new Date(fecha);

        const res = await createFestivo({
            nombre,
            fecha: dateObj,
            esGlobal
        });

        setLoading(false);
        if (res.success) {
            setOpen(false);
            setNombre('');
            setFecha('');
        } else {
            alert('Error al crear festivo');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro que quieres borrar este día festivo?')) return;
        await deleteFestivo(id);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Gestión de Festivos</h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>+ Nuevo Festivo</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Añadir Día Festivo</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nombre</Label>
                                <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Año Nuevo" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Fecha</Label>
                                <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <Switch checked={esGlobal} onCheckedChange={setEsGlobal} id="global" />
                                <Label htmlFor="global">Es Festivo General (Afecta a todos)</Label>
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Guardando...' : 'Guardar'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-md bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialData.map((f) => (
                            <TableRow key={f.id}>
                                <TableCell>{format(new Date(f.fecha), 'dd/MM/yyyy')}</TableCell>
                                <TableCell className="font-medium">{f.nombre}</TableCell>
                                <TableCell>
                                    {f.esGlobal ? (
                                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">General</span>
                                    ) : (
                                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">{f.municipio?.nombre || 'Local'}</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(f.id)} className="text-red-500 hover:text-red-700">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {initialData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    No hay días festivos configurados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
