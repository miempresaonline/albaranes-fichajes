'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { createService, updateService } from './actions';

interface ServiceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    service?: any;
}

export function ServiceDialog({ open, onOpenChange, service }: ServiceDialogProps) {
    const isEdit = !!service;
    const [id, setId] = useState(service?.id || '');
    const [nombre, setNombre] = useState(service?.nombre || '');
    const [descripcion, setDescripcion] = useState(service?.descripcion || '');
    const [isActive, setIsActive] = useState(service?.isActive ?? true);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        let res;
        if (isEdit) {
            res = await updateService(service.id, { nombre, descripcion, isActive });
        } else {
            res = await createService({ id, nombre, descripcion, isActive });
        }

        setLoading(false);

        if (res.success) {
            onOpenChange(false);
        } else {
            alert("Error: " + res.error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Editar Servicio' : 'Nuevo Servicio'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isEdit && (
                        <div className="space-y-2">
                            <Label htmlFor="id">ID (Código)</Label>
                            <Input
                                id="id"
                                value={id}
                                onChange={(e) => setId(e.target.value)}
                                placeholder="s1"
                                required
                            />
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre</Label>
                        <Input
                            id="nombre"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="descripcion">Descripción</Label>
                        <Textarea
                            id="descripcion"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
                        <Label htmlFor="active">Activo</Label>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
