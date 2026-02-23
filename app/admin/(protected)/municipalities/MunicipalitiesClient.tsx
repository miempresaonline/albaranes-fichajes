'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Map, Plus, Pencil, Trash2 } from 'lucide-react';
import { deleteMunicipality } from './actions';

export function MunicipalitiesClient({ initialData }: { initialData: any[] }) {
    const router = useRouter();

    // Cleanup dialog state as we moved to page
    // const [isDialogOpen, setIsDialogOpen] = useState(false);
    // const [selectedItem, setSelectedItem] = useState<any>(null);

    const handleCreate = () => {
        router.push('/admin/municipalities/new');
    };

    const handleEdit = (item: any) => {
        router.push(`/admin/municipalities/${item.id}`);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // prevent row click if we had it
        if (!confirm('¿Seguro que quieres eliminarlo? Podría tener datos asociados.')) return;
        const res = await deleteMunicipality(id);
        if (!res.success) alert(res.error);
        else router.refresh();
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Map className="h-8 w-8 text-orange-500" />
                    Ayuntamientos
                </h1>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Ayuntamiento
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Listado de Ayuntamientos</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">ID</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Provincia</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Tarifas</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialData.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-mono text-xs">{item.id}</TableCell>
                                    <TableCell className="font-medium">{item.nombre}</TableCell>
                                    <TableCell>{item.provincia || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant={item.isActive ? 'outline' : 'destructive'}>
                                            {item.isActive ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{item.tarifas?.length || 0}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button size="sm" variant="ghost" onClick={() => handleEdit(item)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        {/* Pass event to stop propagation if needed, though here buttons are separate */}
                                        <Button size="sm" variant="ghost" className="text-red-600" onClick={(e) => handleDelete(item.id, e)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {initialData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-slate-500 h-24">
                                        No hay ayuntamientos registrados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
