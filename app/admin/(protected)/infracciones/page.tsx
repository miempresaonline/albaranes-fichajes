import { getInfracciones } from './actions';
import { InfraccionesClient } from './InfraccionesClient';

export default async function InfraccionesPage() {
    const data = await getInfracciones();

    return <InfraccionesClient initialData={data} />;
}
