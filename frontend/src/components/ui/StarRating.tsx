import React from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number; // 1-5 or decimal
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  showNumeric?: boolean;
  onChange?: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  size = "md",
  readonly = true,
  showNumeric = true,
  onChange,
}) => {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };

  const starSize = sizeClasses[size];

  const renderStar = (index: number) => {
    const starValue = index + 1;
    const displayRating = hoverRating !== null ? hoverRating : rating;
    const fillPercentage = Math.min(Math.max(displayRating - index, 0), 1);

    return (
      <div
        key={index}
        className="relative inline-block"
        onMouseEnter={() => !readonly && setHoverRating(starValue)}
        onMouseLeave={() => !readonly && setHoverRating(null)}
        onClick={() => !readonly && onChange && onChange(starValue)}
        style={{ cursor: readonly ? "default" : "pointer" }}
      >
        {/* Background star (empty) */}
        <Star className={`${starSize} text-gray-300`} />
        
        {/* Filled star (overlay) */}
        <div
          className="absolute top-0 left-0 overflow-hidden"
          style={{ width: `${fillPercentage * 100}%` }}
        >
          <Star
            className={`${starSize} text-yellow-400 fill-yellow-400`}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[0, 1, 2, 3, 4].map((index) => renderStar(index))}
      </div>
      
      {showNumeric && (
        <span className="ml-1 text-sm text-gray-600 font-medium">
          {rating.toFixed(1)}/5
        </span>
      )}
    </div>
  );
};

export default StarRating;

