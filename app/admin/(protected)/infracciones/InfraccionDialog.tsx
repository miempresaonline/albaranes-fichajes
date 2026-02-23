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
import { createInfraccion, updateInfraccion } from './actions';

interface InfraccionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    infraccion?: any;
}

export function InfraccionDialog({ open, onOpenChange, infraccion }: InfraccionDialogProps) {
    const isEdit = !!infraccion;
    const [id, setId] = useState(infraccion?.id || '');
    const [codigo, setCodigo] = useState(infraccion?.codigo || '');
    const [descripcion, setDescripcion] = useState(infraccion?.descripcion || '');
    const [isActive, setIsActive] = useState(infraccion?.isActive ?? true);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        let res;
        if (isEdit) {
            res = await updateInfraccion(infraccion.id, { codigo, descripcion, isActive });
        } else {
            res = await createInfraccion({ id, codigo, descripcion, isActive });
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
                    <DialogTitle>{isEdit ? 'Editar Infracción' : 'Nueva Infracción'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isEdit && (
                        <div className="space-y-2">
                            <Label htmlFor="id">ID Interno</Label>
                            <Input
                                id="id"
                                value={id}
                                onChange={(e) => setId(e.target.value)}
                                placeholder="i10"
                                required
                            />
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="codigo">Código (Visual)</Label>
                        <Input
                            id="codigo"
                            value={codigo}
                            onChange={(e) => setCodigo(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="descripcion">Descripción</Label>
                        <Textarea
                            id="descripcion"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            required
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
