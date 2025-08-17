import React from 'react';
import { User } from '@/lib/models/user.schema';

interface ReplyMilestonesProps {
  user: User;
}

const MILESTONES = {
  BRONZE: 5,
  SILVER: 20,
  GOLD: 50,
  PLATINUM: 75,
  DIAMOND: 100
};

const ReplyMilestones: React.FC<ReplyMilestonesProps> = ({ user }) => {
  const replyCount = user.replyCount || 0;
  
  let starCount = 0;
  let starColor = '';
  let starTitle = '';
  
  if (replyCount >= MILESTONES.DIAMOND) {
    starCount = 5;
    starColor = '#B9F2FF'; // Diamond color (light blue)
    starTitle = 'Diamond (100+ replies)';
  } else if (replyCount >= MILESTONES.PLATINUM) {
    starCount = 4;
    starColor = '#E5E4E2'; // Platinum color (silver-white)
    starTitle = 'Platinum (75+ replies)';
  } else if (replyCount >= MILESTONES.GOLD) {
    starCount = 3;
    starColor = '#FFD700'; // Gold color
    starTitle = 'Gold (50+ replies)';
  } else if (replyCount >= MILESTONES.SILVER) {
    starCount = 2;
    starColor = '#C0C0C0'; // Silver color
    starTitle = 'Silver (20+ replies)';
  } else if (replyCount >= MILESTONES.BRONZE) {
    starCount = 1;
    starColor = '#CD7F32'; // Bronze color
    starTitle = 'Bronze (5+ replies)';
  }
  
  if (starCount === 0) return null;
  
  return (
    <div className="inline-flex items-center" title={starTitle}>
      {Array.from({ length: starCount }).map((_, index) => (
        <svg 
          key={index}
          width="16" 
          height="16" 
          viewBox="-0.5 -0.5 33 33" 
          xmlns="http://www.w3.org/2000/svg"
          className="mx-0.5"
        >
          <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
            <g transform="translate(-903.000000, -411.000000)" fill={starColor}>
              <g transform="translate(37.000000, 169.000000)">
                <g transform="translate(858.000000, 234.000000)">
                  <g transform="translate(7.000000, 8.000000)">
                    <polygon
                      points="27.865 31.83 17.615 26.209 7.462 32.009 9.553 20.362 0.99 12.335 12.532 10.758 17.394 0 22.436 10.672 34 12.047 25.574 20.22"
                    />
                  </g>
                </g>
              </g>
            </g>
          </g>
        </svg>
      ))}
    </div>
  );
};

export default ReplyMilestones;