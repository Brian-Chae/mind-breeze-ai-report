import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';

export const LinkBandPage: React.FC = () => {
  const navigate = useNavigate();
  
  const handleSectionChange = (section: string) => {
    navigate(`/${section}`);
  };

  return (
    <Layout currentSection="device-manager" onSectionChange={handleSectionChange}>
      <div className="h-full p-6 w-full">
        <div className="w-full">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            LINK BAND
          </h2>
          
          <div className="text-center">
            <p className="text-muted-foreground">실제 디바이스를 연결하고 관리하는 기능을 제공합니다.</p>
            <p className="text-sm text-muted-foreground mt-2">
              This module is coming soon.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}; 