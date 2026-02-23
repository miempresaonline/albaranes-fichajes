import { FestivosClient } from './FestivosClient';
import { getFestivos } from './actions';

export default async function FestivosPage() {
    const festivos = await getFestivos();
    return <FestivosClient initialData={festivos} />;
}
