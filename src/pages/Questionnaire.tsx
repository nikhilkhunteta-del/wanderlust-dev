import { useLocation } from 'react-router-dom';
import { TravelQuestionnaire } from '@/components/questionnaire/TravelQuestionnaire';
import { TravelPreferences } from '@/types/questionnaire';

const Questionnaire = () => {
  const location = useLocation();
  const savedPreferences = location.state?.savedPreferences as Partial<TravelPreferences> | undefined;
  const previousCities = (location.state?.previousCities as string[]) || [];

  return <TravelQuestionnaire savedPreferences={savedPreferences} previousCities={previousCities} />;
};

export default Questionnaire;
