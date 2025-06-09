import React from 'react';
import MainLayout from '../layouts/MainLayout';

export default function Home() {
  return (
    <MainLayout>
      <h1 className="font-montserrat text-2xl text-primary">Bem-vindo ao VisionFest!</h1>
      <p className="font-opensans mt-2">Seu sistema completo de gestão para eventos.</p>
    </MainLayout>
  );
}
