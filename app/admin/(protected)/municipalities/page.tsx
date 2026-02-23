import { getMunicipalities } from './actions';
import { MunicipalitiesClient } from './MunicipalitiesClient';

export default async function MunicipalitiesPage() {
    const data = await getMunicipalities();

    return <MunicipalitiesClient initialData={data} />;
}
