import { getServices } from './actions';
import { ServicesClient } from './ServicesClient';

export default async function ServicesPage() {
    const data = await getServices();

    return <ServicesClient initialData={data} />;
}
