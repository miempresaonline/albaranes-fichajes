'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Trash2, Eye, Filter, RefreshCw } from 'lucide-react';
import { deleteAlbaranAdmin, getAlbaranesAdmin } from './actions';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

interface TicketsClientProps {
    initialData: any[];
    municipalities: any[];
    users: any[];
}

export function TicketsClient({ initialData, municipalities, users }: TicketsClientProps) {
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(false);

    // Filters State
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [municipioId, setMunicipioId] = useState('all');
    const [userId, setUserId] = useState('all');

    const handleFilter = async () => {
        setLoading(true);
        try {
            const res = await getAlbaranesAdmin({
                municipioId: municipioId === 'all' ? undefined : municipioId,
                userId: userId === 'all' ? undefined : userId,
                startDate: startDate || undefined,
                endDate: endDate || undefined
            });
            setData(res);
        } catch (error) {
            console.error(error);
            alert("Error al filtrar");
        } finally {
            setLoading(false);
        }
    };

    const handleClearFilters = async () => {
        setStartDate('');
        setEndDate('');
        setMunicipioId('all');
        setUserId('all');
        setLoading(true);
        // Reload all
        const res = await getAlbaranesAdmin({});
        setData(res);
        setLoading(false);
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro que quieres eliminar este albarán DEFINITIVAMENTE?')) return;
        const res = await deleteAlbaranAdmin(id);
        if (!res.success) alert(res.error);
        else {
            // Refresh list cleanly
            handleFilter();
        }
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <FileText className="h-8 w-8 text-blue-500" />
                    Albaranes y Retiradas
                </h1>
            </div>

            {/* Filters Card */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filtros de Búsqueda
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="space-y-2">
                            <Label>Desde Fecha</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Hasta Fecha</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Ayuntamiento</Label>
                            <Select value={municipioId} onValueChange={setMunicipioId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {municipalities.map(m => (
                                        <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Gruista/Usuario</Label>
                            <Select value={userId} onValueChange={setUserId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {users.map(u => (
                                        <SelectItem key={u.id} value={u.id}>{u.username} ({u.name || '-'})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleFilter} className="flex-1" disabled={loading}>
                                {loading ? 'Cargando...' : 'Filtrar'}
                            </Button>
                            <Button onClick={handleClearFilters} variant="outline" size="icon" title="Limpiar Filtros">
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Resultados ({data.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">ID</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Ayuntamiento</TableHead>
                                <TableHead>Servicio</TableHead>
                                <TableHead>Vehículos</TableHead>
                                <TableHead>Usuario</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-mono text-xs">{item.id.substring(0, 6)}...</TableCell>
                                    <TableCell className="text-xs">
                                        {new Date(item.createdAt).toLocaleString()}
                                    </TableCell>
                                    <TableCell>{item.municipio?.nombre || '-'}</TableCell>
                                    <TableCell>{item.servicio?.nombre || '-'}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            {item.vehiculos.map((v: any) => (
                                                <Badge key={v.id} variant="outline" className="text-xs w-fit">
                                                    {v.matricula}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-500">
                                        {item.user?.username || 'Sistema'}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Link href={`/admin/tickets/${item.id}`}>
                                            <Button size="sm" variant="ghost">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </Link>

                                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(item.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-slate-500 h-24">
                                        No se encontraron albaranes con estos filtros.
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
