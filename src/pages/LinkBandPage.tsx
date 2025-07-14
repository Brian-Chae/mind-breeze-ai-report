import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { LinkbandScreen } from '../components/LinkbandScreen';

export const LinkBandPage: React.FC = () => {
  const navigate = useNavigate();
  
  const handleSectionChange = (section: string) => {
    navigate(`/${section}`);
  };

  return (
    <Layout currentSection="device-manager" onSectionChange={handleSectionChange}>
      <LinkbandScreen />
    </Layout>
  );
}; 