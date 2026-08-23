import React from 'react';
import { Info } from 'lucide-react';

export function InfoBanner() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 my-4">
      <div className="bg-[#111115] border border-[#1c1c22] rounded-md p-4 flex flex-col gap-3">
        <div className="flex items-start gap-2 text-sm text-[#8b8b92]">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-gray-500" />
          <p>
            If you enjoy the website, please consider sharing it with your friends. Thank you!
          </p>
        </div>
      </div>
    </div>
  );
}

