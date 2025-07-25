import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-bold">TransBot</span>
          </div>

          <div className="text-center md:text-right">
            <p className="text-gray-400 text-sm">
              © 2025 TransBot - Aplicación para preparación de exámenes de tránsito
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Desarrollado con React, TypeScript y Flask
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
