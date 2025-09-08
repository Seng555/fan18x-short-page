'use client';

import { FaHeart, FaCommentDots, FaBookmark, FaShare } from 'react-icons/fa';

export default function FloatingActions() {
  return (
    <div className="absolute right-4 bottom-25 flex flex-col items-center space-y-4 z-10">
      {[
        { icon: <FaHeart className="text-white text-xl" />, count: '227.2K' },
        /*{ icon: <FaCommentDots className="text-white text-xl" />, count: '1024' },
        { icon: <FaBookmark className="text-white text-xl" />, count: '12.4K' },
        { icon: <FaShare className="text-white text-xl" />, count: '3267' }*/
      ].map((item, index) => (
        <div key={index} className="flex flex-col items-center cursor-pointer">
          <div className="bg-[#1a1a1a] p-3 rounded-full">
            {item.icon}
          </div>
          <span className="text-white text-sm mt-1">{item.count}</span>
        </div>
      ))}
    </div>
  );
}
